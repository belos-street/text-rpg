import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { Database } from "bun:sqlite";

// 必须在动态 import 之前设置：storage 在模块内读取该环境变量
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "text-rpg-storage-"));
process.env.STORAGE_DATA_DIR = tmpRoot;

const LEGACY_ID = "dddddddddddddddddddd";

// 迁移夹具：在首次建库前写入旧版 JSON 文件，
// 验证 storage 首次访问时自动迁移到 SQLite（旧文件改名 .migrated）
function writeLegacyFixtures() {
  const legacySave = {
    id: LEGACY_ID,
    name: "迁移存档",
    slot: 9,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    playerName: "迁移来的玩家",
    chapter: "序章",
    location: "旧城区",
    day: 1,
    time: "黄昏",
    hp: 80,
    maxHp: 80,
    mp: 30,
    maxMp: 30,
    gold: 20,
    relations: [],
    inventory: [],
    memories: [],
    flags: {},
    summary: "",
    harmony: 50,
    scene: null,
  };
  fs.mkdirSync(path.join(tmpRoot, "saves"), { recursive: true });
  fs.mkdirSync(path.join(tmpRoot, "conversations"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpRoot, "saves", `${LEGACY_ID}.json`),
    JSON.stringify(legacySave),
  );
  fs.writeFileSync(
    path.join(tmpRoot, "conversations", `${LEGACY_ID}.json`),
    JSON.stringify([{ role: "user", content: "旧对话内容", day: 1, chapter: "序章" }]),
  );
  fs.writeFileSync(
    path.join(tmpRoot, "global.json"),
    JSON.stringify({
      unlockedEndings: ["ending_dawn_pact"],
      updatedAt: "2026-01-02T00:00:00.000Z",
    }),
  );
}
writeLegacyFixtures();

import type * as StorageModule from "./storage";
import type * as GlobalProgressModule from "./global-progress";
import type { SaveData } from "@/types";

let storage: typeof StorageModule;
let globalProgress: typeof GlobalProgressModule;

function makeMemory(content: string, importance: number) {
  return {
    id: `mem-${content}-${importance}-${Math.random().toString(36).slice(2, 6)}`,
    type: "event" as const,
    content,
    importance,
    createdAt: new Date().toISOString(),
  };
}

function makeSaveData(id: string): SaveData {
  return {
    id,
    name: `测试存档 ${id}`,
    slot: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    playerName: "测试者",
    chapter: "序章",
    location: "王都",
    day: 1,
    time: "黄昏",
    hp: 80,
    maxHp: 80,
    mp: 30,
    maxMp: 30,
    gold: 20,
    relations: [],
    inventory: [],
    memories: [],
    flags: {},
    summary: "",
    harmony: 50,
    scene: null,
  };
}

beforeAll(async () => {
  storage = await import("./storage");
  globalProgress = await import("./global-progress");
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe("旧版 JSON 自动迁移", () => {
  test("存档、会话、全局进度全部迁入 SQLite", () => {
    // 首个 storage 调用已触发建库+迁移
    const save = storage.getSave(LEGACY_ID);
    expect(save?.playerName).toBe("迁移来的玩家");
    expect(save?.slot).toBe(9);

    const conv = storage.getConversation(LEGACY_ID);
    expect(conv).toHaveLength(1);
    expect(conv[0].content).toBe("旧对话内容");

    const progress = globalProgress.getGlobalProgress();
    expect(progress.unlockedEndings).toContain("ending_dawn_pact");
  });

  test("旧文件改名 .migrated 备份（不删除）", () => {
    expect(
      fs.existsSync(path.join(tmpRoot, "saves", `${LEGACY_ID}.json.migrated`)),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(tmpRoot, "conversations", `${LEGACY_ID}.json.migrated`),
      ),
    ).toBe(true);
    expect(fs.existsSync(path.join(tmpRoot, "global.json.migrated"))).toBe(true);
    expect(fs.existsSync(path.join(tmpRoot, "game.db"))).toBe(true);
  });
});

describe("storage 基础读写", () => {
  test("createSave → getSave 往返", () => {
    const created = storage.createSave(makeSaveData("placeholder"));
    expect(created.id).toMatch(/^[a-f0-9]{20}$/);
    const loaded = storage.getSave(created.id);
    expect(loaded?.playerName).toBe("测试者");
  });

  test("listSaves 返回已创建存档", () => {
    const saves = storage.listSaves();
    expect(saves.length).toBeGreaterThanOrEqual(1);
  });

  test("损坏 JSON 的存档行被跳过（不进列表）", () => {
    // 直接向测试库插入 data 列非法的行，模拟损坏
    const db = new Database(path.join(tmpRoot, "game.db"));
    db.run(
      "INSERT OR IGNORE INTO saves (id, slot, player_name, chapter, day, updated_at, data) VALUES (?, 1, '', '', 1, '', '{broken')",
      ["bbbbbbbbbbbbbbbbbbbb"],
    );
    db.close();
    const saves = storage.listSaves();
    expect(saves.some((s) => s.id === "bbbbbbbbbbbbbbbbbbbb")).toBe(false);
  });
});

describe("路径穿越防护（No.1）", () => {
  test("getSave 拒绝穿越 id", () => {
    expect(storage.getSave("../../package")).toBeNull();
    expect(storage.getSave("short")).toBeNull();
    expect(storage.getSave("GGGGGGGGGGGGGGGGGGGG")).toBeNull();
  });

  test("deleteSave 拒绝穿越 id 且不动真实文件", () => {
    const sentinel = path.join(tmpRoot, "sentinel.json");
    fs.writeFileSync(sentinel, "{}");
    expect(storage.deleteSave("../sentinel")).toBe(false);
    expect(fs.existsSync(sentinel)).toBe(true);
    fs.unlinkSync(sentinel);
  });

  test("getConversation 拒绝穿越 id", () => {
    expect(storage.getConversation("../../package")).toEqual([]);
  });
});

describe("updateSave 记忆裁剪（MAX_MEMORIES=20）", () => {
  test("超过 20 条时按重要度保留", async () => {
    const created = storage.createSave(makeSaveData("placeholder"));
    const memories = Array.from({ length: 30 }, (_, i) =>
      makeMemory(`记忆${i}`, (i % 10) + 1),
    );
    memories[29].importance = 10; // 确保 high 的重要性最大
    memories[0].importance = 1;
    const updated = await storage.updateSave(created.id, { memories });
    expect(updated?.memories.length).toBe(20);
    // 重要性 10 的记忆必须保留
    expect(updated?.memories.some((m) => m.content === "记忆29")).toBe(true);
    // 重要性 1 的最旧记忆应被裁掉
    expect(updated?.memories.some((m) => m.content === "记忆0")).toBe(false);
  });
});

describe("会话读写", () => {
  test("appendConversation → getConversation 往返", async () => {
    const created = storage.createSave(makeSaveData("placeholder"));
    await storage.appendConversation(created.id, [
      { role: "user", content: "你好", day: 1, chapter: "序章" },
    ]);
    const conv = storage.getConversation(created.id);
    expect(conv).toHaveLength(1);
    expect(conv[0].day).toBe(1);
  });

  test("popLastTurn 移除最后一轮（C1 重新生成）", async () => {
    const created = storage.createSave(makeSaveData("placeholder"));
    await storage.appendConversation(created.id, [
      { role: "user", content: "行动" },
      { role: "assistant", content: "叙述" },
    ]);
    expect(await storage.popLastTurn(created.id)).toBe(true);
    expect(storage.getConversation(created.id)).toEqual([]);
    // 不足一轮时返回 false
    await storage.appendConversation(created.id, [
      { role: "user", content: "只有一条" },
    ]);
    expect(await storage.popLastTurn(created.id)).toBe(false);
  });

  test("deleteSave 联动删除会话", async () => {
    const created = storage.createSave(makeSaveData("placeholder"));
    await storage.appendConversation(created.id, [{ role: "user", content: "x" }]);
    expect(storage.deleteSave(created.id)).toBe(true);
    expect(storage.getConversation(created.id)).toEqual([]);
    expect(storage.getSave(created.id)).toBeNull();
  });
});

describe("summarizeConversation（#34）", () => {
  test("assistant 的原始 JSON 不污染摘要", () => {
    const rawJson = JSON.stringify({
      type: "game_update",
      narration: "我在旧城区醒来，遇到了莉娅。",
      choices: [{ id: "A", text: "起身" }],
    });
    const summary = storage.summarizeConversation(
      [
        { role: "user", content: "睁开眼睛" },
        { role: "assistant", content: rawJson },
      ],
      "",
    );
    expect(summary).toContain("我在旧城区醒来");
    expect(summary).not.toContain('"type"');
    expect(summary).not.toContain("game_update");
  });

  test("长叙述被截断到 120 字符", () => {
    const long = "长".repeat(300);
    const summary = storage.summarizeConversation(
      [{ role: "assistant", content: long }],
      "",
    );
    expect(summary.length).toBeLessThanOrEqual("旁白: ".length + 123);
  });
});
