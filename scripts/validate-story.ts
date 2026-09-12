/**
 * D3 game-data 校验 CLI —— bun run validate:story
 * 检查故事包的结构完整性与配置一致性，创建期拦截常见问题。
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), 'game-data')

const errors: string[] = []
const warnings: string[] = []
let checks = 0

function check(condition: boolean, message: string) {
  checks++
  if (!condition) errors.push(message)
}

function warn(condition: boolean, message: string) {
  checks++
  if (!condition) warnings.push(message)
}

function requireFile(rel: string) {
  check(fs.existsSync(path.join(ROOT, rel)), `缺少文件: ${rel}`)
}

// ---------- 1. 目录与必需文件 ----------
const requiredFiles = [
  '00_故事配置/config.json',
  '01_全局游戏规则/core-rules.md',
  '02_世界观背景库/world-setting.md',
  '03_角色人物档案/protagonist.md',
  '03_角色人物档案/npcs/index.md',
  '04_剧情故事库/main-quest.md',
  '04_剧情故事库/side-stories/index.md',
  '04_剧情故事库/endings/index.md',
  '05_场景地图库/locations.md',
  '06_道具技能天赋/items.md',
  '06_道具技能天赋/skills.md',
  '09_判定数值表/affection.md',
  '09_判定数值表/combat.md'
]
for (const f of requiredFiles) requireFile(f)

// ---------- 2. config.json ----------
const configPath = path.join(ROOT, '00_故事配置', 'config.json')
let config: Record<string, unknown> = {}
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
} catch (error) {
  errors.push(
    `config.json 解析失败: ${error instanceof Error ? error.message : error}`
  )
}

const relations =
  (config.initialRelations as
    | { characterId: string; characterName: string }[]
    | undefined) ?? []
const characterIds = relations.map((r) => r.characterId)

check(
  typeof config.title === 'string' && config.title !== '',
  'config.title 缺失'
)
check(typeof config.protagonistName === 'string', 'config.protagonistName 缺失')
check(
  Array.isArray(config.initialRelations) && relations.length > 0,
  'config.initialRelations 为空或缺失'
)
check(
  new Set(characterIds).size === characterIds.length,
  'config.initialRelations 存在重复 characterId'
)
check(
  Array.isArray(config.affectionStages) && config.affectionStages.length > 0,
  'config.affectionStages 为空或缺失'
)
check(
  typeof config.initialState === 'object' && config.initialState !== null,
  'config.initialState 缺失'
)

// ---------- 3. 女主档案数量与 ID 映射 ----------
const heroinesDir = path.join(ROOT, '03_角色人物档案', 'heroines')
if (fs.existsSync(heroinesDir)) {
  const files = fs
    .readdirSync(heroinesDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
  warn(
    files.length === relations.length,
    `女主档案数量(${files.length})与 initialRelations 数量(${relations.length})不一致——按 ID 筛选注入时将以 relations 顺序映射文件`
  )
}

// ---------- 4. characterEmoji 名字与角色名一致 ----------
const emoji =
  (config.characterEmoji as Record<string, string> | undefined) ?? {}
const characterNames = new Set(relations.map((r) => r.characterName))
for (const name of Object.keys(emoji)) {
  check(
    characterNames.has(name),
    `characterEmoji 中的名字「${name}」不在 initialRelations 的角色名中`
  )
}

// ---------- 5. 章节与女主映射 / flags 声明 ----------
const chapters = (config.chapters as string[] | undefined) ?? []
const chapterHeroines =
  (config.chapterHeroines as Record<string, string[]> | undefined) ?? {}
for (const [chapter, ids] of Object.entries(chapterHeroines)) {
  check(
    chapters.includes(chapter),
    `chapterHeroines 的章节「${chapter}」不在 config.chapters 中`
  )
  for (const id of ids) {
    check(
      characterIds.includes(id),
      `chapterHeroines[${chapter}] 含未知角色 ID: ${id}`
    )
  }
}
for (const flagId of Object.keys(
  (config.flags as Record<string, string> | undefined) ?? {}
)) {
  warn(
    /^[a-z0-9_]+$/.test(flagId),
    `flags 标记「${flagId}」建议使用 snake_case 命名`
  )
}

// ---------- 输出 ----------
console.log(`\n🎮 校验故事包: ${ROOT}`)
console.log(`   已执行 ${checks} 项检查\n`)
if (errors.length > 0) {
  for (const e of errors) console.error(`  ✗ ${e}`)
}
if (warnings.length > 0) {
  for (const w of warnings) console.warn(`  ⚠ ${w}`)
}
if (errors.length === 0 && warnings.length === 0) {
  console.log('  ✓ 全部通过')
}
console.log('')

if (errors.length > 0) process.exit(1)
