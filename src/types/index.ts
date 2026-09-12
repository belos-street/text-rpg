export interface PlayerState {
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
}

export interface Choice {
  id: string
  text: string
}

export interface SceneInfo {
  mood: string
  weather: string
  time: string
}

export interface StateChanges {
  hp?: number
  mp?: number
  gold?: number
  location?: string
  chapter?: string
  day?: number
  time?: string
}

export interface AffectionChanges {
  [characterId: string]: number
}

export interface GameEvent {
  type: 'event' | 'decision' | 'item' | 'relationship'
  content: string
  importance: number
}

export interface GameUpdate {
  type: 'game_update'
  narration: string
  choices: Choice[]
  stateChanges?: StateChanges
  affectionChanges?: AffectionChanges
  affectionReason?: string
  flagsChanges?: Record<string, number | boolean | string>
  harmonyChange?: number
  newMemory?: GameEvent
  newItems?: { id: string; name: string }[]
  scene?: SceneInfo
  ending?: string
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  day?: number
  chapter?: string
}

export interface SaveMeta {
  id: string
  name: string
  slot: number
  createdAt: string
  updatedAt: string
  playerName: string
  chapter: string
  location: string
  day: number
  time: string
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  gold: number
}

export interface SaveData extends SaveMeta {
  relations: Relation[]
  inventory: InventoryItem[]
  memories: MemoryItem[]
  /** 剧情标记：主线过关条件/支线触发的结构化状态（B5） */
  flags?: Record<string, number | boolean | string>
  summary: string
  /** M3：上次真 LLM 摘要时的会话消息总数（触发节流用），undefined 表示尚未做过真摘要 */
  summarySeq?: number
  harmony: number
  scene: SceneInfo | null
}

export interface Relation {
  characterId: string
  characterName: string
  affection: number
  stage: string
  events: string[]
}

export interface AffectionStage {
  max: number
  label: string
  actionDescriptions: string[]
}

export interface InventoryItem {
  itemId: string
  itemName: string
  quantity: number
}

export interface MemoryItem {
  id: string
  type: 'event' | 'decision' | 'item' | 'relationship'
  content: string
  importance: number
  createdAt: string
  day?: number
  messageIndex?: number
  chapter?: string
}
