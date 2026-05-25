'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Save, Menu } from 'lucide-react'
import { StatusBar } from '@/components/game/StatusBar'
import { ChatPanel } from '@/components/game/ChatPanel'
import { ChoicePanel } from '@/components/game/ChoicePanel'
import { InputPanel } from '@/components/game/InputPanel'
import { Sidebar } from '@/components/game/Sidebar'
import { TitleScreen } from '@/components/game/TitleScreen'
import { DeleteConfirmDialog } from '@/components/game/DeleteConfirmDialog'
import { useStreamChat } from '@/hooks/use-stream-chat'
import { extractNarration, extractChoices } from '@/lib/parser'
import { getAffectionStage } from '@/lib/affection'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type {
  PlayerState,
  Choice,
  Message,
  Relation,
  InventoryItem,
  MemoryItem,
  SaveMeta,
  AffectionStage,
} from '@/types'

const DEFAULT_PLAYER_STATE: PlayerState = {
  playerName: '',
  hp: 0,
  maxHp: 0,
  mp: 0,
  maxMp: 0,
  gold: 0,
  location: '',
  chapter: '',
  day: 1,
  time: '',
}

export default function GamePage() {
  const [gameStarted, setGameStarted] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saveId, setSaveId] = useState<string | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState>(DEFAULT_PLAYER_STATE)
  const [messages, setMessages] = useState<Message[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStreamContent, setCurrentStreamContent] = useState('')
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
    title: '加载中',
    subtitle: '',
    loadingText: '加载中……',
    emptyChatTitle: '加载中',
    emptyChatSubtitle: '',
  })

  const streamCallbacks = useRef({
    onStreamStart: () => {
      setIsStreaming(true)
      setIsLoading(true)
      setCurrentStreamContent('')
      setChoices([])
    },
    onStreamContent: (content: string) => {
      if (content === '') {
        setIsLoading(false)
      } else {
        setCurrentStreamContent(content)
      }
    },
    onChoices: (c: Choice[]) => setChoices(c),
    onNewMemory: (mem: Omit<MemoryItem, 'id' | 'createdAt'>) => {
      setMemories((prev) => {
        const exists = prev.some(
          (m) => m.type === mem.type && m.content === mem.content,
        )
        if (exists) return prev
        return [
          ...prev,
          {
            id: generateId(),
            type: mem.type,
            content: mem.content,
            importance: mem.importance,
            createdAt: new Date().toISOString(),
          },
        ]
      })
    },
    onStateChanges: (changes: Partial<PlayerState>) => {
      setPlayerState((prev) => ({
        ...prev,
        hp: changes.hp != null ? Math.max(0, Math.min(prev.maxHp, changes.hp)) : prev.hp,
        mp: changes.mp != null ? Math.max(0, Math.min(prev.maxMp, changes.mp)) : prev.mp,
        gold: changes.gold != null ? Math.max(0, changes.gold) : prev.gold,
        location: changes.location ?? prev.location,
        chapter: changes.chapter ?? prev.chapter,
        day: changes.day != null ? changes.day : prev.day,
        time: changes.time ?? prev.time,
      }))
    },
    onAffectionChanges: (changes: Record<string, number>) => {
      setRelations((prev) =>
        prev.map((r) => {
          const change = changes[r.characterId]
          if (change) {
            const newAffection = Math.max(0, Math.min(100, r.affection + change))
            return { ...r, affection: newAffection, stage: getAffectionStage(newAffection) }
          }
          return r
        }),
      )
    },
    onHarmonyChange: (change: number) => {
      setHarmony((prev) => Math.max(0, Math.min(100, prev + change)))
    },
    onNewItems: (items: { id: string; name: string }[]) => {
      setInventory((prev) => {
        const updated = [...prev]
        for (const item of items) {
          const existing = updated.find((i) => i.itemId === item.id)
          if (existing) {
            existing.quantity += 1
          } else {
            updated.push({ itemId: item.id, itemName: item.name, quantity: 1 })
          }
        }
        return updated
      })
    },
    onMessage: (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    },
    onError: (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    },
    onStreamEnd: () => {
      setIsStreaming(false)
      setIsLoading(false)
      setCurrentStreamContent('')
    },
  })

  const { sendMessage, stop } = useStreamChat(streamCallbacks.current)

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => {
        setCharacterEmoji(cfg.characterEmoji || {})
        setAffectionStages(cfg.affectionStages || [])
        setStoryConfig({
          title: cfg.title || '未命名故事',
          subtitle: cfg.subtitle || '',
          loadingText: cfg.loadingText || '加载中……',
          emptyChatTitle: cfg.emptyChatTitle || '欢迎',
          emptyChatSubtitle: cfg.emptyChatSubtitle || '',
        })
        if (cfg.initialState) {
          setPlayerState((prev) => ({ ...prev, ...cfg.initialState }))
        }
      })
      .catch(() => {})

    const params = new URLSearchParams(window.location.search)
    const loadId = params.get('load')
    if (loadId) {
      fetch(`/api/saves/${loadId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.save) {
            setIsLoading(true)
            applySaveData(data.save)
            if (data.history && data.history.length > 0) {
              const displayHistory = data.history
                .filter((m: Message) => m.role !== 'system')
                .map((m: Message) => ({
                  ...m,
                  content: m.role === 'assistant' ? extractNarration(m.content) : m.content,
                }))
              setMessages(displayHistory)
              const lastAssistant = [...data.history].reverse().find((m: Message) => m.role === 'assistant')
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
      fetch('/api/saves')
        .then((r) => r.json())
        .then((data) => {
          setSaves(data.saves || [])
          setSavesLoading(false)
        })
        .catch(() => setSavesLoading(false))
    }
  }, [])

  function applySaveData(save: {
    id: string
    playerName: string
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    gold: number
    location: string
    chapter: string
    day: number
    time: string
    relations?: Relation[]
    inventory?: InventoryItem[]
    memories?: MemoryItem[]
    harmony?: number
  }) {
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

  const startNewGame = useCallback(async () => {
    if (!nameInput.trim() || gameStarted) return
    const name = nameInput.trim()
    setPlayerState((prev) => ({ ...prev, playerName: name }))
    setShowTitleScreen(false)
    setGameStarted(true)
    setIsLoading(true)

    try {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        sendMessage(data.save.id, '', name)
      }
    } catch {
      setIsLoading(false)
      setIsStreaming(true)
      setMessages([
        {
          role: 'assistant',
          content: `欢迎，${name}。你的异世界之旅即将开始...\n\n（由于API配置尚未设置，请先配置 .env 文件中的 AI_BASE_URL 和 AI_API_KEY）`,
        },
      ])
      setIsStreaming(false)
    }
  }, [nameInput, gameStarted, sendMessage])

  const loadSave = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/saves/${id}`)
      const data = await res.json()
      if (data.save) {
        applySaveData(data.save)
        if (data.history && data.history.length > 0) {
          const displayHistory = data.history
            .filter((m: Message) => m.role !== 'system')
            .map((m: Message) => ({
              ...m,
              content: m.role === 'assistant' ? extractNarration(m.content) : m.content,
            }))
          setMessages(displayHistory)
          const lastAssistant = [...data.history].reverse().find((m: Message) => m.role === 'assistant')
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
  }, [])

  async function handleDeleteSave(id: string) {
    try {
      await fetch(`/api/saves/${id}`, { method: 'DELETE' })
      setSaves((prev) => prev.filter((s) => s.id !== id))
    } catch {}
    setDeleteTarget(null)
  }

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (!saveId || isStreaming) return
      const choice = choices.find((c) => c.id === choiceId)
      if (!choice) return
      setChoices([])
      sendMessage(saveId, choice.text)
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
    stop()
  }, [stop])

  if (showTitleScreen) {
    return (
      <>
        <TitleScreen
          storyConfig={storyConfig}
          saves={saves}
          savesLoading={savesLoading}
          showNewGame={showNewGame}
          nameInput={nameInput}
          onNameInputChange={setNameInput}
          onShowNewGame={setShowNewGame}
          onStartNewGame={startNewGame}
          onLoadSave={loadSave}
          onDeleteSave={setDeleteTarget}
        />
        <DeleteConfirmDialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget && handleDeleteSave(deleteTarget)}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-transparent">
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
                <p className="text-sm animate-stream-cursor">
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
                      <span className="size-1.5 rounded-full bg-zinc-400 animate-dot-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="size-1.5 rounded-full bg-zinc-400 animate-dot-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="size-1.5 rounded-full bg-zinc-400 animate-dot-bounce" style={{ animationDelay: '400ms' }} />
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

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
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
          <Button onClick={() => setShowSaveDialog(false)} className="w-full">
            确认
          </Button>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteSave(deleteTarget)}
      />
    </div>
  )
}
