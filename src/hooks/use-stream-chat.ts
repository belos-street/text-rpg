import { useRef, useCallback } from "react";
import { extractNarration } from "@/lib/parser";
import type { Choice, Message, MemoryItem, PlayerState } from "@/types";

interface StreamChatCallbacks {
  onStreamStart: () => void;
  onStreamContent: (content: string) => void;
  onChoices: (choices: Choice[]) => void;
  onNewMemory: (memory: Omit<MemoryItem, "id" | "createdAt">) => void;
  onStateChanges: (changes: Partial<PlayerState>) => void;
  onAffectionChanges: (changes: Record<string, number>) => void;
  onAffectionReason: (reason: string) => void;
  onHarmonyChange: (change: number) => void;
  onNewItems: (items: { id: string; name: string }[]) => void;
  onMessage: (msg: Message) => void;
  onError: (msg: Message) => void;
  onStreamEnd: () => void;
}

export interface SendMessageOptions {
  /** C1 重新生成：服务端移除最后一轮后重掷叙述与选项 */
  regenerate?: boolean;
}

export function useStreamChat(callbacks: StreamChatCallbacks) {
  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  const sendMessage = useCallback(
    async (
      sid: string,
      msg: string,
      playerNameForNew?: string,
      options?: SendMessageOptions,
    ) => {
      if (isStreamingRef.current) return;
      isStreamingRef.current = true;
      callbacks.onStreamStart();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saveId: sid,
            message: msg || "",
            playerName: playerNameForNew || undefined,
            regenerate: options?.regenerate || undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "请求失败");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        let fullContent = "";
        let lastNarration = "";
        let buffer = "";
        let hasReceivedContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));

              if (payload.error) {
                fullContent = `[错误] ${payload.error}`;
                callbacks.onStreamContent(fullContent);
                continue;
              }

              if (payload.persistError) {
                callbacks.onError({
                  role: "assistant",
                  content: `[系统] ${payload.persistError}`,
                });
                continue;
              }

              // done 是终止标记，必须在处理完本事件其余字段之后再 break
              // （固定开场序章会把 content 与 done 放在同一个事件里）

              if (payload.content) {
                if (!hasReceivedContent) {
                  hasReceivedContent = true;
                  callbacks.onStreamContent("");
                }
                fullContent = payload.content;
                if (payload.narration) {
                  lastNarration = payload.narration;
                  callbacks.onStreamContent(lastNarration);
                } else {
                  callbacks.onStreamContent(extractNarration(fullContent));
                }
              }

              if (payload.choices) {
                callbacks.onChoices(payload.choices);
              }

              if (payload.newMemory) {
                callbacks.onNewMemory(payload.newMemory);
              }

              if (payload.stateChanges) {
                callbacks.onStateChanges(payload.stateChanges);
              }

              if (payload.affectionChanges) {
                callbacks.onAffectionChanges(payload.affectionChanges);
              }

              if (payload.affectionReason) {
                callbacks.onAffectionReason(payload.affectionReason);
              }

              if (payload.harmonyChange !== undefined) {
                callbacks.onHarmonyChange(payload.harmonyChange);
              }

              if (payload.newItems) {
                callbacks.onNewItems(payload.newItems);
              }

              if (payload.done) break;
            } catch {
              // skip parse errors for partial lines
            }
          }
        }

        if (fullContent) {
          const displayContent = lastNarration || extractNarration(fullContent);
          callbacks.onMessage({ role: "assistant", content: displayContent });
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          callbacks.onError({
            role: "assistant",
            content: `[系统] ${err.message}`,
          });
        }
      } finally {
        isStreamingRef.current = false;
        callbacks.onStreamEnd();
        abortRef.current = null;
      }
    },
    [callbacks],
  );

  const stop = useCallback(() => {
    // 只负责中断：解锁与收尾统一由 sendMessage 的 finally 处理，
    // 避免提前解锁后立刻重发，与服务端旧请求的持久化产生竞态
    abortRef.current?.abort();
  }, []);

  return { sendMessage, stop, isStreamingRef };
}
