"use client"

import { Heart, Package, BookOpen } from "lucide-react"
import type { Relation, InventoryItem, MemoryItem, AffectionStage } from "@/types"
import { getAffectionStageLabel } from "@/lib/affection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface SidebarProps {
  relations: Relation[]
  inventory: InventoryItem[]
  memories: MemoryItem[]
  harmony: number
  open: boolean
  affectionStages?: AffectionStage[]
}

export function Sidebar({ relations, inventory, memories, harmony, open, affectionStages = [] }: SidebarProps) {
  if (!open) return null

  return (
    <div className="w-72 border-l border-zinc-800 bg-zinc-950/90 backdrop-blur flex flex-col">
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
          <TabsTrigger value="memories" className="flex-1 gap-1">
            <BookOpen className="size-3.5" />
            <span className="text-xs">记忆</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relations" className="flex-1 px-3 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>后宫和睦度</span>
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

        <TabsContent value="memories" className="flex-1 px-3 mt-2">
          <ScrollArea className="h-full">
            {memories.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">暂无重要记忆</p>
            ) : (
              <div className="space-y-2">
                {[...memories]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 20)
                  .map((m) => (
                    <div key={m.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge className="text-[10px] h-4 px-1 border-zinc-700 text-zinc-400">
                          {m.type === "event" ? "事件" : m.type === "decision" ? "抉择" : m.type === "item" ? "道具" : "关系"}
                        </Badge>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(m.createdAt).toLocaleDateString("zh-CN", {
                            year: "numeric", month: "2-digit", day: "2-digit",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{m.content}</p>
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}