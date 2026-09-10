import { describe, test, expect } from "bun:test";
import { buildMessages, loadGameContext } from "./prompts";
import type { SaveData, Message } from "@/types";

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return {
    id: "aaaaaaaaaaaaaaaaaaaa",
    name: "测试者 - 第1天",
    slot: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    playerName: "辰",
    chapter: "序章：坠入异界",
    location: "王都·旧城区",
    day: 1,
    time: "黄昏",
    hp: 80,
    maxHp: 80,
    mp: 30,
    maxMp: 30,
    gold: 20,
    relations: [
      {
        characterId: "lia",
        characterName: "莉娅",
        affection: 10,
        stage: "stranger",
        events: [],
      },
    ],
    inventory: [],
    memories: [
      {
        id: "m1",
        type: "event",
        content: "在旧城区醒来",
        importance: 8,
        createdAt: new Date().toISOString(),
        day: 1,
        chapter: "序章：坠入异界",
      },
    ],
    dialogueHistory: [],
    summary: "测试摘要",
    harmony: 50,
    scene: { mood: "平静", weather: "晴", time: "黄昏" },
    ...overrides,
  };
}

describe("buildMessages", () => {
  test("首次开局：system + 开场引导 user 消息", () => {
    const messages = buildMessages(makeSave(), "", []);
    expect(messages[0].role).toBe("system");
    expect(messages[messages.length - 1].role).toBe("user");
    expect(messages[messages.length - 1].content).toContain("请开始游戏序章");
  });

  test("系统提示词含规则与 ID 约束，关系 ID 在状态块中（No.3）", () => {
    const messages = buildMessages(makeSave(), "", []);
    const system = messages[0].content;
    expect(system).toContain("AI主持人");
    // 系统提示词要求 key 必须用 ID；具体 ID 列表在末尾状态块中（S2）
    expect(system).toContain("禁止使用角色名");
    const last = messages[messages.length - 1].content;
    expect(last).toContain("（ID: lia）");
  });

  test("S1：assistant 历史压缩为纯叙述，不含原始 JSON", () => {
    const rawAssistant = JSON.stringify({
      type: "game_update",
      narration: "我睁开眼睛。",
      choices: [{ id: "A", text: "起身" }],
    });
    const history: Message[] = [
      { role: "user", content: "睁开眼睛" },
      { role: "assistant", content: rawAssistant },
    ];
    const messages = buildMessages(makeSave(), "起身", history);
    const assistantMsg = messages.find((m) => m.role === "assistant");
    expect(assistantMsg?.content).toBe("我睁开眼睛。");
  });

  test("S2：易变状态在消息序列末尾的 user 消息中", () => {
    const messages = buildMessages(makeSave(), "观察四周", []);
    const last = messages[messages.length - 1];
    expect(last.role).toBe("user");
    expect(last.content).toContain("【当前游戏状态】");
    expect(last.content).toContain("【玩家行动】");
    expect(last.content).toContain("观察四周");
  });

  test("B1：状态块包含玩家名字", () => {
    const messages = buildMessages(makeSave(), "你好", []);
    const last = messages[messages.length - 1].content;
    expect(last).toContain("玩家:辰");
  });

  test("S3：历史窗口截断到 10 条", () => {
    const history: Message[] = [];
    for (let i = 0; i < 30; i++) {
      history.push({ role: "user", content: `行动${i}` });
      history.push({ role: "assistant", content: `旁白${i}` });
    }
    const messages = buildMessages(makeSave(), "继续", history);
    // 1 system + 10 history + 1 user
    expect(messages.length).toBe(12);
  });

  test("无存档时也不崩溃，状态块为空", () => {
    const messages = buildMessages(null, "开始", []);
    expect(messages[0].role).toBe("system");
    const last = messages[messages.length - 1];
    expect(last.content).not.toContain("【当前游戏状态】");
  });
});

describe("loadGameContext", () => {
  test("包含关系 ID、背包与记忆", () => {
    const ctx = loadGameContext(makeSave());
    expect(ctx).toContain("（ID: lia）");
    expect(ctx).toContain("【当前存档摘要】测试摘要");
    expect(ctx).toContain("在旧城区醒来");
  });

  test("空背包显示占位文案", () => {
    const ctx = loadGameContext(makeSave({ inventory: [] }));
    expect(ctx).toContain("【背包】空");
  });

  test("不修改入参（memories 原顺序不变，No.16）", () => {
    const save = makeSave();
    const before = [...save.memories];
    loadGameContext(save);
    expect(save.memories).toEqual(before);
  });
});
