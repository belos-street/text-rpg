import { getDb } from './db'

/**
 * C6 结局图鉴：跨存档的全局进度（SQLite global_progress 表）。
 * 记录已解锁结局，供标题屏展示与复玩激励。
 */

export interface GlobalProgress {
  unlockedEndings: string[]
  updatedAt: string
}

export function getGlobalProgress(): GlobalProgress {
  const rows = getDb()
    .query('SELECT key, updated_at FROM global_progress')
    .all() as { key: string; updated_at: string | null }[]
  const unlockedEndings = rows
    .filter((row) => row.key.startsWith('ending:'))
    .map((row) => row.key.slice('ending:'.length))
  const updatedAt =
    rows
      .map((row) => row.updated_at ?? '')
      .filter(Boolean)
      .sort()
      .pop() ?? ''
  return { unlockedEndings, updatedAt }
}

export function unlockEnding(endingId: string): GlobalProgress {
  getDb()
    .query(
      `INSERT INTO global_progress (key, value, updated_at) VALUES (?, '', ?)
       ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at`
    )
    .run(`ending:${endingId}`, new Date().toISOString())
  return getGlobalProgress()
}
