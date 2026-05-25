# 文字冒险游戏引擎 - 设计文档

## 一、项目概述

- **游戏类型**：AI 驱动的文字冒险 + 视觉小说风格
- **核心玩法**：玩家扮演主角，通过选择与不同角色互动，发展关系，推进剧情
- **技术栈**：Next.js 16 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui
- **AI 接口**：OpenAI SDK（兼容 DeepSeek / Mimo 等支持 OpenAI 范式的模型）

---

## 二、目录结构

```
text-rpg-pro/
├── .env
├── .env.example
├── package.json
├── bun.lockb
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma
│
├── public/
│   └── avatars/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # 主界面
│   │   ├── globals.css
│   │   ├── saves/
│   │   │   └── page.tsx              # 存档管理页
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts          # 流式对话 API
│   │       └── saves/
│   │           └── route.ts          # 存档 CRUD API
│   │
│   ├── components/
│   │   ├── ChatPanel.tsx             # 对话面板
│   │   ├── StatusBar.tsx             # 状态栏 (HP / MP / 金币 / 位置)
│   │   ├── ChoiceButtons.tsx         # 选项按钮组
│   │   ├── SaveSlot.tsx              # 存档槽位组件
│   │   ├── CharacterCard.tsx         # 角色信息卡片
│   │   ├── SideBar.tsx               # 侧边栏 (关系 / 背包 / 存档)
│   │   └── SidebarRelationItem.tsx   # 侧边栏关系条目
│   │
│   ├── lib/
│   │   ├── ai.ts                     # OpenAI SDK 调用封装
│   │   ├── db.ts                     # Prisma 客户端实例
│   │   ├── prompts.ts                # Prompt 构建器
│   │   └── tokenizer.ts              # Token 估算与上下文裁剪
│   │
│   └── types/
│       └── index.ts                  # 全局类型定义
│
└── game-data/
    ├── 00_故事配置/
    │   └── config.json              # 故事配置（标题、初始状态、角色列表等）
    ├── 01_全局游戏规则/
    │   └── core-rules.md
    ├── 02_世界观背景库/
    │   ├── world-setting.md
    │   └── magic-system.md
    ├── 03_角色人物档案/
    │   ├── protagonist.md
    │   ├── heroines/                # 主要角色（每个角色一个 .md 文件）
    │   └── npcs/
    │       └── index.md
    ├── 04_剧情故事库/
    │   ├── main-quest.md
    │   ├── side-stories/
    │   └── endings/
    ├── 05_场景地图库/
    │   └── locations.md
    ├── 06_道具技能天赋/
    │   ├── items.md
    │   └── skills.md
    └── 09_判定数值表/
        ├── affection.md
        └── combat.md
```

---

## 三、数据模型 (Prisma Schema)

### 3.1 Save（存档）

```prisma
model Save {
  id         Int      @id @default(autoincrement())
  name       String
  slot       Int      @unique          // 槽位编号 1-10
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  playerName String                     // 玩家自定义名字
  chapter    String   @default("序章")  // 当前章节
  location   String   @default("起始村庄")
  day        Int      @default(1)       // 游戏内天数

  hp         Int      @default(100)
  maxHp      Int      @default(100)
  mp         Int      @default(50)
  maxMp      Int      @default(50)
  gold       Int      @default(100)

  memories   Memory[]
  dialogues  Dialogue[]
  relations  Relation[]
  inventory  InventoryItem[]
}
```

### 3.2 Memory（核心记忆）

```prisma
model Memory {
  id         Int      @id @default(autoincrement())
  saveId     Int
  save       Save     @relation(fields: [saveId], references: [id], onDelete: Cascade)
  type       String   // "event" | "decision" | "item" | "relationship" | "combat"
  content    String
  importance Int      @default(5)       // 1-10，越高越优先加载
  createdAt  DateTime @default(now())
}
```

### 3.3 Dialogue（对话日志）

```prisma
model Dialogue {
  id        Int      @id @default(autoincrement())
  saveId    Int
  save      Save     @relation(fields: [saveId], references: [id], onDelete: Cascade)
  role      String   // "user" | "assistant" | "system" | "narration"
  content   String
  metadata  String?  // JSON：选择的选项、场景、涉及角色等
  createdAt DateTime @default(now())
}
```

### 3.4 Relation（角色关系）

```prisma
model Relation {
  id          Int    @id @default(autoincrement())
  saveId      Int
  save        Save   @relation(fields: [saveId], references: [id], onDelete: Cascade)
  characterId String // 角色 ID，对应 heroines/ 下的文件名
  affection   Int    @default(0)            // 好感度 0-100
  stage       String @default("stranger")   // 关系阶段
  flags       String @default("{}")         // JSON：已触发的特殊事件标记
}
```

### 3.5 InventoryItem（背包物品）

```prisma
model InventoryItem {
  id       Int    @id @default(autoincrement())
  saveId   Int
  save     Save   @relation(fields: [saveId], references: [id], onDelete: Cascade)
  itemId   String
  quantity Int    @default(1)
}
```

---

## 四、核心系统设计

### 4.1 AI 对话系统

#### Prompt 结构（每次请求动态拼接）

```
┌─────────────────────────────────────────┐
│ [System] 01_全局游戏规则                  │  ~1500 tokens（常驻）
├─────────────────────────────────────────┤
│ [System] 02_世界观背景库                  │  ~800 tokens（首次 / 切换区域时加载）
├─────────────────────────────────────────┤
│ [System] 当前场景描述 (05_场景地图库)      │  ~500 tokens
├─────────────────────────────────────────┤
│ [System] 涉及角色档案 (03_角色人物档案)    │  ~600 tokens
├─────────────────────────────────────────┤
│ [System] 玩家状态快照                     │  ~200 tokens
│   HP/MP/金币/位置/好感度/背包摘要         │
├─────────────────────────────────────────┤
│ [System] 核心记忆摘要 (07_核心记忆存档)    │  ~800 tokens
│   按 importance 排序，取最近 N 条         │
├─────────────────────────────────────────┤
│ [History] 最近 M 轮对话                   │  ~2000 tokens
├─────────────────────────────────────────┤
│ [User] 当前玩家输入                       │
└─────────────────────────────────────────┘
```

#### Token 预算

| 模块 | 预算 | 说明 |
|------|------|------|
| 系统指令 + 规则 | ~1500 | 每次必带 |
| 世界/场景/角色 | ~1900 | 按需裁剪 |
| 玩家状态 | ~200 | 精简快照 |
| 核心记忆 | ~800 | 优先级排序 |
| 对话历史 | ~2000 | 滑动窗口 |
| 预留输出 | ~1500 | AI 回复 |
| **总计** | **~7900** | 控制在 8K 以内 |

### 4.2 好感度系统

| 阶段 | 好感度 | 解锁内容 |
|------|--------|----------|
| 陌生人 (stranger) | 0-20 | 基础对话，公事公办 |
| 认识 (acquaintance) | 21-40 | 可聊个人话题 |
| 朋友 (friend) | 41-60 | 解锁专属支线 |
| 暧昧 (crush) | 61-80 | 亲密互动场景 |
| 恋人 (lover) | 81-100 | 专属结局路线 |

#### 好感度变动规则

| 行为 | 影响 |
|------|------|
| 送喜欢的礼物 | +3 ~ +8 |
| 闲聊 / 日常对话 | +1 ~ +2 |
| 帮助完成任务 | +5 ~ +10 |
| 说错话 / 做错事 | -2 ~ -5 |
| 无视 / 冷落 | -1 ~ -3 |
| 关键剧情正确选择 | +10 ~ +15 |

### 4.3 存档系统

- 支持 **10 个手动存档槽位** + 1 个自动存档槽位
- 存档包含：玩家状态 + 所有记忆 + 关系数据 + 背包 + 最近 50 轮对话
- 读档时完整恢复所有上下文

### 4.4 AI 输出格式约定

AI 回复中需包含结构化 JSON 块，用于前端解析状态变更：

```json
{
  "type": "game_update",
  "narration": "叙述文本...",
  "choices": [
    { "id": "A", "text": "选项A描述" },
    { "id": "B", "text": "选项B描述" }
  ],
  "stateChanges": {
    "hp": 0,
    "mp": -10,
    "gold": 0,
    "location": "当前场景",
    "day": 0
  },
  "affectionChanges": {
    "character_id": 5
  },
  "newMemory": {
    "type": "event",
    "content": "在大厅与角色发生了冲突",
    "importance": 7
  },
  "newItems": [],
  "scene": {
    "mood": "tense",
    "weather": "晴朗",
    "time": "午后"
  }
}
```

---

## 五、前端界面设计

### 5.1 主界面布局

```
┌───────────────────────────────────────────────────────┐
│ StatusBar                                             │
│ ❤️ HP: 100/100  💙 MP: 50/50  💰 100G  📍 王城大厅  📅 第3天 │
├────────────────────────────────────────────┬──────────┤
│                                            │          │
│                                            │  侧边栏   │
│           对话 / 叙述区域                    │          │
│           (自动滚动)                        │ 角色关系  │
│                                            │ 背包物品  │
│                                            │ 存档读档  │
│                                            │          │
│  ┌──────────────────────────────────────┐  │          │
│  │ [A] 选项一    [B] 选项二              │  │          │
│  │ [C] 选项三    [D] 自由输入...          │  │          │
│  └──────────────────────────────────────┘  │          │
├────────────────────────────────────────────┴──────────┤
│ [ 自由输入框 ]                            [ 发送 ↵ ]   │
└───────────────────────────────────────────────────────┘
```

### 5.2 侧边栏功能

1. **角色关系**：显示已解锁角色头像 + 好感度条 + 当前阶段
2. **背包物品**：物品列表 + 数量
3. **存档管理**：跳转存档页或弹窗快速存/读

### 5.3 对话区域

- AI 叙述文本以打字机效果逐字显示
- 玩家输入以聊天气泡形式显示在右侧
- AI 回复以叙述卡片形式显示在左侧
- 选项按钮在 AI 回复结束后浮现

---

## 六、API 设计

### 6.1 流式对话

```
POST /api/chat
Content-Type: application/json

Body:
{
  "saveId": 1,
  "message": "我走进了王城大厅"
}

Response: SSE Stream
event: chunk
data: {"content": "你推开沉重的橡木大门..."}

event: done
data: {"gameUpdate": { ... }}
```

### 6.2 存档 CRUD

```
GET    /api/saves            # 获取所有存档列表
POST   /api/saves            # 新建存档
PUT    /api/saves            # 更新存档
DELETE /api/saves?id=1       # 删除存档
```

---

## 七、环境变量

```env
# AI 配置
AI_BASE_URL=https://api.deepseek.com/v1
AI_API_KEY=sk-xxxxxxxx
AI_MODEL=deepseek-chat

# 数据库
DATABASE_URL=file:./dev.db
```

---

## 八、开发计划

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| P0 | 项目初始化 + Bun + Next.js + Prisma + SQLite | P0 |
| P0 | 流式对话 API + 基础前端对话界面 | P0 |
| P0 | 状态栏组件 | P0 |
| P1 | 存档系统 (10 槽位 + 自动存档) | P1 |
| P1 | 侧边栏 (关系 / 背包) | P1 |
| P1 | game-data 模块编写 (规则 + 世界观 + 角色) | P1 |
| P2 | 好感度系统 + 关系阶段解锁 | P2 |
| P2 | 剧情分支 + 多结局 | P2 |
| P2 | 道具 / 背包系统 | P2 |
| P3 | 选项按钮 + 自由输入混合模式 | P3 |
| P3 | 打字机效果 + UI 打磨 | P3 |
| P3 | 音效 / 背景图 (可选) | P3 |
