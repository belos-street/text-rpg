'use client'

import { Play, MapPin, Calendar, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SaveMeta } from '@/types'

interface StoryConfig {
  title: string
  subtitle: string
}

interface TitleScreenProps {
  storyConfig: StoryConfig
  saves: SaveMeta[]
  savesLoading: boolean
  showNewGame: boolean
  nameInput: string
  onNameInputChange: (v: string) => void
  onShowNewGame: (v: boolean) => void
  onStartNewGame: () => void
  onLoadSave: (id: string) => void
  onDeleteSave: (id: string) => void
}

export function TitleScreen({
  storyConfig,
  saves,
  savesLoading,
  showNewGame,
  nameInput,
  onNameInputChange,
  onShowNewGame,
  onStartNewGame,
  onLoadSave,
  onDeleteSave,
}: TitleScreenProps) {
  return (
    <>
      <div className="relative flex flex-col items-start md:items-center justify-start md:justify-center min-h-screen bg-transparent px-4 py-8 md:py-0 overflow-y-auto">
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px] animate-glow-float" />
        <div className="relative max-w-md w-full space-y-6 text-center mx-auto">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">
              {storyConfig.title}
            </h1>
            <p className="text-sm text-zinc-500">
              {storyConfig.subtitle}
            </p>
          </div>

          {showNewGame ? (
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur p-8 space-y-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.2)]">
              <Input
                placeholder="输入你的名字……"
                value={nameInput}
                onChange={(e) => onNameInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onStartNewGame()}
                className="h-11 text-center text-lg border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-600"
              />
              <Button
                onClick={onStartNewGame}
                disabled={!nameInput.trim()}
                className="w-full h-11 text-base"
              >
                <Play className="size-4 mr-2" />
                开始新的冒险
              </Button>
              <Button
                variant="ghost"
                onClick={() => onShowNewGame(false)}
                className="w-full text-zinc-500 hover:text-zinc-300"
              >
                返回
              </Button>
            </div>
          ) : saves.length > 0 ? (
            <>
              <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur p-6 space-y-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.2)]">
                <Button
                  onClick={() => onShowNewGame(true)}
                  className="w-full h-11 text-base"
                >
                  <Play className="size-4 mr-2" />
                  新的冒险
                </Button>
              </div>
              <div className="text-left">
                <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider px-1">
                  继续游戏
                </p>
                <ScrollArea className="max-h-[55vh] md:max-h-[320px]">
                  <div className="space-y-2">
                    {saves.map((save) => (
                      <div key={save.id} className="flex items-center gap-2">
                        <button
                          onClick={() => onLoadSave(save.id)}
                          className="flex-1 text-left border border-zinc-800 rounded-xl bg-zinc-900/50 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3)]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-zinc-200">
                              {save.playerName}
                            </span>
                            <Badge className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                              存档位 {save.slot}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {save.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              第{save.day}日
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="size-3 text-red-400" />
                              {save.hp}/{save.maxHp}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => onDeleteSave(save.id)}
                          className="shrink-0 size-9 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-600 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="删除存档"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          ) : savesLoading ? (
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.2)]">
              <p className="text-sm text-zinc-500">正在检查存档……</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur p-8 space-y-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.2)]">
              <Input
                placeholder="输入你的名字……"
                value={nameInput}
                onChange={(e) => onNameInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onStartNewGame()}
                className="h-11 text-center text-lg border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-600"
              />
              <Button
                onClick={onStartNewGame}
                disabled={!nameInput.trim()}
                className="w-full h-11 text-base"
              >
                <Play className="size-4 mr-2" />
                开始新的冒险
              </Button>
            </div>
          )}

          <p className="text-xs text-zinc-700">
            需要配置 AI API 密钥才能开始游戏
          </p>
        </div>
      </div>
    </>
  )
}
