import fs from "fs";
import path from "path";
import type { AffectionStage } from "@/types";

export interface StoryConfig {
  title: string;
  subtitle: string;
  loadingText: string;
  emptyChatTitle: string;
  emptyChatSubtitle: string;
  protagonistName: string;
  initialState: {
    chapter: string;
    location: string;
    day: number;
    time: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    gold: number;
    harmony: number;
    scene: { mood: string; weather: string; time: string };
  };
  initialInventory: { itemId: string; itemName: string; quantity: number }[];
  initialMemory: { type: string; content: string; importance: number };
  initialSummary: string;
  characterEmoji: Record<string, string>;
  affectionStages: AffectionStage[];
  initialRelations: {
    characterId: string;
    characterName: string;
    affection: number;
    stage: string;
  }[];
}

const GAME_DATA_DIR = path.join(process.cwd(), "game-data");

function readMdFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function listMdFiles(dir: string): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path.join(dir, entry.name));
      } else if (entry.isDirectory()) {
        files.push(...listMdFiles(path.join(dir, entry.name)));
      }
    }
    return files;
  } catch {
    return [];
  }
}

export function loadCoreRules(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, "01_全局游戏规则", "core-rules.md"),
  );
}

export function loadWorldSetting(): string {
  const world = readMdFile(
    path.join(GAME_DATA_DIR, "02_世界观背景库", "world-setting.md"),
  );
  const magic = readMdFile(
    path.join(GAME_DATA_DIR, "02_世界观背景库", "magic-system.md"),
  );
  return world + "\n\n" + magic;
}

export function loadProtagonist(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, "03_角色人物档案", "protagonist.md"),
  );
}

export function loadHeroines(): string {
  const heroinesDir = path.join(GAME_DATA_DIR, "03_角色人物档案", "heroines");
  return listMdFiles(heroinesDir)
    .map((f) => readMdFile(f))
    .join("\n\n---\n\n");
}

export function loadNPCs(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, "03_角色人物档案", "npcs", "index.md"),
  );
}

export function loadMainQuest(): string {
  return readMdFile(path.join(GAME_DATA_DIR, "04_剧情故事库", "main-quest.md"));
}

export function loadSideStories(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, "04_剧情故事库", "side-stories", "index.md"),
  );
}

export function loadEndings(): string {
  return readMdFile(
    path.join(GAME_DATA_DIR, "04_剧情故事库", "endings", "index.md"),
  );
}

export function loadLocations(): string {
  return readMdFile(path.join(GAME_DATA_DIR, "05_场景地图库", "locations.md"));
}

export function loadItems(): string {
  return readMdFile(path.join(GAME_DATA_DIR, "06_道具技能天赋", "items.md"));
}

export function loadSkills(): string {
  return readMdFile(path.join(GAME_DATA_DIR, "06_道具技能天赋", "skills.md"));
}

export function loadAffectionTable(): string {
  return readMdFile(path.join(GAME_DATA_DIR, "09_判定数值表", "affection.md"));
}

export function loadCombatTable(): string {
  return readMdFile(path.join(GAME_DATA_DIR, "09_判定数值表", "combat.md"));
}

export function loadAllGameData(): string {
  return [
    "===== 全局游戏规则 =====",
    loadCoreRules(),
    "===== 世界观背景 =====",
    loadWorldSetting(),
    "===== 主角设定 =====",
    loadProtagonist(),
    "===== 女主角们 =====",
    loadHeroines(),
    "===== 其他NPC =====",
    loadNPCs(),
    "===== 主线剧情 =====",
    loadMainQuest(),
    "===== 支线剧情 =====",
    loadSideStories(),
    "===== 结局分支 =====",
    loadEndings(),
    "===== 场景地图 =====",
    loadLocations(),
    "===== 道具系统 =====",
    loadItems(),
    "===== 技能系统 =====",
    loadSkills(),
    "===== 好感度判定 =====",
    loadAffectionTable(),
    "===== 战斗判定 =====",
    loadCombatTable(),
  ].join("\n\n");
}

export function loadEssentialGameData(): string {
  return [
    "===== 全局游戏规则（核心，必须遵守）=====",
    loadCoreRules(),
    "===== 主角设定 =====",
    loadProtagonist(),
    "===== 女主角们（关键人设）=====",
    loadHeroines(),
    "===== 好感度判定 =====",
    loadAffectionTable(),
    "===== 场景地图 =====",
    loadLocations(),
  ].join("\n\n");
}

export function loadStoryConfig(): StoryConfig {
  const configPath = path.join(GAME_DATA_DIR, "00_故事配置", "config.json");
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as StoryConfig;
  } catch {
    return {
      title: "未命名故事",
      subtitle: "请配置 game-data/00_故事配置/config.json",
      loadingText: "加载中……",
      emptyChatTitle: "欢迎",
      emptyChatSubtitle: "开始你的故事",
      protagonistName: "主角",
      initialState: {
        chapter: "序章",
        location: "未知之地",
        day: 1,
        time: "早晨",
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        gold: 0,
        harmony: 50,
        scene: { mood: "平静", weather: "晴朗", time: "早晨" },
      },
      initialInventory: [],
      initialMemory: { type: "event", content: "故事开始。", importance: 5 },
      initialSummary: "故事刚刚开始。",
      characterEmoji: {},
      affectionStages: [
        { max: 20, label: "陌生", actionDescriptions: [] },
        { max: 100, label: "熟悉", actionDescriptions: [] },
      ],
      initialRelations: [],
    };
  }
}
