import { z } from 'zod'

/**
 * LLM 输出的 game_update 校验层。
 * 策略：字段级容错（coerce + catch），坏字段剔除而非整体拒绝，
 * 保证 route 层拿到的数据类型安全。
 */

// z.coerce.string() 会把 undefined 变成 "undefined"，因此缺失字段先归一为 fallback
const coerceString = (fallback: string) =>
  z.preprocess(
    (v) => (v === undefined || v === null ? fallback : v),
    z.coerce.string().catch(fallback)
  )

const choiceSchema = z.object({
  id: coerceString(''),
  text: coerceString('')
})

const stateChangesSchema = z
  .object({
    hp: z.coerce.number().optional().catch(undefined),
    mp: z.coerce.number().optional().catch(undefined),
    gold: z.coerce.number().optional().catch(undefined),
    location: coerceString('').optional().catch(undefined),
    chapter: coerceString('').optional().catch(undefined),
    day: z.coerce.number().optional().catch(undefined),
    time: coerceString('').optional().catch(undefined)
  })
  .optional()
  .catch(undefined)

const memoryTypeSchema = z
  .enum(['event', 'decision', 'item', 'relationship'])
  .catch('event')

export const gameUpdateSchema = z.object({
  type: z.string().optional(),
  narration: coerceString(''),
  choices: z.array(choiceSchema).max(8).catch([]),
  stateChanges: stateChangesSchema,
  affectionChanges: z
    .record(z.string(), z.coerce.number())
    .optional()
    .catch(undefined),
  affectionReason: coerceString('').optional().catch(undefined),
  flagsChanges: z
    .record(
      z.string(),
      z.union([z.boolean(), z.coerce.number(), z.coerce.string()])
    )
    .optional()
    .catch(undefined),
  harmonyChange: z.coerce.number().optional().catch(undefined),
  newMemory: z
    .object({
      type: memoryTypeSchema,
      content: coerceString(''),
      importance: z.coerce.number().min(1).max(10).catch(5)
    })
    .optional()
    .catch(undefined),
  newItems: z
    .array(
      z.object({
        id: coerceString(''),
        name: coerceString('')
      })
    )
    .optional()
    .catch(undefined),
  scene: z
    .object({
      mood: coerceString(''),
      weather: coerceString(''),
      time: coerceString('')
    })
    .optional()
    .catch(undefined),
  ending: z
    .preprocess(
      (v) => (v === undefined || v === null ? '' : v),
      z.coerce
        .string()
        .refine(
          (v) => !/^(none|null|undefined|无|无结局|-)$/i.test(v),
          '非结局'
        )
        .catch('')
    )
    .optional()
    .catch(undefined)
})

export type ParsedGameUpdate = z.infer<typeof gameUpdateSchema>

// ---------- API 请求体校验（No.14 + #24） ----------

export const chatRequestSchema = z.object({
  saveId: z.string().optional(),
  message: z.string().max(2000).optional(),
  playerName: z.string().min(1).max(20).optional(),
  /** C1 重新生成：移除最后一轮对话后重掷叙述与选项 */
  regenerate: z.boolean().optional(),
  /** D4 调试面板：附带请求提示词/原始输出等诊断信息 */
  debug: z.boolean().optional()
})

export const createSaveRequestSchema = z.object({
  playerName: z.string().min(1).max(20)
})
