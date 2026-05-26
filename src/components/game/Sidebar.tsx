"use client"

import { useMemo, useState } from "react"
import { Heart, Package, BookOpen, ChevronRight, ChevronDown } from "lucide-react"
import type { Relation, InventoryItem, MemoryItem, AffectionStage, Message } from "@/types"
import { getAffectionStageLabel } from "@/lib/affection"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface SidebarProps {
  relations: Relation[]
  inventory: InventoryItem[]
  memories: MemoryItem[]
  messages: Message[]
  harmony: number
  open: boolean
  affectionStages?: AffectionStage[]
  selectedDay: number
  currentDay: number
  onDayChange: (day: number) => void
  onMemoryClick?: (messageIndex: number) => void
}

export function Sidebar({
  relations,
  inventory,
  memories,
  messages,
  harmony,
  open,
  affectionStages = [],
  selectedDay,
  currentDay,
  onDayChange,
  onMemoryClick,
}: SidebarProps) {
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set())

  const chapterTree = useMemo(() => {
    const chapterMap = new Map<string, Set<number>>()
    for (const m of messages) {
      const ch = m.chapter || "未知章节"
      if (!chapterMap.has(ch)) chapterMap.set(ch, new Set())
      if (m.day != null) chapterMap.get(ch)!.add(m.day)
    }
    if (chapterMap.size === 0) {
      for (const mem of memories) {
        const ch = mem.chapter || "未知章节"
        if (!chapterMap.has(ch)) chapterMap.set(ch, new Set())
        if (mem.day != null) chapterMap.get(ch)!.add(mem.day)
      }
      if (chapterMap.size === 0) chapterMap.set("未知章节", new Set([1]))
    }
    const tree: {
      chapter: string
      days: { day: number; memories: MemoryItem[] }[]
    }[] = []
    for (const [chapter, daySet] of chapterMap) {
      const days = Array.from(daySet).sort((a, b) => a - b)
      tree.push({
        chapter,
        days: days.map((day) => ({
          day,
          memories: memories.filter(
            (m) => (m.chapter ?? chapter) === chapter && (m.day ?? 1) === day,
          ),
        })),
      })
    }
    return tree
  }, [messages, memories])

  const toggleChapter = (chapter: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chapter)) {
        next.delete(chapter)
      } else {
        next.add(chapter)
      }
      return next
    })
  }

  const isCurrentDay = (day: number) => day === currentDay
  const isSelectedDay = (day: number) => day === selectedDay

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => {}}
        />
      )}
      <div
        className={cn(
          "w-72 border-l border-zinc-800 bg-zinc-950/90 backdrop-blur flex flex-col transition-transform duration-300",
          "fixed right-0 top-0 bottom-0 z-50 md:static md:z-0",
          open ? "translate-x-0" : "translate-x-full md:hidden",
        )}
      >
      <Tabs defaultValue="relations" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-3">
          <TabsTrigger value="relations" className="flex-1 gap-1">
            <Heart className="size-3.5" />
            <span className="text-xs">关系</span>
          </TabsTrigger>
          <TabsTrigger value="items" className="flex-1 gap-1">
            <Package className="size-3.5" />
            <span className="text-xs">背包</span>
          </TabsTrigger>
          <TabsTrigger value="chapters" className="flex-1 gap-1">
            <BookOpen className="size-3.5" />
            <span className="text-xs">章节</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relations" className="flex-1 px-3 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>好感度</span>
              <span className={harmony >= 60 ? "text-pink-400" : harmony >= 40 ? "text-yellow-400" : "text-red-400"}>
                {harmony}/100
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                style={{ width: `${harmony}%` }}
              />
            </div>
            {relations.map((r) => (
              <div key={r.characterId} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-200">{r.characterName}</span>
                  <Badge className="text-[10px] h-4 px-1.5 bg-pink-500/10 text-pink-400 border-pink-500/20">
                    {getAffectionStageLabel(r.affection, affectionStages)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pink-500 transition-all duration-500"
                      style={{ width: `${r.affection}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums w-8 text-right">{r.affection}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="items" className="flex-1 px-3 mt-2">
          <ScrollArea className="h-full">
            {inventory.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">背包空空如也</p>
            ) : (
              <div className="space-y-1.5">
                {inventory.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-2">
                    <span className="text-sm text-zinc-200">{item.itemName}</span>
                    {item.quantity > 1 && (
                      <Badge className="text-[10px] h-4 px-1.5 bg-zinc-800 text-zinc-400">
                        x{item.quantity}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="chapters" className="flex-1 px-3 mt-2">
          <ScrollArea className="h-full">
            {chapterTree.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">暂无章节数据</p>
            ) : (
              <div className="space-y-1">
                {chapterTree.map((ch) => {
                  const isOpen = openChapters.has(ch.chapter)
                  const chapterActive = ch.days.some((d) => isSelectedDay(d.day))
                  return (
                    <div key={ch.chapter} className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                      <button
                        onClick={() => toggleChapter(ch.chapter)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors",
                          chapterActive ? "bg-primary/10" : "hover:bg-zinc-800/50",
                        )}
                      >
                        {isOpen ? (
                          <ChevronDown className="size-3.5 shrink-0 text-zinc-500" />
                        ) : (
                          <ChevronRight className="size-3.5 shrink-0 text-zinc-500" />
                        )}
                        <span className={cn(
                          "text-xs font-medium",
                          chapterActive ? "text-primary" : "text-zinc-300",
                        )}>
                          {ch.chapter}
                        </span>
                        <span className="text-[10px] text-zinc-600 ml-auto">
                          {ch.days.length}天
                        </span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-zinc-800/50">
                          {ch.days.map((d) => {
                            const daySelected = isSelectedDay(d.day)
                            const dayCurrent = isCurrentDay(d.day)
                            return (
                              <div key={d.day}>
                                <button
                                  onClick={() => {
                                    onDayChange(d.day)
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                                    daySelected
                                      ? "bg-primary/10 text-primary"
                                      : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-300",
                                  )}
                                >
                                  <span className="text-[10px] font-mono w-14 shrink-0">
                                    Day {d.day}
                                  </span>
                                  <div className="flex-1" />
                                  {dayCurrent && (
                                    <span className="text-[9px] text-emerald-500 font-medium">当前</span>
                                  )}
                                  {d.memories.length > 0 && (
                                    <span className="text-[10px] text-zinc-600">{d.memories.length}条</span>
                                  )}
                                </button>

                                {daySelected && d.memories.length > 0 && (
                                  <div className="pb-1">
                                    {d.memories.map((mem) => (
                                      <div
                                        key={mem.id}
                                        onClick={() => {
                                          onDayChange(d.day)
                                          if (mem.messageIndex != null && onMemoryClick) {
                                            setTimeout(() => onMemoryClick(mem.messageIndex!), 50)
                                          }
                                        }}
                                        className={cn(
                                          "flex items-start gap-2 ml-12 mr-2 px-2 py-1.5 rounded-md transition-colors",
                                          mem.messageIndex != null && onMemoryClick
                                            ? "cursor-pointer hover:bg-zinc-800/50"
                                            : "",
                                        )}
                                      >
                                        <span className="text-[10px] mt-0.5 shrink-0">
                                          {mem.type === "event" ? "📖" : mem.type === "decision" ? "⚖️" : mem.type === "item" ? "🎒" : "💕"}
                                        </span>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                                          {mem.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      </div>
    </>
  )
}