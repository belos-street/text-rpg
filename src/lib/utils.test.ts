import { describe, test, expect } from 'bun:test'
import { toBigrams } from './utils'

describe('toBigrams（RAG 阶段 2 中文分词）', () => {
  test('中文按相邻两字切分', () => {
    expect(toBigrams('莉娅你好')).toBe('莉娅 娅你 你好')
  })

  test('2 字名称得到单个 token（可精确命中）', () => {
    expect(toBigrams('莉娅')).toBe('莉娅')
  })

  test('标点与空白被剔除', () => {
    expect(toBigrams('莉娅，你好！')).toBe('莉娅 娅你 你好')
    expect(toBigrams('「旧城区」的吊坠……')).toBe(toBigrams('旧城区的吊坠'))
  })

  test('单字输入无 bigram（空串）', () => {
    expect(toBigrams('好')).toBe('')
  })
})
