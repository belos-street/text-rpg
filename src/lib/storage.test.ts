import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";

// 必须在动态 import 之前设置：storage 在模块内读取该环境变量
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "text-rpg-storage-"));
process.env.STORAGE_DATA_DIR = tmpRoot;

import type * as StorageModule from "./storage";
import type { SaveData } from "@/types";

let storage: typeof StorageModule;

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
    dialogueHistory: [],
    summary: "",
    harmony: 50,
    scene: null,
  };
}

beforeAll(async () => {
  storage = await import("./storage");
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
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

  test("损坏 JSON 的存档被跳过（不进列表）", () => {
    const savesDir = path.join(tmpRoot, "saves");
    fs.writeFileSync(path.join(savesDir, "bbbbbbbbbbbbbbbbbbbb.json"), "{broken");
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

describe("会话文件", () => {
  test("appendConversation → getConversation 往返", async () => {
    const created = storage.createSave(makeSaveData("placeholder"));
    await storage.appendConversation(created.id, [
      { role: "user", content: "你好", day: 1, chapter: "序章" },
    ]);
    const conv = storage.getConversation(created.id);
    expect(conv).toHaveLength(1);
    expect(conv[0].day).toBe(1);
  });

  test("损坏的会话文件被备份而非覆写（#27）", async () => {
    const created = storage.createSave(makeSaveData("placeholder"));
    const convPath = path.join(tmpRoot, "conversations", `${created.id}.json`);
    fs.writeFileSync(convPath, '{"broken json');
    const conv = storage.getConversation(created.id);
    expect(conv).toEqual([]);
    const files = fs.readdirSync(path.join(tmpRoot, "conversations"));
    expect(files.some((f) => f.startsWith(`${created.id}.json.corrupt-`))).toBe(true);
  });

  test("deleteSave 联动删除会话文件", async () => {
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
