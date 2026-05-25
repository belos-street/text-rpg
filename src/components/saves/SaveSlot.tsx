"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Droplet, Coins, MapPin, Calendar, Trash2 } from "lucide-react"
import type { SaveMeta } from "@/types"

interface SaveSlotProps {
  save: SaveMeta | null
  slotNumber: number
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}

export function SaveSlot({ save, slotNumber, onLoad, onDelete, onNew }: SaveSlotProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge className="text-xs border-zinc-700 text-zinc-500">
            存档位 {slotNumber}
          </Badge>
          {save && (
            <span className="text-[10px] text-zinc-600">
              {new Date(save.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {save ? (
          <div className="space-y-2">
            <CardTitle className="text-base">{save.playerName}</CardTitle>
            <CardDescription className="text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3" />
                {save.location}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3" />
                第{save.day}日 · {save.chapter}
              </div>
            </CardDescription>
            <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <Heart className="size-3 text-red-400" /> {save.hp}/{save.maxHp}
              </span>
              <span className="flex items-center gap-1">
                <Droplet className="size-3 text-blue-400" /> {save.mp}/{save.maxMp}
              </span>
              <span className="flex items-center gap-1">
                <Coins className="size-3 text-yellow-400" /> {save.gold}
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onLoad(save.id)}
              >
                读取存档
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-red-400"
                onClick={() => onDelete(save.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <Button
              variant="outline"
              className="w-full h-20 border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
              onClick={onNew}
            >
              <span className="text-lg mr-2">+</span>
              新建存档
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}