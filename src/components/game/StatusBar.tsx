"use client"

import { Heart, Droplet, Coins, MapPin, Sun, Moon } from "lucide-react"
import type { PlayerState } from "@/types"
import { cn } from "@/lib/utils"

interface StatusBarProps {
  state: PlayerState
}

export function StatusBar({ state }: StatusBarProps) {
  const hpPercent = (state.hp / state.maxHp) * 100
  const mpPercent = (state.mp / state.maxMp) * 100
  const isNight = state.time?.includes("夜晚") || state.time?.includes("深夜")

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="flex items-center gap-3 px-4 py-2 text-sm">
        <div className="flex items-center gap-1.5 min-w-[90px]">
          <Heart className="size-4 fill-red-500 text-red-500" />
          <span className="text-red-400 font-medium tabular-nums">
            {state.hp}/{state.maxHp}
          </span>
        </div>

        <div className="flex items-center gap-1.5 min-w-[80px]">
          <Droplet className="size-4 fill-blue-500 text-blue-500" />
          <span className="text-blue-400 font-medium tabular-nums">
            {state.mp}/{state.maxMp}
          </span>
        </div>

        <div className="flex items-center gap-1.5 min-w-[70px]">
          <Coins className="size-4 text-yellow-500" />
          <span className="text-yellow-400 font-medium tabular-nums">{state.gold}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
          <MapPin className="size-3.5" />
          <span className="text-xs truncate max-w-[120px]">{state.location}</span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span className="hidden sm:inline">
            {state.chapter}
          </span>
          <span>
            第{state.day}日
          </span>
          <span className={cn("flex items-center gap-1", isNight ? "text-blue-400" : "text-amber-400")}>
            {isNight ? <Moon className="size-3" /> : <Sun className="size-3" />}
            {state.time}
          </span>
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-2">
        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              hpPercent > 50 ? "bg-red-500" : hpPercent > 25 ? "bg-orange-500" : "bg-red-600",
            )}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${mpPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}