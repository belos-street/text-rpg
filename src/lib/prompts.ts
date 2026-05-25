import { loadEssentialGameData, loadStoryConfig } from "./game-data";
import type { SaveData } from "@/types";
import { loadGameContext } from "./storage";

function buildSystemPrompt(save: SaveData | null): string {
  const gameRules = loadEssentialGameData();
  const config = loadStoryConfig();

  const characterEmojiLines = Object.entries(config.characterEmoji)
    .map(([name, emoji]) => `- ${name} → ${emoji}`)
    .join("\n");

  const basePrompt = `你是「${config.title}」的文字冒险游戏AI主持人（GM）。你的任务是驱动剧情、扮演所有角色、描述场景，并根据玩家的选择推进故事。

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
    "角色ID": 好感度变化值（正负整数）
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
  }
}

记住：只输出纯JSON，不要markdown代码块，不要其他任何文字。

## 重要规则
1. 每次回复必须包含精彩的叙事描写，推动剧情发展。
2. 提供2-4个有意义的选项，选项要体现不同风格（主动/谨慎/浪漫/直率等）。
3. 对于玩家自由输入（不选选项的情况），也要能灵活应对。
4. 好感度变化要有合理依据，重要互动才会导致变化。
5. 后宫和睦度影响群体互动时的氛围。
6. 当剧情涉及亲密场景时，按照core-rules.md中的R-18规则执行。
7. 角色之间的互动要考虑她们的性格和当前关系阶段。
8. 当玩家与某角色好感度达到阶段阈值时，触发对应的突破事件。

`;

  if (save) {
    return basePrompt + `\n\n## 当前游戏状态\n${loadGameContext(save)}`;
  }

  return basePrompt;
}

export function buildMessages(
  save: SaveData | null,
  userInput: string,
  dialogueHistory: { role: string; content: string }[],
): { role: "system" | "user" | "assistant"; content: string }[] {
  const isFirstMessage = !save || save.dialogueHistory.length === 0;

  const systemPrompt = buildSystemPrompt(save);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: systemPrompt }];

  if (save && dialogueHistory.length > 0) {
    const recentHistory = dialogueHistory.slice(-20);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }
  }

  if (userInput) {
    messages.push({ role: "user", content: userInput });
  }

  if (!userInput && isFirstMessage) {
    messages.push({
      role: "user",
      content: "请开始游戏序章，描述主角醒来时的场景。",
    });
  }

  return messages;
}
