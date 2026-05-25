import fs from "fs";
import path from "path";
import { generateId } from "./utils";
import { loadStoryConfig } from "./game-data";
import type { SaveData, SaveMeta, Message } from "@/types";

const SAVES_DIR = path.join(process.cwd(), "data", "saves");
const CONVERSATIONS_DIR = path.join(process.cwd(), "data", "conversations");
const MAX_MEMORIES = 20;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function savePath(id: string): string {
  return path.join(SAVES_DIR, `${id}.json`);
}

function conversationPath(id: string): string {
  return path.join(CONVERSATIONS_DIR, `${id}.json`);
}

export function listSaves(): SaveMeta[] {
  ensureDir(SAVES_DIR);
  const files = fs.readdirSync(SAVES_DIR).filter((f) => f.endsWith(".json"));
  return files
    .map((f) => {
      try {
        const data: SaveData = JSON.parse(
          fs.readFileSync(path.join(SAVES_DIR, f), "utf-8"),
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
      } catch {
        return null;
      }
    })
    .filter((s): s is SaveMeta => s !== null)
    .sort((a, b) => a.slot - b.slot);
}

export function getSave(id: string): SaveData | null {
  ensureDir(SAVES_DIR);
  try {
    const raw = fs.readFileSync(savePath(id), "utf-8");
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function createSave(
  data: Omit<SaveData, "id" | "createdAt" | "updatedAt">,
): SaveData {
  ensureDir(SAVES_DIR);
  const save: SaveData = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(savePath(save.id), JSON.stringify(save, null, 2), "utf-8");
  return save;
}

export function updateSave(
  id: string,
  data: Partial<SaveData>,
): SaveData | null {
  const save = getSave(id);
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
  fs.writeFileSync(savePath(id), JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

export function deleteSave(id: string): boolean {
  try {
    fs.unlinkSync(savePath(id));
    const convPath = conversationPath(id);
    if (fs.existsSync(convPath)) {
      fs.unlinkSync(convPath);
    }
    return true;
  } catch {
    return false;
  }
}

export function getConversation(saveId: string): Message[] {
  ensureDir(CONVERSATIONS_DIR);
  try {
    const raw = fs.readFileSync(conversationPath(saveId), "utf-8");
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

export function appendConversation(saveId: string, messages: Message[]) {
  ensureDir(CONVERSATIONS_DIR);
  const existing = getConversation(saveId);
  const updated = [...existing, ...messages];
  fs.writeFileSync(
    conversationPath(saveId),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );
}

export function summarizeConversation(
  messages: Message[],
  currentSummary: string,
): string {
  const lastMessages = messages.slice(-6);
  const keyEvents = lastMessages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const content =
        m.content.length > 120 ? m.content.slice(0, 120) + "..." : m.content;
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
  return createSave({
    name: `${playerName} - 第${initialState.day}天`,
    slot: 1,
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
    dialogueHistory: [],
    summary: initialSummary,
    harmony: initialState.harmony,
    scene: initialState.scene,
  });
}
