export interface PlayerState {
  playerName: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  location: string;
  chapter: string;
  day: number;
  time: string;
}

export interface Choice {
  id: string;
  text: string;
}

export interface SceneInfo {
  mood: string;
  weather: string;
  time: string;
}

export interface StateChanges {
  hp?: number;
  mp?: number;
  gold?: number;
  location?: string;
  chapter?: string;
  day?: number;
  time?: string;
}

export interface AffectionChanges {
  [characterId: string]: number;
}

export interface GameEvent {
  type: "event" | "decision" | "item" | "relationship";
  content: string;
  importance: number;
}

export interface GameUpdate {
  type: "game_update";
  narration: string;
  choices: Choice[];
  stateChanges?: StateChanges;
  affectionChanges?: AffectionChanges;
  harmonyChange?: number;
  newMemory?: GameEvent;
  newItems?: { id: string; name: string }[];
  scene?: SceneInfo;
  newChoices?: Choice[];
}

export interface NarrationSegment {
  type: "narration" | "choice";
  content: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SaveMeta {
  id: string;
  name: string;
  slot: number;
  createdAt: string;
  updatedAt: string;
  playerName: string;
  chapter: string;
  location: string;
  day: number;
  time: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
}

export interface SaveData extends SaveMeta {
  relations: Relation[];
  inventory: InventoryItem[];
  memories: MemoryItem[];
  dialogueHistory: Message[];
  summary: string;
  harmony: number;
  scene: SceneInfo | null;
}

export interface Relation {
  characterId: string;
  characterName: string;
  affection: number;
  stage: string;
  events: string[];
}

export interface AffectionStage {
  max: number;
  label: string;
  actionDescriptions: string[];
}

export interface InventoryItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface MemoryItem {
  id: string;
  type: "event" | "decision" | "item" | "relationship";
  content: string;
  importance: number;
  createdAt: string;
}

export const AFFECTION_STAGES: Record<
  string,
  { min: number; max: number; label: string }
> = {
  stranger: { min: 0, max: 20, label: "陌生人" },
  acquainted: { min: 21, max: 40, label: "认识" },
  friend: { min: 41, max: 60, label: "朋友" },
  intimate: { min: 61, max: 80, label: "暧昧" },
  close: { min: 81, max: 95, label: "亲密" },
  lover: { min: 96, max: 100, label: "恋人" },
};

export function getAffectionStage(affection: number): string {
  for (const [key, range] of Object.entries(AFFECTION_STAGES)) {
    if (affection >= range.min && affection <= range.max) {
      return key;
    }
  }
  return "stranger";
}
