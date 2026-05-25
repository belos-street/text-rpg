"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Save, Menu, Play, MapPin, Calendar, Heart } from "lucide-react"
import { StatusBar } from "@/components/game/StatusBar"
import { ChatPanel } from "@/components/game/ChatPanel"
import { ChoicePanel } from "@/components/game/ChoicePanel"
import { InputPanel } from "@/components/game/InputPanel"
import { Sidebar } from "@/components/game/Sidebar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type {
  PlayerState,
  Choice,
  Message,
  Relation,
  InventoryItem,
  MemoryItem,
  SaveMeta,
  AffectionStage,
} from "@/types"

function extractNarration(text: string): string {
  try {
    const startIdx = text.indexOf("{")
    if (startIdx === -1) return text
    let depth = 0
    let jsonEnd = -1
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") depth++
      else if (text[i] === "}") {
        depth--
        if (depth === 0) {
          jsonEnd = i
          break
        }
      }
    }
    if (jsonEnd === -1) return text
    const jsonStr = text.slice(startIdx, jsonEnd + 1)
    const parsed = JSON.parse(jsonStr)
    if (parsed.narration) return parsed.narration
  } catch {}
  const cleaned = text
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim()
  return cleaned || text
}

function extractChoices(text: string): { id: string; text: string }[] {
  try {
    const startIdx = text.indexOf("{")
    if (startIdx === -1) return []
    let depth = 0
    let jsonEnd = -1
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") depth++
      else if (text[i] === "}") {
        depth--
        if (depth === 0) {
          jsonEnd = i
          break
        }
      }
    }
    if (jsonEnd === -1) return []
    const jsonStr = text.slice(startIdx, jsonEnd + 1)
    const parsed = JSON.parse(jsonStr)
    if (parsed.choices && Array.isArray(parsed.choices)) return parsed.choices
  } catch {}
  return []
}

const DEFAULT_PLAYER_STATE: PlayerState = {
  playerName: "",
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  gold: 50,
  location: "未知森林",
  chapter: "第一章：觉醒",
  day: 1,
  time: "早晨",
}

export default function GamePage() {
  const [gameStarted, setGameStarted] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [saveId, setSaveId] = useState<string | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState>(
    DEFAULT_PLAYER_STATE,
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStreamContent, setCurrentStreamContent] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [relations, setRelations] = useState<Relation[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [harmony, setHarmony] = useState(50)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showTitleScreen, setShowTitleScreen] = useState(true)
  const [showNewGame, setShowNewGame] = useState(false)
  const [saves, setSaves] = useState<SaveMeta[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [savesLoading, setSavesLoading] = useState(true)
  const [characterEmoji, setCharacterEmoji] = useState<Record<string, string>>({})
  const [affectionStages, setAffectionStages] = useState<AffectionStage[]>([])
  const [storyConfig, setStoryConfig] = useState({
    title: "异世界后宫物语",
    subtitle: "AI 驱动的异世界文字冒险——你的选择，改变一切",
    loadingText: "命运的齿轮开始转动……",
    emptyChatTitle: "冒险即将开始...",
    emptyChatSubtitle: "输入你的名字，开启异世界之旅",
  })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        setCharacterEmoji(cfg.characterEmoji || {})
        setAffectionStages(cfg.affectionStages || [])
        setStoryConfig({
          title: cfg.title || "异世界后宫物语",
          subtitle: cfg.subtitle || "AI 驱动的异世界文字冒险",
          loadingText: cfg.loadingText || "命运的齿轮开始转动……",
          emptyChatTitle: cfg.emptyChatTitle || "冒险即将开始...",
          emptyChatSubtitle: cfg.emptyChatSubtitle || "输入你的名字，开启异世界之旅",
        })
      })
      .catch(() => {})

    const params = new URLSearchParams(window.location.search)
    const loadId = params.get("load")
    if (loadId) {
      fetch(`/api/saves/${loadId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.save) {
            setIsLoading(true)
            applySaveData(data.save)
            if (data.history && data.history.length > 0) {
              const displayHistory = data.history
                .filter((m: Message) => m.role !== "system")
                .map((m: Message) => ({
                  ...m,
                  content: m.role === "assistant" ? extractNarration(m.content) : m.content,
                }))
              setMessages(displayHistory)
              const lastAssistant = [...data.history].reverse().find((m: Message) => m.role === "assistant")
              if (lastAssistant) {
                const restored = extractChoices(lastAssistant.content)
                if (restored.length > 0) setChoices(restored)
              }
            }
            setIsLoading(false)
          }
        })
        .catch(() => {})
    } else {
      fetch("/api/saves")
        .then((r) => r.json())
        .then((data) => {
          setSaves(data.saves || [])
          setSavesLoading(false)
        })
        .catch(() => setSavesLoading(false))
    }
  }, [])

  function applySaveData(save: { id: string; playerName: string; hp: number; maxHp: number; mp: number; maxMp: number; gold: number; location: string; chapter: string; day: number; time: string; relations?: Relation[]; inventory?: InventoryItem[]; memories?: MemoryItem[]; harmony?: number }) {
    setSaveId(save.id)
    setPlayerState({
      playerName: save.playerName,
      hp: save.hp,
      maxHp: save.maxHp,
      mp: save.mp,
      maxMp: save.maxMp,
      gold: save.gold,
      location: save.location,
      chapter: save.chapter,
      day: save.day,
      time: save.time,
    })
    setRelations(save.relations || [])
    setInventory(save.inventory || [])
    setMemories(save.memories || [])
    setHarmony(save.harmony ?? 50)
    setShowTitleScreen(false)
    setGameStarted(true)
  }

  const sendMessage = useCallback(
    async (sid: string, msg: string, playerNameForNew?: string) => {
      if (isStreaming) return
      setIsStreaming(true)
      setIsLoading(true)
      setCurrentStreamContent("")
      setChoices([])

      if (msg) {
        setMessages((prev) => [...prev, { role: "user", content: msg }])
      }

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saveId: sid,
            message: msg || "",
            playerName: playerNameForNew || undefined,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || "请求失败")
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("无法读取响应流")

        const decoder = new TextDecoder()
        let fullContent = ""
        let lastNarration = ""
        let buffer = ""
        let hasReceivedContent = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const payload = JSON.parse(line.slice(6))

                if (payload.done) {
                  break
                }

                if (payload.error) {
                  fullContent = `[错误] ${payload.error}`
                  setCurrentStreamContent(fullContent)
                  continue
                }

                if (payload.content) {
                  if (!hasReceivedContent) {
                    hasReceivedContent = true
                    setIsLoading(false)
                  }
                  fullContent = payload.content
                  if (payload.narration) {
                    lastNarration = payload.narration
                    setCurrentStreamContent(lastNarration)
                  } else {
                    setCurrentStreamContent(extractNarration(fullContent))
                  }
                }

                if (payload.choices) {
                  setChoices(payload.choices)
                }

                if (payload.newMemory) {
                  setMemories((prev) => {
                    const exists = prev.some(
                      (m) => m.type === payload.newMemory.type && m.content === payload.newMemory.content
                    )
                    if (exists) return prev
                    const mem: MemoryItem = {
                      id: Math.random().toString(36).substring(2),
                      type: payload.newMemory.type,
                      content: payload.newMemory.content,
                      importance: payload.newMemory.importance,
                      createdAt: new Date().toISOString(),
                    }
                    return [...prev, mem]
                  })
                }

                if (payload.stateChanges) {
                  setPlayerState((prev) => ({
                    ...prev,
                    hp:
                      payload.stateChanges.hp != null
                        ? Math.max(0, Math.min(prev.maxHp, payload.stateChanges.hp))
                        : prev.hp,
                    mp:
                      payload.stateChanges.mp != null
                        ? Math.max(0, Math.min(prev.maxMp, payload.stateChanges.mp))
                        : prev.mp,
                    gold:
                      payload.stateChanges.gold != null
                        ? Math.max(0, payload.stateChanges.gold)
                        : prev.gold,
                    location:
                      payload.stateChanges.location ?? prev.location,
                    chapter:
                      payload.stateChanges.chapter ?? prev.chapter,
                    day:
                      payload.stateChanges.day != null ? payload.stateChanges.day : prev.day,
                    time: payload.stateChanges.time ?? prev.time,
                  }))
                }

                if (payload.affectionChanges) {
                  setRelations((prev) =>
                    prev.map((r) => {
                      const change =
                        payload.affectionChanges[r.characterId]
                      if (change) {
                        const newAffection = Math.max(
                          0,
                          Math.min(100, r.affection + change),
                        )
                        const stage =
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
                                    : "lover"
                        return { ...r, affection: newAffection, stage }
                      }
                      return r
                    }),
                  )
                }

                if (payload.harmonyChange !== undefined) {
                  setHarmony((prev) =>
                    Math.max(
                      0,
                      Math.min(100, prev + payload.harmonyChange),
                    ),
                  )
                }

                if (payload.newItems) {
                  setInventory((prev) => {
                    const updated = [...prev]
                    for (const item of payload.newItems) {
                      const existing = updated.find(
                        (i) => i.itemId === item.id,
                      )
                      if (existing) {
                        existing.quantity += 1
                      } else {
                        updated.push({
                          itemId: item.id,
                          itemName: item.name,
                          quantity: 1,
                        })
                      }
                    }
                    return updated
                  })
                }

                if (payload.scene) {
                  // scene info received
                }
              } catch {
                // skip parse errors for partial lines
              }
            }
          }
        }

        if (fullContent) {
          const displayContent =
            lastNarration || extractNarration(fullContent)
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: displayContent },
          ])
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          const errorMsg = `[系统] ${err.message}`
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: errorMsg },
          ])
        }
      } finally {
        setIsStreaming(false)
        setIsLoading(false)
        setCurrentStreamContent("")
        abortRef.current = null
      }
    },
    [isStreaming],
  )

  const startNewGame = useCallback(async () => {
    if (!nameInput.trim() || gameStarted) return
    const name = nameInput.trim()
    setPlayerState((prev) => ({ ...prev, playerName: name }))
    setShowTitleScreen(false)
    setGameStarted(true)
    setIsLoading(true)

    try {
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name }),
      })
      const data = await res.json()
      if (data.save) {
        setSaveId(data.save.id)
        setRelations(data.save.relations)
        setInventory(data.save.inventory)
        setMemories(data.save.memories)
        setHarmony(data.save.harmony)
        setPlayerState((prev) => ({
          ...prev,
          playerName: data.save.playerName,
          hp: data.save.hp,
          maxHp: data.save.maxHp,
          mp: data.save.mp,
          maxMp: data.save.maxMp,
          gold: data.save.gold,
          location: data.save.location,
          chapter: data.save.chapter,
          day: data.save.day,
          time: data.save.time,
        }))
        sendMessage(data.save.id, "", name)
      }
    } catch {
      setIsLoading(false)
      setIsStreaming(true)
      setMessages([
        {
          role: "assistant",
          content: `欢迎，${name}。你的异世界之旅即将开始...\n\n（由于API配置尚未设置，请先配置 .env 文件中的 AI_BASE_URL 和 AI_API_KEY）`,
        },
      ])
      setIsStreaming(false)
    }
  }, [nameInput, gameStarted, sendMessage])

  const loadSave = useCallback(
    async (id: string) => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/saves/${id}`)
        const data = await res.json()
        if (data.save) {
          applySaveData(data.save)
          if (data.history && data.history.length > 0) {
            const displayHistory = data.history
              .filter((m: Message) => m.role !== "system")
              .map((m: Message) => ({
                ...m,
                content: m.role === "assistant" ? extractNarration(m.content) : m.content,
              }))
            setMessages(displayHistory)
            const lastAssistant = [...data.history].reverse().find((m: Message) => m.role === "assistant")
            if (lastAssistant) {
              const restored = extractChoices(lastAssistant.content)
              if (restored.length > 0) setChoices(restored)
            }
          }
          setIsLoading(false)
        }
      } catch {
        setIsLoading(false)
      }
    },
    [],
  )

  async function handleDeleteSave(id: string) {
    try {
      await fetch(`/api/saves/${id}`, { method: "DELETE" })
      setSaves((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // silent
    }
    setDeleteTarget(null)
  }

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (!saveId || isStreaming) return
      const choice = choices.find((c) => c.id === choiceId)
      if (!choice) return
      const choiceText = `${choice.text}`
      setChoices([])
      sendMessage(saveId, choiceText)
    },
    [saveId, isStreaming, choices, sendMessage],
  )

  const handleSendMessage = useCallback(
    (msg: string) => {
      if (!saveId || isStreaming) return
      setChoices([])
      sendMessage(saveId, msg)
    },
    [saveId, isStreaming, sendMessage],
  )

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setIsLoading(false)
    setCurrentStreamContent("")
  }, [])

  if (showTitleScreen) {
    return (
      <>
        <div className="flex flex-col items-start md:items-center justify-start md:justify-center min-h-screen bg-zinc-950 px-4 py-8 md:py-0 overflow-y-auto">
          <div className="max-w-md w-full space-y-6 text-center mx-auto">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">
                {storyConfig.title}
              </h1>
              <p className="text-sm text-zinc-500">
                {storyConfig.subtitle}
              </p>
            </div>

          {showNewGame ? (
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 p-8 space-y-4">
              <Input
                placeholder="输入你的名字……"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && startNewGame()
                }
                className="h-11 text-center text-lg border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-600"
              />
              <Button
                onClick={startNewGame}
                disabled={!nameInput.trim()}
                className="w-full h-11 text-base"
              >
                <Play className="size-4 mr-2" />
                开始新的冒险
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowNewGame(false)}
                className="w-full text-zinc-500 hover:text-zinc-300"
              >
                返回
              </Button>
            </div>
          ) : saves.length > 0 ? (
            <>
              <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 p-6 space-y-3">
                <Button
                  onClick={() => setShowNewGame(true)}
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
                      <div
                        key={save.id}
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => loadSave(save.id)}
                          className="flex-1 text-left border border-zinc-800 rounded-xl bg-zinc-900/50 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
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
                          onClick={() => setDeleteTarget(save.id)}
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
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 p-8">
              <p className="text-sm text-zinc-500">正在检查存档……</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/50 p-8 space-y-4">
              <Input
                placeholder="输入你的名字……"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && startNewGame()
                }
                className="h-11 text-center text-lg border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-600"
              />
              <Button
                onClick={startNewGame}
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

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription className="text-zinc-500">
              此操作不可撤销，存档数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDeleteSave(deleteTarget)}
              className="flex-1"
            >
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Menu className="size-4" />
          </Button>
          <h1 className="text-sm font-medium text-zinc-300 hidden sm:block">
            {storyConfig.title}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-zinc-500"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="size-3.5 mr-1" />
            存档
          </Button>
        </div>
      </header>

      <StatusBar state={playerState} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0">
          {isLoading && !currentStreamContent && messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-zinc-500">
                <div className="relative">
                  <div className="size-12 rounded-full border-2 border-zinc-800 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg">📖</span>
                  </div>
                </div>
                <p className="text-sm animate-pulse">
                  {storyConfig.loadingText}
                </p>
              </div>
            </div>
          ) : (
            <>
              <ChatPanel
                messages={messages}
                isStreaming={isStreaming}
                currentStreamContent={currentStreamContent}
                characterEmoji={characterEmoji}
                emptyTitle={storyConfig.emptyChatTitle}
                emptySubtitle={storyConfig.emptyChatSubtitle}
              />
              {isLoading && !currentStreamContent && messages.length > 0 && (
                <div className="flex justify-center py-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 text-xs text-zinc-500">
                    <span className="inline-flex gap-1">
                      <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    思考中
                  </span>
                </div>
              )}
              <ChoicePanel
                choices={choices}
                onChoice={handleChoice}
                disabled={isStreaming}
              />
            </>
          )}
          <InputPanel
            onSend={handleSendMessage}
            onStop={handleStop}
            isStreaming={isStreaming}
            placeholder="输入你的行动……也可以自由输入任何内容"
          />
        </div>
        <Sidebar
          relations={relations}
          inventory={inventory}
          memories={memories}
          harmony={harmony}
          open={showSidebar}
          affectionStages={affectionStages}
        />
      </div>

      <Dialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>快速存档</DialogTitle>
            <DialogDescription className="text-zinc-500">
              当前进度已自动保存
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-zinc-400 space-y-1">
            <p>玩家：{playerState.playerName}</p>
            <p>位置：{playerState.location}</p>
            <p>
              第{playerState.day}日 - {playerState.time}
            </p>
          </div>
          <Button
            onClick={() => setShowSaveDialog(false)}
            className="w-full"
          >
            确认
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription className="text-zinc-500">
              此操作不可撤销，存档数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDeleteSave(deleteTarget)}
              className="flex-1"
            >
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
