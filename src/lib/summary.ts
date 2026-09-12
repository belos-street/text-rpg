import { getChatCompletion } from './ai'
import { extractNarration } from './parser'
import { updateSave } from './storage'
import type { Message } from '@/types'

/**
 * M3 真 LLM 摘要：用一次轻量 LLM 调用把旧摘要与近期剧情压缩成
 * 高质量段落，替换启发式拼接的伪 summary（GM 靠它了解"之前发生了什么"）。
 *
 * 触发与节流：每累计 AI_SUMMARY_EVERY 条新消息（默认 10，即 5 个回合）
 * 触发一次；调用方在回合持久化后以 fire-and-forget 方式执行，不阻塞响应，
 * 失败静默重试下一回合。AI_SUMMARY=off 可整体关闭。
 */

export const SUMMARY_EVERY_MESSAGES = Number(process.env.AI_SUMMARY_EVERY || 10)
const SUMMARY_INPUT_MESSAGES = 14
const SUMMARY_MAX_TOKENS = 500
const SUMMARY_MAX_CHARS = 600

export function isSummaryEnabled(): boolean {
  return (process.env.AI_SUMMARY || 'on').toLowerCase() !== 'off'
}

export function isSummaryStale(
  totalMessages: number,
  summarySeq: number | undefined
): boolean {
  return totalMessages - (summarySeq ?? 0) >= SUMMARY_EVERY_MESSAGES
}

/** 摘要输入：伪摘要 + 最近若干条叙述（assistant 提取 narration、逐条截断） */
export function buildSummaryInput(
  currentSummary: string,
  history: Message[]
): string {
  const recent = history
    .filter((m) => m.role !== 'system')
    .slice(-SUMMARY_INPUT_MESSAGES)
    .map((m) => {
      const source =
        m.role === 'assistant' ? extractNarration(m.content) : m.content
      const content = source.length > 200 ? source.slice(0, 200) + '…' : source
      return `${m.role === 'user' ? '玩家' : '旁白'}: ${content}`
    })
    .join('\n')
  const parts = [`【此前摘要】${currentSummary || '（无）'}`]
  if (recent) {
    parts.push('【近期剧情】', recent)
  }
  return parts.join('\n')
}

const SUMMARY_SYSTEM =
  '你是文字冒险游戏的剧情记录员。把【此前摘要】与【近期剧情】合并压缩成一段不超过300字的连贯剧情摘要（第三人称）。必须保留：关键人物与关系变化、重要决定与后果、获得的物品、当前目标与未解决的悬念。直接输出摘要正文，不要任何前缀、标题、引号或评论。'

/**
 * 若触发条件满足则生成并写入新摘要。
 * @param totalMessages 当前会话消息总数（countConversation）
 * @returns 是否实际执行了摘要更新
 */
export async function summarizeSaveIfStale(
  saveId: string,
  currentSummary: string,
  history: Message[],
  totalMessages: number,
  summarySeq: number | undefined
): Promise<boolean> {
  if (!isSummaryEnabled()) return false
  if (!isSummaryStale(totalMessages, summarySeq)) return false
  try {
    const summary = await getChatCompletion(
      [
        { role: 'system', content: SUMMARY_SYSTEM },
        { role: 'user', content: buildSummaryInput(currentSummary, history) }
      ],
      SUMMARY_MAX_TOKENS
    )
    if (!summary || summary.length < 20) {
      console.error('[summary] 摘要输出过短，跳过本次更新（下回合重试）')
      return false
    }
    const trimmed =
      summary.length > SUMMARY_MAX_CHARS
        ? summary.slice(0, SUMMARY_MAX_CHARS)
        : summary
    await updateSave(saveId, { summary: trimmed, summarySeq: totalMessages })
    return true
  } catch (error) {
    console.error('[summary] 摘要生成失败（下回合重试）:', error)
    return false
  }
}
