import { describe, test, expect } from 'bun:test'
import { isSummaryStale, buildSummaryInput } from './summary'

describe('isSummaryStale（M3 触发节流）', () => {
  test('从未做过真摘要时，达到阈值即触发', () => {
    expect(isSummaryStale(10, undefined)).toBe(true)
    expect(isSummaryStale(9, undefined)).toBe(false)
  })

  test('以上次摘要位置为基准累计', () => {
    expect(isSummaryStale(30, 20)).toBe(true)
    expect(isSummaryStale(29, 20)).toBe(false)
    // 摘要刚更新过：不触发
    expect(isSummaryStale(30, 30)).toBe(false)
  })
})

describe('buildSummaryInput（M3 摘要输入构建）', () => {
  test('assistant 原始 JSON 提取为叙述，不污染输入', () => {
    const rawJson = JSON.stringify({
      type: 'game_update',
      narration: '我在旧城区的义诊摊前醒来，莉娅帮我处理了伤口。',
      choices: [{ id: 'A', text: '道谢' }]
    })
    const input = buildSummaryInput('旧摘要内容', [
      { role: 'user', content: '睁开眼睛' },
      { role: 'assistant', content: rawJson }
    ])
    expect(input).toContain('【此前摘要】旧摘要内容')
    expect(input).toContain('我在旧城区的义诊摊前醒来')
    expect(input).not.toContain('game_update')
    expect(input).toContain('玩家: 睁开眼睛')
    expect(input).toContain('旁白: ')
  })

  test('超长叙述逐条截断到 200 字符', () => {
    const long = '剧情'.repeat(200) // 400 字符
    const input = buildSummaryInput('', [{ role: 'user', content: long }])
    expect(input).toContain('…')
    const line = input.split('\n').find((l) => l.startsWith('玩家: '))!
    expect(line.length).toBeLessThanOrEqual('玩家: '.length + 201)
  })

  test('空历史时只有此前摘要段', () => {
    const input = buildSummaryInput('只有摘要', [])
    expect(input).toBe('【此前摘要】只有摘要')
  })
})
