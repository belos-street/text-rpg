import { NextRequest } from "next/server";
import { buildMessages } from "@/lib/prompts";
import { streamChat, checkConfig } from "@/lib/ai";
import {
  createInitialSave,
  getSave,
  updateSave,
  appendConversation,
  getConversation,
  summarizeConversation,
} from "@/lib/storage";
import { parseGameUpdate, narrationPreview } from "@/lib/parser";
import { chatRequestSchema } from "@/lib/schema";
import { getAffectionStage } from "@/lib/affection";
import { generateId } from "@/lib/utils";
import type { ParsedGameUpdate } from "@/lib/schema";
import type { SaveData, GameEvent, Message } from "@/types";

export const runtime = "nodejs";

// 状态变更的唯一合法入口：数值 clamp 到合法区间、day 只增不减（引擎侧硬执法）
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
  if (changes.chapter) next.chapter = changes.chapter;
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
  const { saveId, message, playerName } = bodyResult.data;

  const encoder = new TextEncoder();

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

  const dialogueHistory = getConversation(save.id);
  const messages = buildMessages(save, message || "", dialogueHistory);

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
            if (parsed.harmonyChange !== undefined) {
              payload.harmonyChange = parsed.harmonyChange;
            }
            if (parsed.newItems) {
              payload.newItems = parsed.newItems;
            }
            if (parsed.scene) {
              payload.scene = parsed.scene;
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
        const assistantMsg: Message = {
          role: "assistant",
          content: fullContent,
          day: save!.day,
          chapter: save!.chapter,
        };
        await appendConversation(save!.id, [userMsg, assistantMsg]);

        const updatedDialogueHistory = getConversation(save!.id);
        const summary = summarizeConversation(
          updatedDialogueHistory,
          save!.summary,
        );

        const parsed = parseGameUpdate(fullContent);

        const updateData: Partial<SaveData> = {
          summary,
        };

        if (parsed) {
          const freshSave = getSave(save!.id) || save!;

          if (parsed.stateChanges) {
            Object.assign(
              updateData,
              applyStateChanges(freshSave, parsed.stateChanges),
            );
          }

          if (parsed.affectionChanges) {
            updateData.relations = freshSave.relations.map((r) => {
              const change = parsed.affectionChanges![r.characterId];
              if (change) {
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
        }

        await updateSave(save!.id, updateData);
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

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
