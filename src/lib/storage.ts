import { generateId, toBigrams } from "./utils";
import { loadStoryConfig } from "./game-data";
import { extractNarration } from "./parser";
import { getDb } from "./db";
import type { SaveData, SaveMeta, Message } from "@/types";

const MAX_MEMORIES = 20;
// generateId 产生 10 字节随机数的 hex（20 字符），在此收紧格式以防注入/穿越
const SAVE_ID_PATTERN = /^[a-f0-9]{20}$/;

function normalizeSaveId(id: string): string | null {
  return SAVE_ID_PATTERN.test(id) ? id : null;
}

// 同一存档的写操作按 id 串行化，消除并发读改写互相覆盖（双开标签页/停止后立刻重发）
const writeQueues = new Map<string, Promise<unknown>>();

function enqueueWrite<T>(id: string, task: () => T): Promise<T> {
  const prev = writeQueues.get(id) ?? Promise.resolve();
  const next = prev.then(task);
  writeQueues.set(
    id,
    next.catch(() => undefined),
  );
  return next;
}

function toMeta(data: SaveData): SaveMeta {
  return {
    id: data.id,
    name: data.name,
    slot: data.slot,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    playerName: data.playerName,
    chapter: data.chapter,
    location: data.location,
    day: data.day,
    time: data.time,
    hp: data.hp,
    maxHp: data.maxHp,
    mp: data.mp,
    maxMp: data.maxMp,
    gold: data.gold,
  };
}

function parseSaveRow(id: string, raw: string): SaveData | null {
  try {
    return JSON.parse(raw) as SaveData;
  } catch (error) {
    console.error(`[storage] 存档 ${id} 的 JSON 损坏，已跳过:`, error);
    return null;
  }
}

export function listSaves(): SaveMeta[] {
  const rows = getDb()
    .query("SELECT id, data FROM saves")
    .all() as { id: string; data: string }[];
  return rows
    .map((row) => parseSaveRow(row.id, row.data))
    .filter((s): s is SaveData => s !== null)
    .map(toMeta)
    .sort((a, b) => a.slot - b.slot);
}

export function getSave(id: string): SaveData | null {
  const validId = normalizeSaveId(id);
  if (!validId) return null;
  const row = getDb()
    .query("SELECT id, data FROM saves WHERE id = ?")
    .get(validId) as { id: string; data: string } | null;
  if (!row) return null;
  try {
    return JSON.parse(row.data) as SaveData;
  } catch {
    return null;
  }
}

export function createSave(
  data: Omit<SaveData, "id" | "createdAt" | "updatedAt">,
): SaveData {
  const save: SaveData = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  getDb()
    .query(
      `INSERT INTO saves (id, slot, player_name, chapter, day, updated_at, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      save.id,
      save.slot,
      save.playerName,
      save.chapter,
      save.day,
      save.updatedAt,
      JSON.stringify(save),
    );
  return save;
}

function updateSaveNow(validId: string, data: Partial<SaveData>): SaveData | null {
  const save = getSave(validId);
  if (!save) return null;

  let memories = data.memories || save.memories;
  if (memories && memories.length > MAX_MEMORIES) {
    memories = [...memories]
      .sort(
        (a, b) =>
          b.importance - a.importance ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, MAX_MEMORIES);
  }

  const updated: SaveData = {
    ...save,
    ...data,
    id: save.id,
    createdAt: save.createdAt,
    updatedAt: new Date().toISOString(),
    memories,
  };
  getDb()
    .query(
      `UPDATE saves
       SET data = ?, slot = ?, player_name = ?, chapter = ?, day = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      JSON.stringify(updated),
      updated.slot,
      updated.playerName,
      updated.chapter,
      updated.day,
      updated.updatedAt,
      validId,
    );
  return updated;
}

export function updateSave(
  id: string,
  data: Partial<SaveData>,
): Promise<SaveData | null> {
  const validId = normalizeSaveId(id);
  if (!validId) return Promise.resolve(null);
  return enqueueWrite(validId, () => updateSaveNow(validId, data));
}

export function deleteSave(id: string): boolean {
  const validId = normalizeSaveId(id);
  if (!validId) return false;
  const db = getDb();
  const result = db
    .query("DELETE FROM saves WHERE id = ?")
    .run(validId);
  db.query("DELETE FROM conversations WHERE save_id = ?").run(validId);
  db.query("DELETE FROM fts_memories WHERE save_id = ?").run(validId);
  return Number(result.changes) > 0;
}

export function getConversation(saveId: string, limit?: number): Message[] {
  const validId = normalizeSaveId(saveId);
  if (!validId) return [];
  const db = getDb();
  // #18 查询侧封顶：带 limit 时只取最近 N 条（倒序取回后正序返回），
  // 长战役下每回合不再全量加载；不带 limit 用于读档恢复/导出等全量场景
  const rows = (
    limit && limit > 0
      ? db
          .query(
            "SELECT role, content, day, chapter FROM conversations WHERE save_id = ? ORDER BY seq DESC LIMIT ?",
          )
          .all(validId, limit)
      : db
          .query(
            "SELECT role, content, day, chapter FROM conversations WHERE save_id = ? ORDER BY seq ASC",
          )
          .all(validId)
  ) as {
    role: string;
    content: string;
    day: number | null;
    chapter: string | null;
  }[];
  const messages = rows.map((row) => ({
    role: row.role as Message["role"],
    content: row.content,
    day: row.day ?? undefined,
    chapter: row.chapter ?? undefined,
  }));
  return limit && limit > 0 ? messages.reverse() : messages;
}

export function countConversation(saveId: string): number {
  const validId = normalizeSaveId(saveId);
  if (!validId) return 0;
  const row = getDb()
    .query("SELECT COUNT(*) AS total FROM conversations WHERE save_id = ?")
    .get(validId) as { total: number };
  return Number(row.total);
}

export interface MemoryHit {
  day: number | null;
  chapter: string | null;
  content: string;
}

/**
 * RAG 阶段 2：FTS5 全文检索历史剧情（中文 bigram 索引）。
 * 查询串 = 玩家输入 + 状态实体（由调用方拼接）；bm25 相关度排序，
 * 默认排除提示词窗口内已有的最近 10 条，命中内容对 assistant 提取叙述。
 */
export function searchMemories(
  saveId: string,
  query: string,
  options?: { limit?: number; excludeRecent?: number },
): MemoryHit[] {
  const validId = normalizeSaveId(saveId);
  if (!validId) return [];
  const tokens = toBigrams(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];
  const limit = options?.limit ?? 3;
  const excludeRecent = options?.excludeRecent ?? 10;

  const db = getDb();
  const maxSeqRow = db
    .query("SELECT MAX(seq) AS max FROM conversations WHERE save_id = ?")
    .get(validId) as { max: number | null };
  if (maxSeqRow.max === null) return [];

  // FTS5 保留字安全：token 只含 CJK/字母数字（toBigrams 已剔除标点），加引号兜底
  const match = tokens.map((t) => `"${t}"`).join(" OR ");
  const rows = db
    .query(
      `SELECT c.seq, c.role, c.content, c.day, c.chapter
       FROM fts_memories f
       JOIN conversations c ON c.save_id = f.save_id AND c.seq = f.seq
       WHERE fts_memories MATCH ? AND c.save_id = ? AND c.seq <= ?
       ORDER BY bm25(fts_memories), c.seq ASC
       LIMIT ?`,
    )
    .all(
      match,
      validId,
      maxSeqRow.max - excludeRecent,
      limit,
    ) as {
    seq: number;
    role: string;
    content: string;
    day: number | null;
    chapter: string | null;
  }[];

  return rows.map((row) => ({
    day: row.day,
    chapter: row.chapter,
    content:
      row.role === "assistant"
        ? extractNarration(row.content)
        : row.content,
  }));
}

function appendConversationNow(validId: string, messages: Message[]) {
  if (messages.length === 0) return;
  const db = getDb();
  const nextSeq = db.query(
    "SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM conversations WHERE save_id = ?",
  );
  const insertConv = db.query(
    `INSERT INTO conversations (save_id, seq, role, content, day, chapter, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertFts = db.query(
    "INSERT INTO fts_memories (save_id, seq, text) VALUES (?, ?, ?)",
  );
  const now = new Date().toISOString();
  db.run("BEGIN");
  try {
    let seq = (nextSeq.get(validId) as { next: number }).next;
    for (const m of messages) {
      insertConv.run(
        validId,
        seq,
        m.role,
        m.content,
        m.day ?? null,
        m.chapter ?? null,
        now,
      );
      // RAG 阶段 2：同步维护全文索引（assistant 为原始 JSON，提取叙述后建索引）
      const text = toBigrams(
        m.role === "assistant" ? extractNarration(m.content) : m.content,
      );
      if (text) {
        insertFts.run(validId, seq, text);
      }
      seq += 1;
    }
    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  }
}

export function appendConversation(
  saveId: string,
  messages: Message[],
): Promise<void> {
  const validId = normalizeSaveId(saveId);
  if (!validId) return Promise.resolve();
  return enqueueWrite(validId, () => appendConversationNow(validId, messages));
}

/**
 * C1 重新生成：移除最后一轮对话（assistant + 前置 user）。
 * 返回是否成功移除；不满足移除条件（不足一轮/顺序异常）时返回 false。
 */
export function popLastTurn(saveId: string): Promise<boolean> {
  const validId = normalizeSaveId(saveId);
  if (!validId) return Promise.resolve(false);
  return enqueueWrite(validId, () => {
    const db = getDb();
    const rows = db
      .query("SELECT seq, role FROM conversations WHERE save_id = ? ORDER BY seq DESC LIMIT 2")
      .all(validId) as { seq: number; role: string }[];
    if (rows.length < 2) return false;
    if (rows[0].role !== "assistant" || rows[1].role !== "user") return false;
    db.query("DELETE FROM conversations WHERE save_id = ? AND seq IN (?, ?)").run(
      validId,
      rows[0].seq,
      rows[1].seq,
    );
    db.query(
      "DELETE FROM fts_memories WHERE save_id = ? AND seq IN (?, ?)",
    ).run(validId, rows[0].seq, rows[1].seq);
    return true;
  });
}

export function summarizeConversation(
  messages: Message[],
  currentSummary: string,
): string {
  const lastMessages = messages.slice(-6);
  const keyEvents = lastMessages
    .filter((m) => m.role !== "system")
    .map((m) => {
      // assistant 存的是原始 JSON，先提取叙述再截断，避免 {"type":... 污染摘要
      const source = m.role === "assistant" ? extractNarration(m.content) : m.content;
      const content =
        source.length > 120 ? source.slice(0, 120) + "..." : source;
      return `${m.role === "user" ? "玩家" : "旁白"}: ${content}`;
    })
    .join("\n");

  const baseSummary =
    currentSummary.length > 200
      ? currentSummary.slice(0, 200) + "……"
      : currentSummary;

  return `${baseSummary ? baseSummary + "\n" : ""}${keyEvents}`
    .split("\n")
    .slice(-15)
    .join("\n");
}

export function createInitialSave(playerName: string): SaveData {
  const config = loadStoryConfig();
  const {
    initialState,
    initialInventory,
    initialMemory,
    initialSummary,
    initialRelations,
  } = config;
  // #20：槽位自动分配——取现有最大槽位 +1
  const existingSaves = listSaves();
  const slot = existingSaves.reduce((max, s) => Math.max(max, s.slot), 0) + 1;
  return createSave({
    name: `${playerName} - 第${initialState.day}天`,
    slot,
    playerName,
    chapter: initialState.chapter,
    location: initialState.location,
    day: initialState.day,
    time: initialState.time,
    hp: initialState.hp,
    maxHp: initialState.maxHp,
    mp: initialState.mp,
    maxMp: initialState.maxMp,
    gold: initialState.gold,
    relations: initialRelations.map((r) => ({
      characterId: r.characterId,
      characterName: r.characterName,
      affection: r.affection,
      stage: r.stage,
      events: [],
    })),
    inventory: initialInventory.map((i) => ({
      itemId: i.itemId,
      itemName: i.itemName,
      quantity: i.quantity,
    })),
    memories: [
      {
        id: generateId(),
        type: initialMemory.type as
          | "event"
          | "decision"
          | "item"
          | "relationship",
        content: initialMemory.content,
        importance: initialMemory.importance,
        createdAt: new Date().toISOString(),
      },
    ],
    flags: {},
    summary: initialSummary,
    harmony: initialState.harmony,
    scene: initialState.scene,
  });
}
