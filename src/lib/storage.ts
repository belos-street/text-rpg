import fs from "fs";
import path from "path";
import { generateId } from "./utils";
import { loadStoryConfig } from "./game-data";
import { extractNarration } from "./parser";
import type { SaveData, SaveMeta, Message } from "@/types";

// 数据目录可通过环境变量注入（测试隔离用），默认项目根目录 data/
function dataDir(): string {
  return process.env.STORAGE_DATA_DIR || path.join(process.cwd(), "data");
}
function savesDir(): string {
  return path.join(dataDir(), "saves");
}
function conversationsDir(): string {
  return path.join(dataDir(), "conversations");
}
const MAX_MEMORIES = 20;
// generateId 产生 10 字节随机数的 hex（20 字符），在此收紧格式以防路径穿越
const SAVE_ID_PATTERN = /^[a-f0-9]{20}$/;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

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

function savePath(id: string): string {
  return path.join(savesDir(), `${id}.json`);
}

function conversationPath(id: string): string {
  return path.join(conversationsDir(), `${id}.json`);
}

export function listSaves(): SaveMeta[] {
  ensureDir(savesDir());
  const files = fs.readdirSync(savesDir()).filter((f) => f.endsWith(".json"));
  return files
    .map((f) => {
      try {
        const data: SaveData = JSON.parse(
          fs.readFileSync(path.join(savesDir(), f), "utf-8"),
        );
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
        } as SaveMeta;
      } catch (error) {
        console.error(`[storage] 存档文件损坏，已从列表跳过: ${f}`, error);
        return null;
      }
    })
    .filter((s): s is SaveMeta => s !== null)
    .sort((a, b) => a.slot - b.slot);
}

export function getSave(id: string): SaveData | null {
  const validId = normalizeSaveId(id);
  if (!validId) return null;
  ensureDir(savesDir());
  try {
    const raw = fs.readFileSync(savePath(validId), "utf-8");
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function createSave(
  data: Omit<SaveData, "id" | "createdAt" | "updatedAt">,
): SaveData {
  ensureDir(savesDir());
  const save: SaveData = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(savePath(save.id), JSON.stringify(save, null, 2), "utf-8");
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
  fs.writeFileSync(savePath(validId), JSON.stringify(updated, null, 2), "utf-8");
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
  try {
    fs.unlinkSync(savePath(validId));
    const convPath = conversationPath(validId);
    if (fs.existsSync(convPath)) {
      fs.unlinkSync(convPath);
    }
    return true;
  } catch {
    return false;
  }
}

export function getConversation(saveId: string): Message[] {
  const validId = normalizeSaveId(saveId);
  if (!validId) return [];
  ensureDir(conversationsDir());
  const filePath = conversationPath(validId);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Message[];
  } catch (error) {
    // 文件不存在是新存档的正常情况；存在但解析失败=已损坏：
    // 先备份再重置，防止下一次 append 把全部历史覆写掉
    if (error instanceof SyntaxError && fs.existsSync(filePath)) {
      const backupPath = `${filePath}.corrupt-${Date.now()}`;
      try {
        fs.renameSync(filePath, backupPath);
        console.error(`[storage] 会话文件损坏，已备份至 ${backupPath}`);
      } catch (renameError) {
        console.error("[storage] 会话文件损坏且备份失败:", renameError);
      }
    }
    return [];
  }
}

function appendConversationNow(validId: string, messages: Message[]) {
  ensureDir(conversationsDir());
  const existing = getConversation(validId);
  const updated = [...existing, ...messages];
  fs.writeFileSync(
    conversationPath(validId),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );
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
    const conversation = getConversation(validId);
    if (conversation.length < 2) return false;
    const last = conversation[conversation.length - 1];
    const prev = conversation[conversation.length - 2];
    if (last.role !== "assistant" || prev.role !== "user") return false;
    fs.writeFileSync(
      conversationPath(validId),
      JSON.stringify(conversation.slice(0, -2), null, 2),
      "utf-8",
    );
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
