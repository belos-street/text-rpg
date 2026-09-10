import { describe, test, expect } from "bun:test";
import { parseGameUpdate, extractNarration, extractChoices, narrationPreview } from "./parser";

const validUpdate = {
  type: "game_update",
  narration: "我睁开眼睛，夕阳的余晖洒在旧城区的石板路上。",
  choices: [
    { id: "A", text: "起身环顾四周" },
    { id: "B", text: "检查口袋里的东西" },
  ],
  stateChanges: { hp: "85", gold: 20, location: "王都·旧城区" },
  affectionChanges: { lia: 2, "不是ID的名字": -1 },
  harmonyChange: 1,
  newMemory: { type: "event", content: "在旧城区醒来", importance: 8 },
  newItems: [{ id: "I003", name: "无名吊坠" }],
  scene: { mood: "平静微澜", weather: "晴", time: "黄昏" },
};

describe("parseGameUpdate", () => {
  test("解析纯 JSON", () => {
    const parsed = parseGameUpdate(JSON.stringify(validUpdate));
    expect(parsed).not.toBeNull();
    expect(parsed?.narration).toContain("我睁开眼睛");
    expect(parsed?.choices).toHaveLength(2);
    expect(parsed?.stateChanges?.hp).toBe(85);
    expect(parsed?.stateChanges?.hp).toBeTypeOf("number");
  });

  test("解析 ```json 代码围栏包裹的 JSON", () => {
    const parsed = parseGameUpdate("```json\n" + JSON.stringify(validUpdate) + "\n```");
    expect(parsed?.narration).toContain("我睁开眼睛");
  });

  test("JSON 前后有杂文时仍可解析（取平衡括号对象）", () => {
    const parsed = parseGameUpdate("好的，冒险开始！\n" + JSON.stringify(validUpdate) + "\n祝玩得开心！");
    expect(parsed?.narration).toContain("我睁开眼睛");
  });

  test("叙述文本内含花括号不破坏解析", () => {
    const withBraces = {
      ...validUpdate,
      narration: "墙上刻着 {怪异} 的符号，形状像 }{ 。",
    };
    const parsed = parseGameUpdate(JSON.stringify(withBraces));
    expect(parsed?.narration).toContain("{怪异}");
  });

  test("数值型字符串被强转为 number", () => {
    const parsed = parseGameUpdate(JSON.stringify(validUpdate));
    expect(parsed?.stateChanges?.hp).toBe(85);
    expect(parsed?.harmonyChange).toBe(1);
  });

  test("非法数值字段被剔除而非污染（hp: 'high' → undefined）", () => {
    const bad = { ...validUpdate, stateChanges: { hp: "high", mp: 30 } };
    const parsed = parseGameUpdate(JSON.stringify(bad));
    expect(parsed?.stateChanges?.hp).toBeUndefined();
    expect(parsed?.stateChanges?.mp).toBe(30);
  });

  test("非法 newMemory.type 降级为 event", () => {
    const bad = { ...validUpdate, newMemory: { type: "whatever", content: "x", importance: 99 } };
    const parsed = parseGameUpdate(JSON.stringify(bad));
    expect(parsed?.newMemory?.type).toBe("event");
    expect(parsed?.newMemory?.importance).toBe(5);
  });

  test("不完整 JSON 返回 null（流式中）", () => {
    const partial = '{"type": "game_update", "narration": "写到一半';
    expect(parseGameUpdate(partial)).toBeNull();
  });

  test("完全无 JSON 返回 null", () => {
    expect(parseGameUpdate("这是一段没有格式化输出的文字。")).toBeNull();
  });

  test("与 game_update 无关的 JSON 返回 null", () => {
    expect(parseGameUpdate('{"foo": "bar"}')).toBeNull();
  });

  test("JSON 后跟第二个对象时取第一个合法对象", () => {
    const parsed = parseGameUpdate(JSON.stringify(validUpdate) + "\n{\"other\": 1}");
    expect(parsed?.narration).toContain("我睁开眼睛");
  });
});

describe("extractNarration", () => {
  test("完整 JSON 返回 narration", () => {
    expect(extractNarration(JSON.stringify(validUpdate))).toContain("我睁开眼睛");
  });

  test("流式半截 JSON 提取已生成的部分叙述", () => {
    const partial = '{"type": "game_update", "narration": "我睁开眼睛，看到一位银发的少女';
    expect(extractNarration(partial)).toBe("我睁开眼睛，看到一位银发的少女");
  });

  test("流式半截 JSON 处理转义换行", () => {
    const partial = '{"type": "game_update", "narration": "第一行。\\n第二行还在写';
    expect(extractNarration(partial)).toBe("第一行。\n第二行还在写");
  });

  test("纯文本直接返回原文", () => {
    const text = "这是一段纯文本叙述。";
    expect(extractNarration(text)).toBe(text);
  });

  test("围栏 JSON 解析成功时取 narration 而非删除围栏", () => {
    const fenced = "```json\n" + JSON.stringify(validUpdate) + "\n```";
    expect(extractNarration(fenced)).toContain("我睁开眼睛");
  });
});

describe("extractChoices", () => {
  test("返回 choices 数组", () => {
    const choices = extractChoices(JSON.stringify(validUpdate));
    expect(choices).toHaveLength(2);
    expect(choices[0].id).toBe("A");
  });

  test("无 choices 时返回空数组", () => {
    expect(extractChoices("没有格式化输出")).toEqual([]);
  });
});

describe("narrationPreview", () => {
  test("无 narration 键时回退为清洗文本", () => {
    expect(narrationPreview("普通文本输出")).toBe("普通文本输出");
  });

  test("未完成的 JSON 且 narration 键未出现时返回空串（不泄漏原始 JSON）", () => {
    expect(narrationPreview('{\n  "type": "game_u')).toBe("");
  });
});
