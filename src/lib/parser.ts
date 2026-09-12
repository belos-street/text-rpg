import { gameUpdateSchema, type ParsedGameUpdate } from './schema'
import type { Choice } from '@/types'

/**
 * 从 LLM 输出中提取 JSON 的三道闸：
 * 1. 提取（宽容）：优先代码围栏，其次字符串感知的平衡括号扫描
 * 2. 校验（严格）：zod 字段级容错，坏字段剔除而非整体拒绝
 * 3. 降级（可用）：解析失败时对流式半截 JSON 做叙述预览
 */

function extractBalancedJson(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function extractJsonCandidate(text: string): string | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence?.[1] && fence[1].includes('{')) {
    const fromFence = extractBalancedJson(fence[1])
    if (fromFence) return fromFence
  }
  return extractBalancedJson(text)
}

export function parseGameUpdate(text: string): ParsedGameUpdate | null {
  const candidate = extractJsonCandidate(text)
  if (!candidate) return null
  let raw: unknown
  try {
    raw = JSON.parse(candidate)
  } catch {
    return null
  }
  const result = gameUpdateSchema.safeParse(raw)
  if (!result.success) return null
  const data = result.data
  const hasSignal =
    data.narration !== '' ||
    data.choices.length > 0 ||
    data.stateChanges !== undefined ||
    data.affectionChanges !== undefined ||
    data.harmonyChange !== undefined
  return hasSignal ? data : null
}

function unescapeJsonFragment(fragment: string): string {
  let out = ''
  for (let i = 0; i < fragment.length; i++) {
    const ch = fragment[i]
    if (ch === '\\' && i + 1 < fragment.length) {
      const next = fragment[i + 1]
      if (next === 'n') out += '\n'
      else if (next === 't') out += '\t'
      else out += next
      i++
      continue
    }
    if (ch === '"') break
    out += ch
  }
  return out
}

/** 流式半截 JSON 的叙述预览：解析未完成时也能渐进显示 */
export function narrationPreview(text: string): string {
  const match = text.match(/"narration"\s*:\s*"([\s\S]*)/)
  if (match) return unescapeJsonFragment(match[1])
  // 看起来是未完成的游戏 JSON（narration 键还没流到）——返回空串让"思考中"指示器继续显示，
  // 避免把原始 JSON 前缀泄漏给玩家
  if (text.trimStart().startsWith('{')) return ''
  const cleaned = text
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim()
  return cleaned || text
}

export function extractNarration(text: string): string {
  const parsed = parseGameUpdate(text)
  if (parsed && parsed.narration !== '') return parsed.narration
  return narrationPreview(text)
}

export function extractChoices(text: string): Choice[] {
  return parseGameUpdate(text)?.choices ?? []
}
