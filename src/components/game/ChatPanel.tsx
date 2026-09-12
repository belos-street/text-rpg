'use client'

import { memo, useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NarrativeText } from './NarrativeText'
import type { Message } from '@/types'

interface ChatPanelProps {
  messages: Message[]
  isStreaming: boolean
  currentStreamContent: string
  characterEmoji?: Record<string, string>
  emptyTitle?: string
  emptySubtitle?: string
  selectedDay: number
  currentDay: number
}

// Q4 前端性能：消息行 memo 化——流式期间 currentStreamContent 每 chunk 变化
// 触发列表重渲染时，历史消息行因 props 引用稳定而跳过重渲染
interface MessageRowProps {
  msg: Message
  globalIdx: number
  delay: number
  characterEmoji?: Record<string, string>
}

const MessageRow = memo(function MessageRow({
  msg,
  globalIdx,
  delay,
  characterEmoji
}: MessageRowProps) {
  return (
    <div
      data-msg-index={globalIdx}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-enter transition-shadow duration-300`}
      style={{ animationDelay: `${Math.min(delay, 0.3)}s` }}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          msg.role === 'user'
            ? 'bg-primary/20 text-primary-foreground rounded-br-md shadow-[0_0_0_1px_rgba(94,106,210,0.2),0_2px_8px_rgba(0,0,0,0.3)]'
            : 'bg-zinc-800/50 text-zinc-100 rounded-bl-md border border-zinc-700/50 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3)]'
        }`}>
        {msg.role === 'user' ? (
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
  )
})

// 单日内的消息分页上限：超出时只渲染最新一页，"加载更早"按钮按页展开
const MESSAGE_PAGE_SIZE = 50

export function ChatPanel({
  messages,
  isStreaming,
  currentStreamContent,
  characterEmoji,
  emptyTitle,
  emptySubtitle,
  selectedDay,
  currentDay
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [dayMessageLimit, setDayMessageLimit] = useState(MESSAGE_PAGE_SIZE)

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      requestAnimationFrame(() => {
        viewportRef.current?.scrollTo({
          top: viewportRef.current.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  }, [])

  const displayMessages = useMemo(
    () => messages.filter((m) => m.role !== 'system'),
    [messages]
  )

  const filteredMessages = useMemo(
    () => displayMessages.filter((m) => (m.day ?? 1) === selectedDay),
    [displayMessages, selectedDay]
  )

  // 切换查看的日期时重置分页（渲染期状态调整，官方推荐模式）
  const [prevSelectedDay, setPrevSelectedDay] = useState(selectedDay)
  if (prevSelectedDay !== selectedDay) {
    setPrevSelectedDay(selectedDay)
    setDayMessageLimit(MESSAGE_PAGE_SIZE)
  }

  const hiddenCount = Math.max(0, filteredMessages.length - dayMessageLimit)
  const visibleMessages = useMemo(
    () =>
      hiddenCount > 0 ? filteredMessages.slice(hiddenCount) : filteredMessages,
    [filteredMessages, hiddenCount]
  )

  const globalIndexMap = useMemo(() => {
    const map: number[] = []
    for (let i = 0; i < displayMessages.length; i++) {
      if ((displayMessages[i].day ?? 1) === selectedDay) {
        map.push(i)
      }
    }
    return map
  }, [displayMessages, selectedDay])

  const loadEarlier = useCallback(() => {
    setDayMessageLimit((limit) => limit + MESSAGE_PAGE_SIZE)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [filteredMessages.length, currentStreamContent, scrollToBottom])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea
        className="flex-1 px-4"
        ref={scrollRef}
        viewportRef={viewportRef}>
        <div className="space-y-4 py-4 max-w-3xl mx-auto">
          {filteredMessages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-zinc-600">
              <p className="text-lg">{emptyTitle || '冒险即将开始...'}</p>
              <p className="text-sm">
                {emptySubtitle || '输入你的名字，开启异世界之旅'}
              </p>
            </div>
          )}

          {hiddenCount > 0 && (
            <button
              onClick={loadEarlier}
              className="mx-auto block text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 transition-colors">
              加载更早的消息（还有 {hiddenCount} 条）
            </button>
          )}

          {visibleMessages.map((msg, j) => {
            const globalIdx = globalIndexMap[hiddenCount + j]
            return (
              <MessageRow
                key={`${selectedDay}-${hiddenCount + j}`}
                msg={msg}
                globalIdx={globalIdx}
                delay={j * 0.04}
                characterEmoji={characterEmoji}
              />
            )
          })}

          {isStreaming &&
            currentStreamContent &&
            selectedDay === currentDay && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3)]">
                  <span className="whitespace-pre-wrap text-sm leading-relaxed">
                    <NarrativeText
                      text={currentStreamContent}
                      characterEmoji={characterEmoji}
                    />
                    <span className="inline-block w-1.5 h-4 bg-primary/70 ml-0.5 animate-stream-cursor" />
                  </span>
                </div>
              </div>
            )}
        </div>
      </ScrollArea>
    </div>
  )
}
