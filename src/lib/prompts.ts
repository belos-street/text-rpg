import {
  chapterKeyOf,
  loadEssentialGameData,
  loadMainQuestForChapter,
  loadStoryConfig,
} from "./game-data";
import { extractNarration } from "./parser";
import type { SaveData } from "@/types";

export function loadGameContext(save: SaveData): string {
  const recentMemories = [...save.memories]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 15)
    .map(
      (m) =>
        `[${m.type === "event" ? "事件" : m.type === "decision" ? "抉择" : m.type === "item" ? "道具" : "关系"}][重要度${m.importance}] ${m.content}`,
    )
    .join("\n");

  const relations = save.relations
    .map(
      (r) =>
        `- ${r.characterName}（ID: ${r.characterId}）：好感度 ${r.affection}（${r.stage}）`,
    )
    .join("\n");

  const inventory = save.inventory
    .map((i) => `${i.itemName} x${i.quantity}`)
    .join(", ");

  const config = loadStoryConfig();
  const chapters = config.chapters ?? [];
  const activeFlags = Object.entries(save.flags ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k);

  return [
    `【当前存档摘要】${save.summary}`,
    "",
    `【玩家状态】玩家:${save.playerName} HP:${save.hp}/${save.maxHp} MP:${save.mp}/${save.maxMp} 金币:${save.gold}`,
    `【当前位置】${save.location} | 第${save.day}天 | ${save.time}`,
    `【当前章节】${save.chapter}`,
    ...(save.scene
      ? [`【场景氛围】${save.scene.mood} · ${save.scene.weather} · ${save.scene.time}`]
      : []),
    ...(chapters.length > 0
      ? [`【章节列表】${chapters.join("、")}（stateChanges.chapter 只能从列表中选择）`]
      : []),
    ...(activeFlags.length > 0
      ? [`【剧情标记】${activeFlags.join("、")}`]
      : []),
    "",
    `【好感度】${save.harmony}/100`,
    "",
    "【角色关系】",
    relations,
    "",
    `【背包】${inventory || "空"}`,
    "",
    "【近期记忆】",
    recentMemories || "暂无重要记忆",
  ].join("\n");
}

// 静态系统提示词：不含任何易变的存档状态，保证跨回合字节稳定，
// 让 LM Studio 的前缀 KV cache 能命中（易变状态见 buildMessages 末尾的状态块）
function buildSystemPrompt(chapterKey: string | null): string {
  const config = loadStoryConfig();
  // M1/M2：女主档案按当前章节筛选，主线大纲只注入当前章节概要
  const gameRules = [
    loadEssentialGameData(chapterKey),
    "===== 主线剧情（总纲 + 当前章节概要 + 推进原则）=====",
    loadMainQuestForChapter(chapterKey),
  ].join("\n\n");

  const characterEmojiLines = Object.entries(config.characterEmoji)
    .map(([name, emoji]) => `- ${name} → ${emoji}`)
    .join("\n");

  const flagsLines = Object.entries(config.flags ?? {})
    .map(([id, desc]) => `- ${id}：${desc}`)
    .join("\n");

  return `你是「${config.title}」的文字冒险游戏AI主持人（GM）。你的任务是驱动剧情、扮演所有角色、描述场景，并根据玩家的选择推进故事。

${gameRules}

## 叙事视角
1. 主角是第一人称视角，旁白以「我」来叙述主角的所见所感。例如：「我睁开眼睛」「我心里暗想」「我感觉到」。
2. 不要用「他/${config.protagonistName}」来指代主角，主角就是「我」。
3. 描述其他角色时用正常第三人称。

## 角色对话格式
每个角色的对话必须用以下格式，以便前端正确渲染 emoji：

【角色名】「对话内容」

例如（角色名和对话内容应根据实际角色档案生成）：
【角色A】「角色A的对话内容」
【角色B】「角色B的对话内容」

如果没有明确角色归属的旁白性对话，直接用「对话内容」即可。

## 角色与 emoji 对应关系
${characterEmojiLines || "- 无预设角色"}

## 可用剧情标记（flagsChanges）
${flagsLines || "-（本故事未定义）"}
当某项剧情节点达成时，在 flagsChanges 中把对应标记设为 true。只设置本次发生变化的标记。

## 输出格式
你的每次回复必须严格按照以下JSON格式输出，**不要使用markdown代码块包裹，直接输出纯JSON**：

{
  "type": "game_update",
  "narration": "场景描述、人物对话、剧情推进等文本内容。用流畅的中文叙述，包含环境描写、角色动作和表情。",
  "choices": [
    { "id": "A", "text": "选项A的文字" },
    { "id": "B", "text": "选项B的文字" },
    { "id": "C", "text": "选项C的文字" },
    { "id": "D", "text": "选项D的文字" }
  ],
  "stateChanges": {
    "hp": 新的HP数值（绝对值，如85表示HP变为85，不是增减量）,
    "mp": 新的MP数值（绝对值）,
    "gold": 新的金币数值（绝对值）,
    "location": "新位置（如有变化）",
    "day": 新的天数（绝对值）,
    "time": "时间变化"
  },
  "affectionChanges": {
    "角色ID": 好感度变化值（正负整数，-5到5。key 必须使用【角色关系】中括号内的 ID，如 "lia"，禁止使用角色名）
  },
  "affectionReason": "一句话说明本次好感度变化的原因（无变化时省略此字段）",
  "flagsChanges": {
    "标记ID": true（key 使用【可用剧情标记】中的 ID，只设置本次发生变化的标记，无则省略整个字段）
  },
  "harmonyChange": 后宫和睦度变化值（-5到5之间的整数）,
  "newMemory": {
    "type": "event|decision|item|relationship",
    "content": "重要记忆的简短描述",
    "importance": 1-10的整数
  },
  "newItems": [
    { "id": "道具ID", "name": "道具名称" }
  ],
  "scene": {
    "mood": "场景氛围",
    "weather": "天气",
    "time": "时间"
  },
  "ending": "当且仅当剧情抵达结局时，填写结局 ID（参照故事库 endings/index.md），非结局回合省略此字段"
}

记住：只输出纯JSON，不要markdown代码块，不要其他任何文字。

## 重要规则
1. 每次回复必须包含精彩的叙事描写，推动剧情发展。
2. 提供2-4个有意义的选项，选项要体现不同风格（主动/谨慎/浪漫/直率等）。
3. 对于玩家自由输入（不选选项的情况），也要能灵活应对。
4. 好感度变化要有合理依据，重要互动才会导致变化。
5. 后宫和睦度（harmony）反映女主群体间的融洽程度：低于 40 时更容易触发摩擦与吃醋事件，高于 70 时群体互动更融洽。请在叙事中体现其影响。
6. 当剧情涉及亲密场景时，保持全年龄向的含蓄与美感（本作无R-18内容）。
7. 角色之间的互动要考虑她们的性格和当前关系阶段。
8. 当玩家与某角色好感度达到阶段阈值时，触发对应的突破事件。

最新一封玩家消息会附带【当前游戏状态】块，请以其为准做出反应。章节推进必须遵守其中的【章节列表】。
`;
}

export function buildMessages(
  save: SaveData | null,
  userInput: string,
  dialogueHistory: { role: string; content: string }[],
): { role: "system" | "user" | "assistant"; content: string }[] {
  const isFirstMessage = !save || dialogueHistory.length === 0;
  const chapterKey = chapterKeyOf(save?.chapter);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: buildSystemPrompt(chapterKey) }];

  if (save && dialogueHistory.length > 0) {
    // 只保留最近 10 条；assistant 历史压缩为纯叙述（原文仍在 conversations 文件里）
    const recentHistory = dialogueHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content:
            msg.role === "assistant"
              ? extractNarration(msg.content)
              : msg.content,
        });
      }
    }
  }

  // 易变状态放在消息序列末尾（而非 system 尾部）：
  // 静态前缀 + 历史保持字节稳定，可被前缀缓存命中，每回合只需 prefill 新增部分
  const stateBlock = save
    ? `【当前游戏状态】\n${loadGameContext(save)}\n\n`
    : "";

  if (userInput) {
    messages.push({
      role: "user",
      content: `${stateBlock}【玩家行动】\n${userInput}`,
    });
  } else if (isFirstMessage) {
    messages.push({
      role: "user",
      content: `${stateBlock}请开始游戏序章，描述主角醒来时的场景。`,
    });
  } else {
    messages.push({
      role: "user",
      content: `${stateBlock}请继续推进剧情。`,
    });
  }

  return messages;
}
