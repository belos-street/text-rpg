# AI 文字冒险游戏引擎

一套通用的 AI 文字冒险游戏框架，支持任意故事框架替换。

## 快速开始

```bash
# 安装依赖
bun install

# 配置 AI API（详见 .env 文件）
# 开发启动
bun run dev
```

## 项目架构

```
src/
├── app/                    # Next.js 路由
│   ├── api/
│   │   ├── chat/          # AI 对话接口
│   │   ├── config/        # 故事配置接口（客户端用）
│   │   └── saves/         # 存档 CRUD
│   └── page.tsx           # 主游戏页面
├── components/
│   └── game/
│       ├── ChatPanel.tsx      # 聊天面板
│       ├── ChoicePanel.tsx    # 选项按钮
│       ├── InputPanel.tsx     # 输入框
│       ├── NarrativeText.tsx  # 文字渲染（不同颜色/样式）
│       ├── Sidebar.tsx        # 侧边栏（关系/背包/记忆）
│       └── StatusBar.tsx      # 状态栏（HP/MP/金币）
├── lib/
│   ├── affection.ts       # 好感度工具函数
│   ├── ai.ts              # AI 客户端配置
│   ├── game-data.ts       # 读取 game-data/ 目录的数据
│   ├── prompts.ts         # AI 系统提示词构建
│   ├── storage.ts         # 存档文件读写
│   └── utils.ts           # 通用工具函数
└── types/
    └── index.ts           # 类型定义
```

## 替换故事框架

核心原则：**所有故事相关数据都在 `game-data/` 目录中，替换故事框架只需改这个目录 + 一个配置文件，不动代码。**

### 操作步骤

#### 1. 修改故事配置文件

编辑 `game-data/00_故事配置/config.json`：

```json
{
  "title": "你的游戏标题",
  "subtitle": "副标题说明",
  "loadingText": "加载时的动画文字",
  "emptyChatTitle": "空聊天框显示的大标题",
  "emptyChatSubtitle": "空聊天框显示的小标题",
  "protagonistName": "主角名字",
  "initialState": {
    "chapter": "第一章：xxx",
    "location": "初始位置",
    "day": 1,
    "time": "早晨",
    "hp": 100,
    "maxHp": 100,
    "mp": 50,
    "maxMp": 50,
    "gold": 50,
    "harmony": 50,
    "scene": { "mood": "氛围", "weather": "天气", "time": "时间" }
  },
  "initialInventory": [
    { "itemId": "ID", "itemName": "道具名", "quantity": 1 }
  ],
  "initialMemory": {
    "type": "event",
    "content": "初始记忆描述",
    "importance": 8
  },
  "initialSummary": "存档摘要",
  "characterEmoji": {
    "角色名": "对应emoji"
  },
  "affectionStages": [
    { "max": 20,  "label": "阶段名", "actionDescriptions": ["描述1", "描述2"] },
    { "max": 40,  "label": "阶段名", "actionDescriptions": ["描述1", "描述2"] },
    { "max": 60,  "label": "阶段名", "actionDescriptions": ["描述1", "描述2"] },
    { "max": 80,  "label": "阶段名", "actionDescriptions": ["描述1", "描述2"] },
    { "max": 95,  "label": "阶段名", "actionDescriptions": ["描述1", "描述2"] },
    { "max": 100, "label": "阶段名", "actionDescriptions": ["描述1", "描述2"] }
  ],
  "initialRelations": [
    { "characterId": "ID", "characterName": "角色名", "affection": 0, "stage": "stranger" }
  ]
}
```

#### 2. 替换 game-data/ 目录下的所有 Markdown 文件

以下是目录结构和各文件说明：

```
game-data/
├── 00_故事配置/
│   └── config.json              ← 步骤1中改的配置文件
├── 01_全局游戏规则/
│   └── core-rules.md            ← AI 必须遵守的规则（如世界观限制、R18规则等）
├── 02_世界观背景库/
│   ├── world-setting.md         ← 世界设定（时代、地理、文明等）
│   └── magic-system.md          ← 魔法/特殊能力体系
├── 03_角色人物档案/
│   ├── protagonist.md           ← 主角设定
│   ├── heroines/                ← 主要角色（每个角色一个 .md 文件）
│   └── npcs/
│       └── index.md             ← 其他 NPC 设定
├── 04_剧情故事库/
│   ├── main-quest.md            ← 主线剧情
│   ├── side-stories/
│   │   └── index.md             ← 支线剧情
│   └── endings/
│       └── index.md             ← 结局分支
├── 05_场景地图库/
│   └── locations.md             ← 场景地图
├── 06_道具技能天赋/
│   ├── items.md                 ← 道具系统
│   └── skills.md                ← 技能系统
└── 09_判定数值表/
    ├── affection.md             ← 好感度判定
    └── combat.md                ← 战斗判定
```

每个文件可以用自定义格式编写（不限于 Markdown），因为内容只作为上下文直接喂给 AI，没有做结构化解析。

#### 3. 验证

```bash
bun run build    # 确认构建无错误
bun run lint     # 确认 lint 无错误
bun run dev      # 启动确认新故事正常显示
```

### 不需要修改的代码

以下文件**完全通用**，任何故事框架都无需改动：

- `src/lib/ai.ts` — AI 客户端配置
- `src/lib/storage.ts` — 存档读写（初始数据从 config 动态读取）
- `src/lib/affection.ts` — 好感度阶段标签（阶段数据从配置注入）
- `src/lib/game-data.ts` — 文件读取工具
- `src/components/game/NarrativeText.tsx` — 文字样式渲染（emoji 映射从 props 传入）
- `src/components/game/ChatPanel.tsx` — 聊天面板（文案从 props 传入）
- `src/components/game/ChoicePanel.tsx` — 选项按钮
- `src/components/game/InputPanel.tsx` — 输入框
- `src/components/game/Sidebar.tsx` — 侧边栏（好感动阶段从 props 传入）
- `src/components/game/StatusBar.tsx` — 状态栏
- `src/app/page.tsx` — 游戏主页面（标题/文案从配置 API 动态获取）
- `src/lib/prompts.ts` — AI 提示词构建（游戏名/角色名从 config 动态读取）

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `AI_BASE_URL` | AI 接口地址（必填） | `https://api.deepseek.com/v1` |
| `AI_API_KEY` | API 密钥 | `sk-xxx` |
| `AI_MODEL` | 模型名（可选） | `deepseek-chat` |
