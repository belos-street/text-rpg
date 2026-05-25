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
import type { SaveData, GameUpdate, Choice, GameEvent, Message } from "@/types";

export const runtime = "nodejs";

function parseGameUpdate(text: string): GameUpdate | null {
  const jsonMatch = text.match(/\{[\s\S]*"type"\s*:\s*"game_update"[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as GameUpdate;
  } catch {
    return null;
  }
}

function extractNarration(text: string): string {
  const parsed = parseGameUpdate(text);
  if (parsed?.narration) return parsed.narration;
  const cleaned = text
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();
  return cleaned || text;
}

function extractChoices(text: string): Choice[] {
  const parsed = parseGameUpdate(text);
  if (parsed?.choices && parsed.choices.length > 0) {
    return parsed.choices;
  }
  return [];
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

      try {
        for await (const chunk of streamChat(messages)) {
          fullContent += chunk;

          const currentChoices = extractChoices(fullContent);

          const payload: Record<string, unknown> = {
            content: fullContent,
            narration: extractNarration(fullContent),
            choices: currentChoices,
          };

          const parsed = parseGameUpdate(fullContent);
          if (parsed) {
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
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "未知错误" })}\n\n`,
          ),
        );
      } finally {
        controller.close();
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
        appendConversation(save!.id, [userMsg, assistantMsg]);

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
                  stage:
                    newAffection <= 20
                      ? "stranger"
                      : newAffection <= 40
                        ? "acquainted"
                        : newAffection <= 60
                          ? "friend"
                          : newAffection <= 80
                            ? "intimate"
                            : newAffection <= 95
                              ? "close"
                              : "lover",
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
              const now = new Date();
              const timestamp =
                now.getFullYear() +
                "-" +
                String(now.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(now.getDate()).padStart(2, "0") +
                "T" +
                String(now.getHours()).padStart(2, "0") +
                ":" +
                String(now.getMinutes()).padStart(2, "0") +
                ":" +
                String(now.getSeconds()).padStart(2, "0");
              updateData.memories = [
                ...freshSave.memories,
                {
                  id: Math.random().toString(36).substring(2),
                  type: event.type,
                  content: event.content,
                  importance: event.importance,
                  createdAt: timestamp,
                },
              ];
            }
          }

          if (parsed.scene) {
            updateData.scene = parsed.scene;
          }
        }

        updateSave(save!.id, updateData);
      } catch {
        // silent
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
