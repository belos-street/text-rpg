"use client"

import { useCallback, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NarrativeText } from "./NarrativeText"
import type { Message } from "@/types"

interface ChatPanelProps {
  messages: Message[]
  isStreaming: boolean
  currentStreamContent: string
  characterEmoji?: Record<string, string>
  emptyTitle?: string
  emptySubtitle?: string
}

export function ChatPanel({ messages, isStreaming, currentStreamContent, characterEmoji, emptyTitle, emptySubtitle }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      requestAnimationFrame(() => {
        viewportRef.current?.scrollTo({
          top: viewportRef.current.scrollHeight,
          behavior: "smooth",
        })
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamContent, scrollToBottom])

  const displayedMessages = messages.filter((m) => m.role !== "system")

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollRef} viewportRef={viewportRef}>
      <div className="space-y-4 py-4 max-w-3xl mx-auto">
        {displayedMessages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-zinc-600">
            <p className="text-lg">{emptyTitle || "冒险即将开始..."}</p>
            <p className="text-sm">{emptySubtitle || "输入你的名字，开启异世界之旅"}</p>
          </div>
        )}

        {displayedMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-message-enter`}
            style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary/20 text-primary-foreground rounded-br-md shadow-[0_0_0_1px_rgba(94,106,210,0.2),0_2px_8px_rgba(0,0,0,0.3)]"
                  : "bg-zinc-800/50 text-zinc-100 rounded-bl-md border border-zinc-700/50 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3)]"
              }`}
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
                  <span className="inline-flex items-start gap-1.5">
                    <span className="shrink-0 text-base leading-relaxed">🧑</span>
                    <span>{msg.content}</span>
                  </span>
                </p>
              ) : (
                <NarrativeText text={msg.content} characterEmoji={characterEmoji} />
              )}
            </div>
          </div>
        ))}

        {isStreaming && currentStreamContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3)]">
              <span className="whitespace-pre-wrap text-sm leading-relaxed">
                <NarrativeText text={currentStreamContent} characterEmoji={characterEmoji} />
                <span className="inline-block w-1.5 h-4 bg-primary/70 ml-0.5 animate-stream-cursor" />
              </span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
