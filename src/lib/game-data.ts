import fs from 'fs'
import path from 'path'
import type { AffectionStage } from '@/types'

export interface StoryConfig {
  title: string
  subtitle: string
  loadingText: string
  emptyChatTitle: string
  emptyChatSubtitle: string
  protagonistName: string
  initialState: {
    chapter: string
    location: string
    day: number
    time: string
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    gold: number
    harmony: number
    scene: { mood: string; weather: string; time: string }
  }
  initialInventory: { itemId: string; itemName: string; quantity: number }[]
  initialMemory: { type: string; content: string; importance: number }
  initialSummary: string
  characterEmoji: Record<string, string>
  affectionStages: AffectionStage[]
  initialRelations: {
    characterId: string
    characterName: string
    affection: number
    stage: string
  }[]
  /** 章节枚举（B8）：LLM 只能从列表中选章节 */
  chapters?: string[]
  /** 每章节重点女主（M1）：chapter 标识 → characterId 列表 */
  chapterHeroines?: Record<string, string[]>
  /** 剧情标记声明（B5）：flagId → 中文说明 */
  flags?: Record<string, string>
  /** 固定开场序章（C2）：不走 LLM，零延迟开局 */
  openingNarration?: string
}

const GAME_DATA_DIR = path.join(process.cwd(), 'game-data')

// 按 mtime 失效的内容缓存：避免每回合重复读盘，同时保住 dev 时改档热更新
const fileCache = new Map<string, { mtimeMs: number; content: string }>()

function readMdFile(filePath: string): string {
  try {
    const mtimeMs = fs.statSync(filePath).mtimeMs
    const cached = fileCache.get(filePath)
    if (cached && cached.mtimeMs === mtimeMs) return cached.content
    const content = fs.readFileSync(filePath, 'utf-8')
    fileCache.set(filePath, { mtimeMs, content })
    return content
  } catch {
    return ''
  }
}

function listMdFiles(dir: string): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(dir, entry.name))
      } else if (entry.isDirectory()) {
        files.push(...listMdFiles(path.join(dir, entry.name)))
      }
    }
    return files
  } catch {
    return []
  }
}

export function loadCoreRules(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, '01_全局游戏规则', 'core-rules.md')
  )
}

export function loadWorldSetting(): string {
  const world = readMdFile(
    path.join(GAME_DATA_DIR, '02_世界观背景库', 'world-setting.md')
  )
  const magic = readMdFile(
    path.join(GAME_DATA_DIR, '02_世界观背景库', 'magic-system.md')
  )
  return world + '\n\n' + magic
}

export function loadProtagonist(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, '03_角色人物档案', 'protagonist.md')
  )
}

export function loadHeroines(): string {
  return loadHeroinesByIds(undefined)
}

/**
 * 按角色 ID 列表筛选女主档案（M1）。
 * 文件按文件名排序后的序号与 config.initialRelations 的顺序一一对应；
 * 未传 ids 或映射失败时回退全量。
 */
export function loadHeroinesByIds(includeIds?: string[]): string {
  const files = listMdFiles(
    path.join(GAME_DATA_DIR, '03_角色人物档案', 'heroines')
  ).sort()
  let selected = files
  if (includeIds && includeIds.length > 0) {
    const ids = loadStoryConfig().initialRelations.map((r) => r.characterId)
    const filtered = files.filter((_, i) => includeIds.includes(ids[i]))
    if (filtered.length > 0) selected = filtered
  }
  return selected.map((f) => readMdFile(f)).join('\n\n---\n\n')
}

/** 从存档章节字符串提取章节标识（序章/第N章/终章） */
export function chapterKeyOf(
  chapter: string | null | undefined
): string | null {
  if (!chapter) return null
  const trimmed = chapter.trim()
  if (trimmed.startsWith('序章')) return '序章'
  if (trimmed.includes('终章')) return '终章'
  const match = trimmed.match(/第\s*(\d+)\s*章/)
  return match ? `第${match[1]}章` : null
}

/** 当前章节的重点女主 ID；未配置时返回 undefined（回退全量） */
function heroineIdsForChapter(chapterKey: string | null): string[] | undefined {
  if (!chapterKey) return undefined
  const map = loadStoryConfig().chapterHeroines
  const ids = map?.[chapterKey]
  return ids && ids.length > 0 ? ids : undefined
}

export function loadEssentialGameData(
  chapterKey: string | null = null
): string {
  return [
    '===== 全局游戏规则（核心，必须遵守）=====',
    loadCoreRules(),
    '===== 主角设定 =====',
    loadProtagonist(),
    '===== 女主角们（当前章节相关）=====',
    loadHeroinesByIds(heroineIdsForChapter(chapterKey)),
    '===== 好感度判定 =====',
    loadAffectionTable(),
    '===== 场景地图 =====',
    loadLocations()
  ].join('\n\n')
}

/**
 * 主线大纲按章注入（M2）：总纲 + 当前章节概要 + 章节推进原则。
 * chapterKey 为 null 时返回完整大纲。
 */
export function loadMainQuestForChapter(chapterKey: string | null): string {
  const full = readMdFile(
    path.join(GAME_DATA_DIR, '04_剧情故事库', 'main-quest.md')
  )
  if (!full || !chapterKey) return full

  const lines = full.split('\n')
  const blocks: { header: string; level: number; body: string[] }[] = []
  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s/)
    if (heading) {
      blocks.push({ header: line, level: heading[1].length, body: [] })
    } else if (blocks.length > 0) {
      blocks[blocks.length - 1].body.push(line)
    }
  }
  const pickBlocks = (
    predicate: (b: { header: string; level: number }) => boolean
  ) =>
    blocks
      .filter(predicate)
      .map((b) => [b.header, ...b.body].join('\n'))
      .join('\n\n')
  const pickH2 = (keyword: string) =>
    pickBlocks((b) => b.level === 2 && b.header.includes(keyword))

  const parts: string[] = []
  const overview = pickH2('总纲')
  if (overview) parts.push(overview)

  if (chapterKey === '序章') {
    const section = pickH2('序章')
    if (section) parts.push(section)
  } else if (chapterKey === '终章') {
    const section = pickH2('终章')
    if (section) parts.push(section)
  } else {
    const num = chapterKey.replace(/[^0-9]/g, '')
    const section = pickBlocks(
      (b) => b.level === 3 && b.header.includes(`第 ${num} 章`)
    )
    if (section) parts.push(section)
  }

  const rules = pickH2('章节推进原则')
  if (rules) parts.push(rules)

  const composed = parts.join('\n\n')
  // 提取失败时回退完整大纲，保证 GM 始终持有主线信息
  return composed || full
}

export function loadNPCs(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, '03_角色人物档案', 'npcs', 'index.md')
  )
}

export function loadMainQuest(): string {
  return readMdFile(path.join(GAME_DATA_DIR, '04_剧情故事库', 'main-quest.md'))
}

export function loadSideStories(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, '04_剧情故事库', 'side-stories', 'index.md')
  )
}

export function loadEndings(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, '04_剧情故事库', 'endings', 'index.md')
  )
}

export function loadLocations(): string {
  return readMdFile(path.join(GAME_DATA_DIR, '05_场景地图库', 'locations.md'))
}

export function loadItems(): string {
  return readMdFile(path.join(GAME_DATA_DIR, '06_道具技能天赋', 'items.md'))
}

export function loadSkills(): string {
  return readMdFile(path.join(GAME_DATA_DIR, '06_道具技能天赋', 'skills.md'))
}

export function loadAffectionTable(): string {
  return readMdFile(path.join(GAME_DATA_DIR, '09_判定数值表', 'affection.md'))
}

export function loadCombatTable(): string {
  return readMdFile(path.join(GAME_DATA_DIR, '09_判定数值表', 'combat.md'))
}

export function loadStoryConfig(): StoryConfig {
  const configPath = path.join(GAME_DATA_DIR, '00_故事配置', 'config.json')
  const raw = readMdFile(configPath)
  if (raw) {
    try {
      return JSON.parse(raw) as StoryConfig
    } catch (error) {
      console.error('[game-data] config.json 解析失败，使用默认配置:', error)
    }
  }
  return {
    title: '未命名故事',
    subtitle: '请配置 game-data/00_故事配置/config.json',
    loadingText: '加载中……',
    emptyChatTitle: '欢迎',
    emptyChatSubtitle: '开始你的故事',
    protagonistName: '主角',
    initialState: {
      chapter: '序章',
      location: '未知之地',
      day: 1,
      time: '早晨',
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      harmony: 50,
      scene: { mood: '平静', weather: '晴朗', time: '早晨' }
    },
    initialInventory: [],
    initialMemory: { type: 'event', content: '故事开始。', importance: 5 },
    initialSummary: '故事刚刚开始。',
    characterEmoji: {},
    affectionStages: [
      { max: 20, label: '陌生', actionDescriptions: [] },
      { max: 100, label: '熟悉', actionDescriptions: [] }
    ],
    initialRelations: []
  }
}
