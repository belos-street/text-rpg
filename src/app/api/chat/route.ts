import { NextRequest } from "next/server";
import { buildMessages } from "@/lib/prompts";
import { streamChat, checkConfig } from "@/lib/ai";
import {
  createInitialSave,
  getSave,
  updateSave,
  appendConversation,
  getConversation,
  countConversation,
  summarizeConversation,
  popLastTurn,
  searchMemories,
  type MemoryHit,
} from "@/lib/storage";
import { summarizeSaveIfStale } from "@/lib/summary";
import { loadStoryConfig } from "@/lib/game-data";
import { parseGameUpdate, narrationPreview } from "@/lib/parser";
import { chatRequestSchema } from "@/lib/schema";
import { getAffectionStage } from "@/lib/affection";
import { generateId } from "@/lib/utils";
import { unlockEnding } from "@/lib/global-progress";
import type { ParsedGameUpdate } from "@/lib/schema";
import type { SaveData, GameEvent, Message } from "@/types";

export const runtime = "nodejs";

// 状态变更的唯一合法入口：数值 clamp 到合法区间、day 只增不减、章节枚举校验（引擎侧硬执法）
function applyStateChanges(
  save: SaveData,
  changes: NonNullable<ParsedGameUpdate["stateChanges"]>,
): Partial<SaveData> {
  const next: Partial<SaveData> = {};
  if (changes.hp !== undefined) {
    next.hp = Math.max(0, Math.min(save.maxHp, changes.hp));
  }
  if (changes.mp !== undefined) {
    next.mp = Math.max(0, Math.min(save.maxMp, changes.mp));
  }
  if (changes.gold !== undefined) {
    next.gold = Math.max(0, changes.gold);
  }
  if (changes.day !== undefined) {
    next.day = Math.max(save.day, Math.floor(changes.day));
  }
  if (changes.location) next.location = changes.location;
  if (changes.chapter) {
    // B8：章节枚举校验——不在配置列表中的章节变更直接忽略
    const chapters = loadStoryConfig().chapters;
    if (!chapters || chapters.length === 0 || chapters.includes(changes.chapter)) {
      next.chapter = changes.chapter;
    }
  }
  if (changes.time) next.time = changes.time;
  return next;
}

export async function POST(req: NextRequest) {
  if (!checkConfig()) {
    return new Response(
      JSON.stringify({
        error: "AI 配置未设置，请在 .env 中配置 AI_BASE_URL 和 AI_API_KEY",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "请求体必须是合法 JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const bodyResult = chatRequestSchema.safeParse(rawBody);
  if (!bodyResult.success) {
    return new Response(
      JSON.stringify({
        error: `请求参数不合法: ${bodyResult.error.issues[0]?.message ?? ""}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const { saveId, message, playerName, regenerate, debug } = bodyResult.data;

  const encoder = new TextEncoder();
  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  let save: SaveData | null = null;

  if (saveId) {
    save = getSave(saveId);
  }

  if (!save && playerName) {
    save = createInitialSave(playerName);
  }

  if (!save) {
    return new Response(JSON.stringify({ error: "未找到存档" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // C1 重新生成：移除最后一轮对话，状态以首次生成为准（narration/choices 重掷）
  const isRegenerate = regenerate === true;
  if (isRegenerate) {
    const popped = await popLastTurn(save.id);
    if (!popped) {
      return new Response(JSON.stringify({ error: "没有可重新生成的回合" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // #18：提示词只需最近 10 条（buildMessages 内部窗口一致），长战役不再全量加载
  const dialogueHistory = getConversation(save.id, 10);
  const storyConfig = loadStoryConfig();

  // RAG 阶段 2：FTS 检索早期剧情片段（AI_RECALL=off 可关；消息总数超阈值才启用，
  // 更早的内容才叫"回忆"，提示词窗口内的不需要检索）
  const RECALL_MIN_MESSAGES = Number(process.env.AI_RECALL_MIN || 14);
  let relatedMemories: MemoryHit[] = [];
  if (
    message &&
    !isRegenerate &&
    (process.env.AI_RECALL || "on").toLowerCase() !== "off" &&
    countConversation(save.id) > RECALL_MIN_MESSAGES
  ) {
    const recallQuery = [
      message,
      ...save.relations
        .filter((r) => r.affection > 0)
        .slice(0, 5)
        .map((r) => r.characterName),
      save.location,
    ].join(" ");
    relatedMemories = searchMemories(save.id, recallQuery);
  }

  // C2 固定开场序章：新档且配置了 openingNarration 时零延迟返回，不调用 LLM
  if (!message && dialogueHistory.length === 0 && storyConfig.openingNarration) {
    const opening = storyConfig.openingNarration;
    const userMsg: Message = {
      role: "user",
      content: "开始游戏",
      day: save.day,
      chapter: save.chapter,
    };
    const assistantMsg: Message = {
      role: "assistant",
      content: opening,
      day: save.day,
      chapter: save.chapter,
    };
    await appendConversation(save.id, [userMsg, assistantMsg]);

    const stream = new ReadableStream({
      start(controller) {
        // content 与 done 必须分开发送：客户端把 done 视为终止标记，
        // 同包发送会导致内容被丢弃
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ content: opening, narration: opening, choices: [] })}\n\n`,
          ),
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        );
        controller.close();
      },
    });
    return new Response(stream, { headers: sseHeaders });
  }

  const messages = buildMessages(
    save,
    message || "",
    dialogueHistory,
    relatedMemories,
  );

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      // 解析字段只发一次：JSON 闭合后的尾随 chunk 会让 parseGameUpdate 反复成功，
      // 增量字段（harmonyChange/affectionChanges/newItems）若重复 emit 会被前端重复累加
      let updateEmitted = false;
      // 花括号平衡计数：JSON 闭合前跳过重解析，避免流式期间 O(n²) 的解析开销
      let openBraces = 0;

      try {
        for await (const chunk of streamChat(messages)) {
          fullContent += chunk;
          for (const ch of chunk) {
            if (ch === "{") openBraces++;
            else if (ch === "}") openBraces--;
          }

          const parsed =
            openBraces <= 0 && fullContent.includes("{")
              ? parseGameUpdate(fullContent)
              : null;

          const payload: Record<string, unknown> = {
            content: fullContent,
            narration:
              parsed && parsed.narration !== ""
                ? parsed.narration
                : narrationPreview(fullContent),
            choices: parsed?.choices ?? [],
          };

          if (parsed && !updateEmitted) {
            updateEmitted = true;
            if (parsed.newMemory) {
              payload.newMemory = parsed.newMemory;
            }
            if (parsed.stateChanges) {
              payload.stateChanges = applyStateChanges(save, parsed.stateChanges);
            }
            if (parsed.affectionChanges) {
              payload.affectionChanges = parsed.affectionChanges;
            }
            if (parsed.affectionReason) {
              payload.affectionReason = parsed.affectionReason;
            }
            if (parsed.flagsChanges) {
              payload.flagsChanges = parsed.flagsChanges;
            }
            if (parsed.harmonyChange !== undefined) {
              payload.harmonyChange = parsed.harmonyChange;
            }
            if (parsed.newItems) {
              payload.newItems = parsed.newItems;
            }
            if (parsed.scene) {
              payload.scene = parsed.scene;
            }
            if (parsed.ending) {
              payload.ending = parsed.ending;
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        );
      } catch (error) {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "未知错误" })}\n\n`,
            ),
          );
        } catch {}
      }

      try {
        const userMsg: Message = {
          role: "user",
          content: message || "开始游戏",
          day: save!.day,
          chapter: save!.chapter,
        };
        // LLM 完全失败（如模型服务离线）时只保留玩家消息，
        // 空 assistant 消息入库会污染历史并误导后续回合
        const msgs: Message[] = [userMsg];
        if (fullContent.trim()) {
          const assistantMsg: Message = {
            role: "assistant",
            content: fullContent,
            day: save!.day,
            chapter: save!.chapter,
          };
          msgs.push(assistantMsg);
        }
        await appendConversation(save!.id, msgs);

        // #18：启发式摘要只需最近 6 条
        const updatedDialogueHistory = getConversation(save!.id, 6);
        const summary = summarizeConversation(
          updatedDialogueHistory,
          save!.summary,
        );

        const parsed = parseGameUpdate(fullContent);

        const updateData: Partial<SaveData> = {
          summary,
        };

        // C1 重新生成：只重掷叙述与选项，状态以首次生成为准（避免好感度等增量被重复应用）
        if (parsed && !isRegenerate) {
          const freshSave = getSave(save!.id) || save!;

          if (parsed.stateChanges) {
            Object.assign(
              updateData,
              applyStateChanges(freshSave, parsed.stateChanges),
            );
          }

          if (parsed.affectionChanges) {
            updateData.relations = freshSave.relations.map((r) => {
              // B6：单回合好感度变化硬执法，clamp ±10
              const raw = parsed.affectionChanges![r.characterId] ?? 0;
              const change = Math.max(-10, Math.min(10, raw));
              if (change !== 0) {
                const newAffection = Math.max(
                  0,
                  Math.min(100, r.affection + change),
                );
                return {
                  ...r,
                  affection: newAffection,
                  stage: getAffectionStage(newAffection),
                };
              }
              return r;
            });
          }

          if (parsed.harmonyChange !== undefined) {
            updateData.harmony = Math.max(
              0,
              Math.min(100, freshSave.harmony + parsed.harmonyChange),
            );
          }

          if (parsed.newItems) {
            const currentItems = [...freshSave.inventory];
            for (const newItem of parsed.newItems) {
              const existing = currentItems.find(
                (i) => i.itemId === newItem.id,
              );
              if (existing) {
                existing.quantity += 1;
              } else {
                currentItems.push({
                  itemId: newItem.id,
                  itemName: newItem.name,
                  quantity: 1,
                });
              }
            }
            updateData.inventory = currentItems;
          }

          if (parsed.newMemory) {
            const event: GameEvent = parsed.newMemory;
            const alreadyExists = freshSave.memories.some(
              (m) => m.type === event.type && m.content === event.content,
            );
            if (!alreadyExists) {
              updateData.memories = [
                ...freshSave.memories,
                {
                  id: generateId(),
                  type: event.type,
                  content: event.content,
                  importance: event.importance,
                  createdAt: new Date().toISOString(),
                  day: freshSave.day,
                  chapter: freshSave.chapter,
                },
              ];
            }
          }

          if (parsed.scene) {
            updateData.scene = parsed.scene;
          }

          if (parsed.flagsChanges) {
            // B5：剧情标记合并（LLM 只能输出配置声明的白名单 key——由结构化输出语法层保证）
            updateData.flags = { ...(freshSave.flags ?? {}), ...parsed.flagsChanges };
          }

          if (parsed.ending) {
            // C6：结局解锁写入跨存档全局进度
            try {
              unlockEnding(parsed.ending);
            } catch (progressError) {
              console.error("[chat] 结局图鉴解锁失败:", progressError);
            }
          }
        }

        await updateSave(save!.id, updateData);

        // M3 真 LLM 摘要：累计足够新消息后异步执行，不阻塞本回合响应；
        // 失败静默（下回合重试），AI_SUMMARY=off 可关闭
        const summarySeq = save!.summarySeq;
        const prevSummary = save!.summary;
        const totalMessages = countConversation(save!.id);
        void summarizeSaveIfStale(
          save!.id,
          prevSummary,
          getConversation(save!.id, 14),
          totalMessages,
          summarySeq,
        ).catch(() => {});

        // D4 调试面板：附带诊断信息（请求提示词预览/原始输出/解析结果/耗时）
        if (debug) {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  debug: {
                    requestMessages: messages.map((m) => ({
                      role: m.role,
                      chars: m.content.length,
                      preview: m.content.slice(0, 800),
                    })),
                    totalPromptChars: messages.reduce(
                      (sum, m) => sum + m.content.length,
                      0,
                    ),
                    rawOutput: fullContent.slice(0, 2000),
                    rawOutputChars: fullContent.length,
                    parsedOk: !!parsed,
                    choicesCount: parsed?.choices?.length ?? 0,
                    relatedMemories: relatedMemories.length,
                    totalMessages,
                  },
                })}\n\n`,
              ),
            );
          } catch {}
        }
      } catch (error) {
        console.error("[chat] 存档持久化失败:", error);
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ persistError: "本回合进度保存失败，最新状态可能未写入存档，请查看服务端日志" })}\n\n`,
            ),
          );
        } catch {}
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}