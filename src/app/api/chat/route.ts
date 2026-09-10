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
import { getAffectionStage } from "@/lib/affection";
import { generateId } from "@/lib/utils";
import type { SaveData, GameEvent, Message } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!checkConfig()) {
    return new Response(
      JSON.stringify({
        error: "AI 配置未设置，请在 .env 中配置 AI_BASE_URL 和 AI_API_KEY",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  const { saveId, message, playerName } = await req.json();

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

      try {
        for await (const chunk of streamChat(messages)) {
          fullContent += chunk;

          const parsed = parseGameUpdate(fullContent);

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
              payload.stateChanges = parsed.stateChanges;
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
        };
        const assistantMsg: Message = {
          role: "assistant",
          content: fullContent,
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
            updateData.hp = parsed.stateChanges.hp ?? freshSave.hp;
            updateData.mp = parsed.stateChanges.mp ?? freshSave.mp;
            updateData.gold = parsed.stateChanges.gold ?? freshSave.gold;
            if (parsed.stateChanges.location)
              updateData.location = parsed.stateChanges.location;
            if (parsed.stateChanges.chapter)
              updateData.chapter = parsed.stateChanges.chapter;
            if (parsed.stateChanges.day)
              updateData.day = parsed.stateChanges.day;
            if (parsed.stateChanges.time)
              updateData.time = parsed.stateChanges.time;
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
