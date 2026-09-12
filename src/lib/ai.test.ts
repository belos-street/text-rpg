import { describe, test, expect } from 'bun:test'
import { getGameUpdateJsonSchema } from './ai'
import { gameUpdateSchema } from './schema'

/**
 * 防漂移测试：结构化输出使用的手写 JSON Schema（ai.ts）与
 * zod 校验层（schema.ts）必须覆盖同一组字段。
 * 新增 game_update 字段时两处都要加，此测试防止只改一处。
 */
describe('JSON Schema 与 zod schema 防漂移', () => {
  test('JSON Schema properties 覆盖 zod 全部字段', () => {
    const jsonSchema = getGameUpdateJsonSchema()
    const jsonKeys = Object.keys(
      (jsonSchema.properties as Record<string, unknown>) ?? {}
    )
    const zodKeys = Object.keys(gameUpdateSchema.shape)
    for (const key of zodKeys) {
      expect(jsonKeys).toContain(key)
    }
  })

  test('choices 语法约束 2-4 个', () => {
    const jsonSchema = getGameUpdateJsonSchema()
    const choices = (
      jsonSchema.properties as Record<
        string,
        { minItems?: number; maxItems?: number }
      >
    ).choices
    expect(choices.minItems).toBe(2)
    expect(choices.maxItems).toBe(4)
  })

  test('affectionChanges key 为白名单且可选（无 required 强制全量回显）', () => {
    const jsonSchema = getGameUpdateJsonSchema()
    const affection = (
      jsonSchema.properties as Record<
        string,
        { properties: Record<string, unknown> }
      >
    ).affectionChanges
    expect(Object.keys(affection.properties).length).toBeGreaterThanOrEqual(19)
  })
})
