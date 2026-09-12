'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Save, Menu, RefreshCw, Download } from 'lucide-react'
import { StatusBar } from '@/components/game/status-bar'
import { ChatPanel } from '@/components/game/chat-panel'
import { ChoicePanel } from '@/components/game/choice-panel'
import { DebugPanel } from '@/components/game/debug-panel'
import { InputPanel } from '@/components/game/input-panel'
import { Sidebar } from '@/components/game/sidebar'
import { TitleScreen } from '@/components/game/title-screen'
import { DeleteConfirmDialog } from '@/components/game/delete-confirm-dialog'
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
  DialogDescription
} from '@/components/ui/dialog'
import type {
  PlayerState,
  Choice,
  Message,
  Relation,
  InventoryItem,
  MemoryItem,
  SaveMeta,
  SaveData,
  AffectionStage
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
  time: ''
}

export default function GamePage() {
  const [gameStarted, setGameStarted] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saveId, setSaveId] = useState<string | null>(null)
  const [playerState, setPlayerState] =
    useState<PlayerState>(DEFAULT_PLAYER_STATE)
  const [messages, setMessages] = useState<Message[]>([])
  const playerStateRef = useRef(playerState)
  const messagesRef = useRef(messages)
  playerStateRef.current = playerState
  messagesRef.current = messages
  const gameStartedRef = useRef(false)
  const [choices, setChoices] = useState<Choice[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStreamContent, setCurrentStreamContent] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(1)
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
  const [characterEmoji, setCharacterEmoji] = useState<Record<string, string>>(
    {}
  )
  const [affectionStages, setAffectionStages] = useState<AffectionStage[]>([])
  const [affectionToast, setAffectionToast] = useState<string | null>(null)
  const [endingCount, setEndingCount] = useState<number | null>(null)
  // D4 调试面板：仅当 URL 带 ?debug=1 时启用
  const [debugEnabled] = useState(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('debug')
  )
  const [debugData, setDebugData] = useState<Record<string, unknown> | null>(
    null
  )
  const [storyConfig, setStoryConfig] = useState({
    title: '加载中',
    subtitle: '',
    loadingText: '加载中……',
    emptyChatTitle: '加载中',
    emptyChatSubtitle: ''
  })

  const displayMessages = useMemo(
    () => messages.filter((m) => m.role !== 'system'),
    [messages]
  )

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
          (m) => m.type === mem.type && m.content === mem.content
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
            day: playerStateRef.current.day,
            chapter: playerStateRef.current.chapter,
            messageIndex: messagesRef.current.filter((m) => m.role !== 'system')
              .length
          }
        ]
      })
    },
    onStateChanges: (changes: Partial<PlayerState>) => {
      setPlayerState((prev) => {
        const newDay = changes.day != null ? changes.day : prev.day
        if (newDay !== prev.day) {
          setSelectedDay(newDay)
        }
        return {
          ...prev,
          hp:
            changes.hp != null
              ? Math.max(0, Math.min(prev.maxHp, changes.hp))
              : prev.hp,
          mp:
            changes.mp != null
              ? Math.max(0, Math.min(prev.maxMp, changes.mp))
              : prev.mp,
          gold: changes.gold != null ? Math.max(0, changes.gold) : prev.gold,
          location: changes.location ?? prev.location,
          chapter: changes.chapter ?? prev.chapter,
          day: newDay,
          time: changes.time ?? prev.time
        }
      })
    },
    onAffectionChanges: (changes: Record<string, number>) => {
      setRelations((prev) =>
        prev.map((r) => {
          const change = changes[r.characterId]
          if (change) {
            const newAffection = Math.max(
              0,
              Math.min(100, r.affection + change)
            )
            return {
              ...r,
              affection: newAffection,
              stage: getAffectionStage(newAffection)
            }
          }
          return r
        })
      )
    },
    onAffectionReason: (reason: string) => {
      // C3 好感度即时反馈：浮动提示（4 秒自动消失）
      setAffectionToast(`💫 ${reason}`)
    },
    onHarmonyChange: (change: number) => {
      setHarmony((prev) => Math.max(0, Math.min(100, prev + change)))
    },
    onNewItems: (items: { id: string; name: string }[]) => {
      setInventory((prev) => {
        const updated = [...prev]
        for (const item of items) {
          const idx = updated.findIndex((i) => i.itemId === item.id)
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              quantity: updated[idx].quantity + 1
            }
          } else {
            updated.push({ itemId: item.id, itemName: item.name, quantity: 1 })
          }
        }
        return updated
      })
    },
    onMessage: (msg: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          day: playerStateRef.current.day,
          chapter: playerStateRef.current.chapter
        }
      ])
    },
    onError: (msg: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          day: playerStateRef.current.day,
          chapter: playerStateRef.current.chapter
        }
      ])
    },
    onDebug: (payload: Record<string, unknown>) => {
      setDebugData(payload)
    },
    onStreamEnd: () => {
      setIsStreaming(false)
      setIsLoading(false)
      setCurrentStreamContent('')
    }
  })

  const { sendMessage, stop } = useStreamChat(streamCallbacks.current)

  // C3 好感度浮动提示自动消失
  useEffect(() => {
    if (!affectionToast) return
    const timer = setTimeout(() => setAffectionToast(null), 4000)
    return () => clearTimeout(timer)
  }, [affectionToast])

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
          emptyChatSubtitle: cfg.emptyChatSubtitle || ''
        })
        if (cfg.initialState && !gameStartedRef.current) {
          // 防竞态：读档/开局后 config 才 resolve 时，不用初始值覆盖存档状态
          setPlayerState((prev) => ({ ...prev, ...cfg.initialState }))
        }
      })
      .catch((error) => {
        console.error('[config] 故事配置加载失败:', error)
        setStoryConfig((prev) => ({
          ...prev,
          title: '配置加载失败',
          loadingText: '加载失败，请刷新重试'
        }))
      })

    const params = new URLSearchParams(window.location.search)
    const loadId = params.get('load')
    const fetchSaves = () => {
      fetch('/api/saves')
        .then((r) => r.json())
        .then((data) => {
          setSaves(data.saves || [])
          setSavesLoading(false)
        })
        .catch(() => setSavesLoading(false))
    }
    if (loadId) {
      fetch(`/api/saves/${loadId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.save) {
            setIsLoading(true)
            applySaveData(data.save)
            applyHistory(data)
            setIsLoading(false)
            setSavesLoading(false)
          } else {
            // 存档不存在/已损坏：回退到标题屏存档列表，避免永远停在"正在检查存档……"
            console.error('[load] 存档不存在:', loadId)
            fetchSaves()
          }
        })
        .catch((error) => {
          console.error('[load] 读取存档失败:', error)
          fetchSaves()
        })
    } else {
      fetchSaves()
    }

    // C6 结局图鉴：标题屏展示全局解锁进度
    fetch('/api/progress')
      .then((r) => r.json())
      .then((data) => {
        setEndingCount(data.unlockedEndings?.length ?? 0)
      })
      .catch(() => {})
  }, [])

  function applySaveData(save: SaveData) {
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
      time: save.time
    })
    setRelations(save.relations || [])
    setInventory(save.inventory || [])
    setMemories(save.memories || [])
    setHarmony(save.harmony ?? 50)
    setSelectedDay(save.day)
    setShowTitleScreen(false)
    setGameStarted(true)
    gameStartedRef.current = true
  }

  // #19：读档后的历史恢复逻辑（?load= 与 loadSave 共用）
  function applyHistory(data: { save: SaveData; history: Message[] }) {
    if (!data.history || data.history.length === 0) return
    const saveDay = data.save.day || 1
    const saveChapter = data.save.chapter || ''
    const displayHistory = data.history
      .filter((m: Message) => m.role !== 'system')
      .map((m: Message) => ({
        ...m,
        content:
          m.role === 'assistant' ? extractNarration(m.content) : m.content,
        day: m.day ?? saveDay,
        chapter: m.chapter ?? saveChapter
      }))
    setMessages(displayHistory)
    setMemories((prev) =>
      prev.map((mem) => {
        if (mem.messageIndex != null) return mem
        const idx = displayHistory.findIndex(
          (m: Message) =>
            m.role === 'assistant' &&
            mem.content.length > 10 &&
            m.content.includes(mem.content)
        )
        if (idx !== -1) {
          return {
            ...mem,
            messageIndex: idx,
            day: displayHistory[idx].day,
            chapter: displayHistory[idx].chapter
          }
        }
        return {
          ...mem,
          day: mem.day ?? saveDay,
          chapter: mem.chapter ?? saveChapter
        }
      })
    )
    const lastAssistant = [...data.history]
      .reverse()
      .find((m: Message) => m.role === 'assistant')
    if (lastAssistant) {
      const restored = extractChoices(lastAssistant.content)
      if (restored.length > 0) setChoices(restored)
    }
  }

  const startNewGame = useCallback(async () => {
    if (!nameInput.trim() || gameStarted) return
    const name = nameInput.trim()
    setPlayerState((prev) => ({ ...prev, playerName: name }))
    setShowTitleScreen(false)
    setGameStarted(true)
    gameStartedRef.current = true
    setIsLoading(true)

    try {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name })
      })
      const data = await res.json()
      if (!res.ok || !data.save) {
        throw new Error(data.error || `创建存档失败（HTTP ${res.status}）`)
      }
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
        time: data.save.time
      }))
      sendMessage(data.save.id, '', name)
    } catch (err) {
      setIsLoading(false)
      const reason = err instanceof Error ? err.message : '未知错误'
      setMessages([
        {
          role: 'assistant',
          content: `创建存档失败：${reason}\n\n请检查服务端日志后重新开始游戏。`,
          day: 1
        }
      ])
    }
  }, [nameInput, gameStarted, sendMessage])

  const loadSave = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/saves/${id}`)
      const data = await res.json()
      if (data.save) {
        applySaveData(data.save)
        applyHistory(data)
        setIsLoading(false)
      } else {
        console.error('[load] 存档不存在:', id)
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

  // C1 重新生成：移除最后一轮后重掷叙述与选项（状态以首次生成为准）
  const handleRegenerate = useCallback(() => {
    if (!saveId || isStreaming) return
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    setChoices([])
    sendMessage(saveId, lastUser.content, undefined, { regenerate: true })
  }, [saveId, isStreaming, messages, sendMessage])

  // C5 导出故事日志为 Markdown
  const handleExport = useCallback(async () => {
    if (!saveId) return
    try {
      const res = await fetch(`/api/saves/${saveId}`)
      const data = await res.json()
      if (!data.save) return
      const lines: string[] = [
        `# ${storyConfig.title}`,
        '',
        `- 玩家：${data.save.playerName}`,
        `- 章节：${data.save.chapter}（第 ${data.save.day} 天 · ${data.save.time}）`,
        `- 地点：${data.save.location}`,
        '',
        '---',
        ''
      ]
      for (const m of data.history as Message[]) {
        if (m.role === 'user') {
          lines.push(`> 🧑 **${m.content}**`, '')
        } else {
          lines.push(
            m.content.startsWith('{') ? extractNarration(m.content) : m.content,
            ''
          )
        }
      }
      const blob = new Blob([lines.join('\n')], {
        type: 'text/markdown;charset=utf-8'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.save.playerName}-第${data.save.day}天.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[export] 导出失败:', error)
    }
  }, [saveId, storyConfig.title])

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (!saveId || isStreaming) return
      const choice = choices.find((c) => c.id === choiceId)
      if (!choice) return
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: choice.text,
          day: playerState.day,
          chapter: playerState.chapter
        }
      ])
      setChoices([])
      sendMessage(saveId, choice.text)
    },
    [
      saveId,
      isStreaming,
      choices,
      sendMessage,
      playerState.day,
      playerState.chapter
    ]
  )

  const handleSendMessage = useCallback(
    (msg: string) => {
      if (!saveId || isStreaming) return
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: msg,
          day: playerState.day,
          chapter: playerState.chapter
        }
      ])
      setChoices([])
      sendMessage(saveId, msg)
    },
    [saveId, isStreaming, sendMessage, playerState.day, playerState.chapter]
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
          endingCount={endingCount}
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
            onClick={() => setShowSidebar(!showSidebar)}>
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
            onClick={handleRegenerate}
            disabled={isStreaming || messages.length === 0}>
            <RefreshCw className="size-3.5 mr-1" />
            重新生成
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-zinc-500"
            onClick={handleExport}>
            <Download className="size-3.5 mr-1" />
            导出
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-zinc-500"
            onClick={() => setShowSaveDialog(true)}>
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
                selectedDay={selectedDay}
                currentDay={playerState.day}
              />
              {isLoading && !currentStreamContent && messages.length > 0 && (
                <div className="flex justify-center py-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 text-xs text-zinc-500">
                    <span className="inline-flex gap-1">
                      <span
                        className="size-1.5 rounded-full bg-zinc-400 animate-dot-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="size-1.5 rounded-full bg-zinc-400 animate-dot-bounce"
                        style={{ animationDelay: '200ms' }}
                      />
                      <span
                        className="size-1.5 rounded-full bg-zinc-400 animate-dot-bounce"
                        style={{ animationDelay: '400ms' }}
                      />
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
          messages={displayMessages}
          harmony={harmony}
          open={showSidebar}
          onClose={() => setShowSidebar(false)}
          onGift={async (itemId, characterId) => {
            if (!saveId) return
            try {
              const res = await fetch('/api/gift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saveId, itemId, characterId })
              })
              const data = await res.json()
              if (!res.ok || !data.success) {
                throw new Error(data.error || '赠送失败')
              }
              setInventory(data.inventory)
              setRelations(data.relations)
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: data.giftMessage,
                  day: playerStateRef.current.day,
                  chapter: playerStateRef.current.chapter
                }
              ])
              setAffectionToast(
                `🎁 ${data.giftMessage}（好感 +${data.affectionChange}）`
              )
            } catch (error) {
              console.error('[gift] 赠送失败:', error)
            }
          }}
          affectionStages={affectionStages}
          selectedDay={selectedDay}
          currentDay={playerState.day}
          onDayChange={setSelectedDay}
          onMemoryClick={(idx) => {
            const el = document.querySelector(`[data-msg-index="${idx}"]`)
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el?.classList.add('ring-2', 'ring-primary/50')
            setTimeout(
              () => el?.classList.remove('ring-2', 'ring-primary/50'),
              2000
            )
          }}
        />
      </div>

      {debugEnabled && <DebugPanel data={debugData} />}

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

      {/* C3 好感度/赠送即时反馈 */}
      {affectionToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/95 border border-zinc-700/60 text-xs text-zinc-200 shadow-[0_4px_16px_rgba(0,0,0,0.4)] animate-message-enter max-w-[80vw] truncate">
          {affectionToast}
        </div>
      )}
    </div>
  )
}
