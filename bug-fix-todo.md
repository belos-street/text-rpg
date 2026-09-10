# bug-fix-todo — text-rpg 架构与代码审查报告

> 审查范围：`src/` 全部 34 个文件（约 3400 行）
> 审查方法：belos-street `code-review-dimensions` 八维清单（可读性/一致性/正确性/健壮性/耦合/抽象/性能/安全）
> 日期：2026-09-10

---

## 一、总评

**架构本身是合理的**：`lib/`（领域层）→ `app/api/`（传输层）→ `hooks + components/`（客户端）分层清晰，依赖方向正确，游戏数据与代码解耦做得很干净。**主要问题集中在三处**：

1. **错误处理大面积静默吞错**（命中红线），出错时玩家和开发者都不可见
2. **LLM 输出零校验**：`as GameUpdate` 裸断言，配合正则脆弱解析，正是"JSON 有时失效"的根因
3. **状态双写**：客户端和服务端各自实现一套"应用 stateChanges"逻辑，规则重复且已经漂移（clamp 不一致、增量重复应用）

评分（10 分制）：架构 7.5 / 正确性 5 / 健壮性 4 / 测试 0 / 一致性 6。修复 P1 后可到 7+。

---

## 修复记录

| 日期 | 项目 | 提交 |
|------|------|------|
| 2026-09-10 | **R1** 持久化静默吞错 → console.error + SSE `persistError` 事件通知前端 | 见 fix commit |
| 2026-09-10 | **P1 No.1** 路径穿越 → storage 入口 `^[a-f0-9]{20}$` 校验，5 个函数全覆盖 | 同上 |
| 2026-09-10 | **P1 No.2** 流式增量重复应用 → `updateEmitted` 标志，解析字段只 emit 一次 | 同上 |
| 2026-09-10 | **P1 No.3** 好感度 ID 缺失 → 角色关系段带 `（ID: xxx）`，提示词约束 key 必须用 ID | 同上 |
| 2026-09-10 | **P1 No.4** JSON 三道闸 → 新增 `schema.ts`（zod 字段级容错）+ 重写 `parser.ts`（围栏优先/字符串感知平衡扫描/流式 narrationPreview 不泄漏 JSON 前缀）+ `parser.test.ts` 20 用例全绿 | 同上 |

新增依赖：`zod@4`、`@types/bun`（dev）。新增文件：`src/lib/schema.ts`、`src/lib/parser.test.ts`。

---

## 二、Bug 与问题清单（按严重度）

### 红线（命中熔断，必修）

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| R1 | 健壮性 | **整个存档持久化块被 `catch { // silent }` 吞掉**。解析失败/写盘失败时，本回合的 HP、好感度、物品、记忆全部静默丢失，且无任何日志。玩家刷新页面后进度回档，无从排查 | 移除空 catch：至少 `console.error('[chat] persist failed', error)`；持久化失败时通过 SSE 追加一条 `{ persistError: true }` 事件告知前端 | [route.ts#L234-236](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L234-L236) |

### P1 必修（正确性 / 安全 / 数据一致性）

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| 1 | 安全 | **路径穿越**：`saveId` 来自请求体且未校验，直接拼进 `path.join(SAVES_DIR, \`${id}.json\`)`。`GET /api/saves/../../xxx` 可读取任意 `.json` 文件内容；`DELETE` 调 `fs.unlinkSync` 可**删除任意文件**（如 `../../game-data/00_故事配置/config`）。dev 服务监听 LAN（0.0.0.0），局域网内可利用 | 在 storage 入口统一校验：`if (!/^[a-f0-9]{20}$/.test(id)) return null / false`（generateId 的格式），fail-fast | [storage.ts#L17-23](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L17-L23)、[saves/[id]/route.ts#L17-26](file:///Users/belos/code/personal/text-rpg/src/app/api/saves/[id]/route.ts#L17-L26) |
| 2 | 正确性 | **流式期间增量字段重复应用**：JSON 在某 chunk 已完整闭合后，后续尾随 chunk（空行/空白很常见）会让 `parseGameUpdate` 再次成功 → payload 携带 `harmonyChange`/`affectionChanges`/`newItems` 反复发给前端 → 前端按增量重复累加（和睦度多扣、物品数量翻倍）。服务端只应用一次 → 刷新后状态跳变 | route 里加 `let updateEmitted = false`，`parsed` 首次成功后置 true，之后不再重复 emit 解析字段 | [route.ts#L72-92](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L72-L92) |
| 3 | 正确性 | **好感度系统大概率整体失效**：提示词只写 `"affectionChanges": {"角色ID": 变化值}`，但从未告诉 LLM 每个 `characterId` 是什么（上下文里只有 `【角色关系】莉娅: 好感度0`，无 ID）。LLM 会输出 `"莉娅": 2` 之类的名字做 key，`parsed.affectionChanges[r.characterId]` 查不到 → 永远返回 undefined → 好感度从不变化 | 在系统提示词的角色关系段显式带 ID：`- 莉娅 (ID: lia)：好感度0`，并要求 key 必须用 ID | [prompts.ts#L17-19](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L17-L19)、[prompts.ts#L120-122](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L120-L122) |
| 4 | 健壮性 | **LLM JSON 解析脆弱 + 零校验**（你提的第 3 点，根因在此）：① `parseGameUpdate` 用贪心正则 `\{[\s\S]*"type"...[\s\S]*\}` 匹配首个 `{` 到最后一个 `}`，输出带尾随文字/多个对象时必失败；② `extractNarration` 的平衡扫描把叙述文本内的 `{}` 也计入深度，叙述含花括号即崩；③ 解析成功后字段不校验——`hp: "85"`（字符串）会原样存盘，`hp: "high"` 产生 NaN 污染存档；④ JSON 失败时叠加上面的红线静默吞错 → 整回合状态无声丢失 | 三步修复：**(a)** 解析前置先剥 ` ```json ` 代码围栏（现在是删除而非提取）；**(b)** 引入 zod：`gameUpdateSchema.safeParse()`，数值字段用 `coerce.number()`，失败字段剔除而非整体拒绝；**(c)** 解析失败时降级：至少把纯文本当 narration 保存，并打日志 | [parser.ts#L3-11](file:///Users/belos/code/personal/text-rpg/src/lib/parser.ts#L3-L11)、[parser.ts#L30-31](file:///Users/belos/code/personal/text-rpg/src/lib/parser.ts#L30-L31)、[route.ts#L135-150](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L135-L150) |

### P2 重要（健壮性 / 一致性）

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| 5 | 一致性 | **clamp 规则双写且漂移**：客户端把 hp clamp 到 `[0, maxHp]`，服务端不 clamp 直接存盘。LLM 输出 `hp: 9999` 时 UI 显示正常、存档已是 9999，刷新后跳变 | clamp 收敛到服务端单点（storage 或 route），客户端只展示 | [route.ts#L138-141](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L138-L141) vs [page.tsx#L125-141](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L125-L141) |
| 6 | 正确性 | **对话历史持久化丢 `day`/`chapter`**：`appendConversation` 只存 `role/content`，重载后 `m.day ?? saveDay` 把全部历史归到当前天 → 按天回看功能在刷新后失效 | 存盘时带上当时的 day/chapter（服务器在 save 里有） | [route.ts#L112-121](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L112-L121) |
| 7 | 正确性 | **服务端记忆不带 `day`/`chapter`**（与 6 同根因）：客户端写入的 day/chapter 仅在内存里，服务器 `updateData.memories` 只有 id/type/content/importance/createdAt，重载后记忆归属漂移 | 服务端写记忆时从 `freshSave.day/chapter` 补全 | [route.ts#L196-226](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L196-L226) |
| 8 | 正确性 | **config 竞态覆盖读档**：`/api/config` 若在 `/api/saves/:id` 之后 resolve，`setPlayerState(prev => ({...prev, ...cfg.initialState}))` 会用初始值覆盖已读档的 HP 等 | config 应用前判断 `!gameStarted`（用 ref 记录），或把两个请求串行化 | [page.tsx#L187-204](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L187-L204) |
| 9 | 性能 | **对话历史以完整 JSON blob 回喂 LLM**：assistant 消息存的是模型原始输出（整个 JSON 结构），每次请求把 N 段 JSON 重复计入 token（本地模型直接拖慢生成），还强化"历史长这样"的错误格式示范 | 存储时保留原文（用于恢复选项），但 `buildMessages` 喂历史前先 `extractNarration` 压缩 | [prompts.ts#L172-182](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L172-L182) |
| 10 | 健壮性 | **ai.ts 无超时无重试**：本地模型 JIT 冷启动（TTL 过期后重载）可能 30s+ 无响应，OpenAI SDK 默认超时 10 分钟，玩家端表现为无限"思考中" | `new OpenAI({ baseURL, timeout: 60_000, maxRetries: 1 })` | [ai.ts#L8-24](file:///Users/belos/code/personal/text-rpg/src/lib/ai.ts#L8-L24) |
| 11 | 正确性 | **React 状态突变**：`onNewItems` 里 `existing.quantity += 1` 修改的是 `prev` 数组里的原对象（浅拷贝只拷了引用） | 改为 `updated.map()` 返回新对象 | [page.tsx#L158-171](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L158-L171) |
| 12 | 健壮性 | **代码围栏 JSON 被删除而非提取**：`extractNarration` 的 fallback 用正则把 ` ```json...``` ` 整段删除——模型违反指令用围栏包裹 JSON 时，叙述直接变空 | fallback 前先尝试从围栏内提取 JSON 解析 | [parser.ts#L34-38](file:///Users/belos/code/personal/text-rpg/src/lib/parser.ts#L34-L38) |
| 13 | 健壮性 | **静默吞错群**：① `listSaves` 捕获后返回 null → 损坏存档从列表静默消失，玩家无法发现/删除；② `page.tsx` config 加载 `catch(() => {})` → 标题永远"加载中"无提示；③ parser 两处空 catch | 各处补 `console.error`；损坏存档在列表里标记"损坏"并允许删除 | [storage.ts#L51-53](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L51-L53)、[page.tsx#L204](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L204) |
| 14 | 健壮性 | **`POST /api/chat` 请求体无校验**：`await req.json()` 无 try/catch（畸形 body → 500），`message`/`playerName` 不校验类型与长度 | 与 No.4 一并引入 zod 在 API 边界校验；`playerName` 加长度上限（如 20 字符） | [route.ts#L34](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L34) |

### P3 可选（风格 / 性能微优化 / 清理）

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| 15 | 抽象 | **死代码三处**：`trimConversationForTokenLimit` 定义后从未调用；`SaveData.dialogueHistory` 字段只写 `[]` 从未更新（与 conversations 文件双轨存储，语义混乱）；`GameUpdate.newChoices` 无人使用 | 删除 `trimConversationForTokenLimit` 与 `newChoices`；`dialogueHistory` 要么删掉要么真正维护——二选一 | [prompts.ts#L44-67](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L44-L67)、[types/index.ts#L87](file:///Users/belos/code/personal/text-rpg/src/types/index.ts#L87)、[types/index.ts#L55](file:///Users/belos/code/personal/text-rpg/src/types/index.ts#L55) |
| 16 | 可读性 | `loadGameContext` 对入参 `save.memories` 原地 `sort()`（sort 是 mutation） | 先 `[...save.memories].sort(...)` | [prompts.ts#L5-9](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L5-L9) |
| 17 | 性能 | **流式解析 O(n²)**：每个 chunk 对全量 `fullContent` 跑正则 + 平衡扫描 + `JSON.parse`；输出 4k 字符 × 数百 chunk 开销可观 | 简单标记：`{` `}` 计数平衡前跳过解析；或每 N chunk 才尝试一次 | [route.ts#L61-96](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L61-L96) |
| 18 | 性能 | `appendConversation` 每回合全量读+写整个对话文件，且文件无上限增长 | 长战役可按 turn 数分片或设上限；短期可接受 | [storage.ts#L136-145](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L136-L145) |
| 19 | 耦合 | `page.tsx` 中 `?load=` URL 分支与 `loadSave` 回调约 30 行历史恢复逻辑完全重复（DRY 破裂，已有轻微漂移） | 抽 `restoreHistory(data.save, data.history)` 一个函数两处调用 | [page.tsx#L209-246](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L209-L246) vs [page.tsx#L354-381](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L354-L381) |
| 20 | 正确性 | `createInitialSave` 恒写 `slot: 1`，多存档全是 slot 1，槽位机制半成品 | 要么实现槽位选择，要么删掉 slot 字段 | [storage.ts#L183](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L183) |
| 21 | 性能 | `loadEssentialGameData` 每次聊天请求同步读约 9 个 md 文件（4 万+字符） | 加模块级缓存（按 mtime 失效，保住 dev 时改档热更新） | [game-data.ts#L136-149](file:///Users/belos/code/personal/text-rpg/src/lib/game-data.ts#L136-L149) |
| 22 | 一致性 | **风格与 AGENTS.md 约定冲突**：规范要求组件文件 kebab-case（`chat-panel.tsx`），现存全是 `ChatPanel.tsx`；规范要求单引号，`page.tsx` 单引号无分号、其余文件全双引号，且项目无 oxfmt/prettier 配置 | 二选一：统一改文件名与引号，或修订 AGENTS.md 承认现状；补一个格式化配置终结漂移 | 全局 |
| 23 | 可读性 | `Sidebar` 把和睦度标成"好感度"文案；移动端遮罩 `onClick={() => {}}` 点了关不掉侧栏 | 文案改"和睦度"；遮罩点击回调 `onClose` | [Sidebar.tsx#L124](file:///Users/belos/code/personal/text-rpg/src/components/game/Sidebar.tsx#L124)、[Sidebar.tsx#L92-97](file:///Users/belos/code/personal/text-rpg/src/components/game/Sidebar.tsx#L92-L97) |
| 24 | 健壮性 | `playerName` 无长度限制，任意长字符串入库 | 创建时截断/校验（配合 No.14 zod） | [saves/route.ts#L15-18](file:///Users/belos/code/personal/text-rpg/src/app/api/saves/route.ts#L15-L18) |
| 25 | 可读性 | `applySaveData` 参数内联重造了一份 `SaveData` 的形状 | 直接 `save: SaveData` | [page.tsx#L258-274](file/Users/belos/code/personal/text-rpg/src/app/page.tsx#L258-L274) |

---

## 三、专项问题解答

### 1. 单元测试怎么加（当前测试覆盖为 0）

项目用 Bun，`bun test` 内置零依赖，`*.test.ts` 放同目录即可。**优先级按"纯函数 × 高风险"排序**：

| 优先级 | 模块 | 理由 | 建议用例 |
|--------|------|------|----------|
| P0 | `parser.ts` | LLM 输出的第一道闸门，当前 4 个 P1 里它占一半 | 正常 JSON / 带代码围栏 / JSON 前后有杂文 / 叙述含 `{}` / 数值是字符串 / 完全无 JSON |
| P0 | `affection.ts` | 纯函数 10 行，阶段边界 20/21/95/96/100/NaN | 边界值全覆盖 |
| P1 | `storage.ts` | 存档读写核心；用 `process.env` 注入或参数化临时目录测 | create/list/update 记忆裁剪（MAX_MEMORIES）/ delete 联动会话文件 / 损坏 JSON 文件 / 路径穿越 id 被拒 |
| P1 | `summarizeConversation` | 记忆压缩逻辑纯函数 | 空消息 / 超长截断 / 滚动窗口 |
| P2 | `buildMessages` | 提示词组装 | 首次开局 / 带历史 / 空 userInput |

配套：`package.json` 加 `"test": "bun test"`，把 `lint` + `test` 串进提交前流程。用 `bun:test` 的 `mock`/`jest` 全局即可，不需要装 vitest。

### 2. Agent 记忆如何管理（现状评估 + 改进方案）

**现状：三层记忆，每回合全量注入**（见 [prompts.ts#L4-42](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L4-L42)、[storage.ts#L147-170](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L147-L170)）：

```
每次对话的 LLM 上下文 =
  系统提示词（游戏规则 + 全量 game-data ≈ 4 万字符）
  + 当前存档摘要 summary          ← 第 1 层
  + 玩家状态/好感度/背包/章节      ← 结构化状态
  + 近期记忆（按重要度排序前 15 条，上限 20 条）← 第 2 层
  + 最近 20 条对话原文             ← 第 3 层
```

**存储**：存档 `data/saves/{id}.json`（状态+记忆），对话 `data/conversations/{id}.json`（追加式全量），每回合服务器自动 `updateSave` 持久化。

**评估——存档设计本身是恰当的**（单文件 JSON、读写简单、符合本地单机规模），但有四个实质缺陷：

| 问题 | 位置 | 改进 |
|------|------|------|
| `summary` 是启发式拼接（旧摘要截 200 字 + 最近 6 条消息前 120 字），**不是真摘要**，信息密度低且和第 3 层对话窗口高度重复 | [storage.ts#L147-170](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L147-L170) | 每完成 N 回合（或跨章时）用一次廉价 LLM 调用做真摘要替换；短期可先把摘要长度上限提高、去掉与近期对话的重复 |
| 记忆丢失 `day/chapter`（服务端不写），重载后章节视图错乱 | route.ts（见 P2 No.7） | 服务端写记忆时补全 |
| `MAX_MEMORIES=20` 按 importance 截断，淘汰的记忆**永久消失**无归档 | [storage.ts#L90-99](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L90-L99) | 被淘汰的记忆合入 summary（一句话级），或单独存 `memories-archive` 段不进提示词 |
| 全量 game-data（19 个女主档案）每回合注入，token 成本巨大且随女主数线性涨 | [game-data.ts#L136-149](file:///Users/belos/code/personal/text-rpg/src/lib/game-data.ts#L136-L149) | 分层加载：核心规则+当前章节大纲常驻；女主档案按"当前场景在场角色 + 好感度 > 某阈值"动态筛选；这就是当初设计文档里预留的优化项 |

### 3. LLM JSON 严格校验方案（你提的第 3 点）

按"**宽进严出**"三道闸实现（对应 P1 No.4）：

```ts
// 闸门 1：提取（宽容）—— parser.ts
// 先剥 ```json 围栏 → 再平衡括号扫描 → 失败再试贪心正则
export function extractJsonBlock(text: string): unknown | null

// 闸门 2：校验（严格）—— 新增 src/lib/schema.ts，用 zod
const choiceSchema = z.object({ id: z.string(), text: z.string() })
const gameUpdateSchema = z.object({
  type: z.literal('game_update'),
  narration: z.string().catch(''),
  choices: z.array(choiceSchema).max(4).catch([]),
  stateChanges: z.object({
    hp: z.coerce.number().int().optional(),
    mp: z.coerce.number().int().optional(),
    gold: z.coerce.number().int().optional(),
    // ...
  }).optional(),
  affectionChanges: z.record(z.string(), z.coerce.number().int()).optional(),
  // ... 字段全部 .catch() 兜底，坏字段剔除而非整体拒绝
})

// 闸门 3：降级（可用）—— route.ts
// 解析彻底失败时：narration = 纯文本清洗后的输出，choices = 空，
// 状态不更新但对话照常入库，且 console.error 留痕（供复盘提示词问题）
```

依赖：`bun add zod`（唯一新增依赖，值得）。校验通过后 route 里所有 `parsed.xxx` 的裸访问自然安全。

### 4. 其他可优化项（按投入产出排序）

1. **提示词瘦身**（P2 No.9 + 记忆分层）：本地模型每回合吞吐 5 万+字符，NarrativeText 生成慢的主要根源；做完分层加载，速度可翻倍
2. **状态单点化**：把"应用 stateChanges"收敛到服务端一处（含 clamp），前端只做展示；消灭双写漂移（P2 No.5、P1 No.2 一起解决）
3. **流式解析节流**（P3 No.17）：一行平衡计数判断，省 90% 无效解析
4. **game-data 缓存**（P3 No.21）：mtime 缓存，30 行以内
5. **格式化工具链**（P3 No.22）：加 oxfmt/prettier 配置 + `format` script，终结引号/分号漂移

### 5. 排查出的潜在 bug（速查）

完整清单见上方表格。最容易实际踩到的 Top 5：

1. **好感度永远是 0**（P1 No.3）——LLM 不知道 characterId，玩多久好感度都不动
2. **刷新后物品数量/和睦度跳变**（P1 No.2）——流式增量重复应用
3. **进度静默回档**（红线 R1 + P1 No.4）——JSON 解析失败叠加静默吞错
4. **重载后"按天回看"全错**（P2 No.6/7）——历史与记忆不带 day/chapter
5. **局域网内存档文件可被任意读/删**（P1 No.1）——路径穿越

### 6. 上下文压缩与性能优化方案（实测数据）

**现状——没有真正的压缩，只有三个截断点**：

| 层 | 内容 | 截断方式 | 实测大小 |
|----|------|----------|----------|
| 静态层 | 核心规则+主角+**19 女主全量**+好感表+地图 | 不截断，每回合原样重发 | 42,266 字符 ≈ 21k tokens |
| 状态层 | summary+状态+好感+背包+记忆(前15条) | 记忆上限 20 条 | ~2k 字符 |
| 历史层 | 最近 20 条对话 | `slice(-20)` 按条数，不按 token | 满载 ~20k 字符 ≈ 10k tokens |

**稳态每回合 ≈ 32k tokens**（assistant 原始 JSON 输出约 2,038 字符/条，其中 narration 只占 74%）。

**"越玩越慢"的四个根因**：

1. 前 20 轮历史层线性增长 → prompt 变长 → 本地模型 prefill 时间线性上涨；20 轮后卡在 32k 平台
2. **前缀缓存被破坏**：静态层 42k 字节级稳定（本可被 LM Studio KV cache 复用），但易变的游戏状态拼在 system 消息尾部，每回合都变 → 缓存命中在状态段开头就断，历史层每回合全部重新 prefill
3. assistant 原始 JSON 直接回喂（26% 是结构噪音）；summary 与历史窗口内容重复（双份花钱）
4. 流式期间每 chunk 对全量内容做 JSON 解析（O(n²)，见 P3 No.17）

**评估**：分层思路（长期记忆压缩 + 短期滑动窗口）是行业标准的正确配方；实现有四个缺陷——按条数不按 token 截断（`trimConversationForTokenLimit` 死代码）、原始 JSON 回喂、易变状态破坏前缀缓存、summary 重复。而真正的大头是静态层 42k 里 **37k（88%）是女主档案全量**，每回合为大概率不出场的内容付费。

**短期优化（只改 prompts.ts / route.ts）**：

| # | 改法 | 效果 |
|---|------|------|
| S1 | assistant 历史喂模型前提取 narration-only（原文仍存 conversations 文件用于恢复选项） | 历史层 -30~50% |
| S2 | **易变状态挪到消息序列末尾**（静态 system → 历史 → 状态 system → user），让前缀缓存命中静态层+全部历史 | 本地模型速度质变 |
| S3 | 历史窗口 20→10 条（更早内容有 summary+记忆兜底） | -5k tokens |
| S4 | 接线或删除 `trimConversationForTokenLimit` | 清理死代码 |

**中期优化（配合第五节 B5 flags 与 A 分层注入）**：

| # | 改法 | 效果 |
|---|------|------|
| M1 | 女主档案按场景筛选：按当前章节重点女主注入 3-5 人，非 19 人全量 | 静态层 42k → 8-12k |
| M2 | 主线大纲只注入"当前章节概要+推进原则"而非全篇 | 剧情层 15k → ~2k |
| M3 | 真 LLM 摘要替换滚动拼接的伪 summary（每 N 回合一次） | 消除与窗口的重复 |

**预期**：稳态 32k tokens → 短期 ~15k → 中期 ~6-8k；叠加前缀缓存命中后每回合实际新增 prefill 仅 1-2k tokens，本地模型回复速度数量级改善。

### 7. 第二轮交叉审查（外部 agent 结论核实版）

> 另一 agent 审查后报告了 1 红线 + 14 问题，但其声称"已追加到本文档第六节"与事实不符（文件无其改动），且 R2 细节有误。以下为**逐条核实后**的结论与修复状态。

#### R2（红线）——属实，已修复 ✅

**`.env.local` 被提交进 git 并已推送 GitHub**。核实事实：

- commit `5248040`（"docs: add local llm server api docs"）将 `.env.local`（含 API key）加入版本控制，**同时删除了 `.gitignore` 里原有的 `.env.local` 规则**（外部 agent 说"gitignore 没覆盖 .env*"不准确——规则本来有，是被该 commit 删掉的）
- `master` 与 `origin/master` 同步 → 已推送到 github.com/belos-street/text-rpg.git
- 无实际泄露：key 为本地模型占位符 `lm-studio`（用户确认）；但历史中文件仍在，未来换真实 key 前必须保持脱敏
- **修复**：commit `e2e28e4` 执行 `git rm --cached .env.local` + 恢复 `.gitignore` 规则（待 push）。因非真实密钥，无需重写历史

#### 新增 P1（4 条，核实全部属实）

| No. | 问题 | 核实结论 | 位置 |
|-----|------|----------|------|
| 26 | **留空 API key 必崩**：`.env.example` 教本地模型用户"AI_API_KEY 留空即可"，但 ai.ts 在 key 为空时不设 `apiKey` → OpenAI SDK 构造直接抛错，Ollama/LM Studio 用户首条消息即失败 | ✅ 属实（本机配置时已踩过，见 ai.ts#L21-22 的 `else if (apiKey)` 分支） | [ai.ts#L8-24](file:///Users/belos/code/personal/text-rpg/src/lib/ai.ts#L8-L24) |
| 27 | **会话损坏 = 历史全灭**：`getConversation` 解析失败返回 `[]`，`appendConversation` 随即整体覆写文件——一次损坏抹掉全部对话记录（破坏性写入，比静默吞错更严重） | ✅ 属实 | [storage.ts#L126-145](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L126-L145) |
| 28 | **停止按钮竞态**：`stop()` 客户端立即解锁允许重发，服务端感知不到断开——旧请求半截内容入库，持久化块与新请求竞态（updateSave 整档读改写，后写者胜） | ✅ 属实（客户端 isStreamingRef 锁因 stop 提前释放） | [use-stream-chat.ts#L142-146](file:///Users/belos/code/personal/text-rpg/src/hooks/use-stream-chat.ts#L142-L146) |
| 29 | **两个入口永久卡死**：① 新建存档接口 500 → `if (data.save)` 无 else，isLoading 永远 true 无限转圈；② `?load=` 传无效 id → savesLoading 恒 true，标题屏永远"正在检查存档……"（TitleScreen.tsx#L140） | ✅ 属实（两处 `if (data.save)` 均无 else/错误提示） | [page.tsx#L311-332](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L311-L332)、[page.tsx#L209-246](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L209-L246) |

#### 新增 P2（5 条，核实全部属实）

| No. | 问题 | 核实结论 |
|-----|------|----------|
| 30 | 服务端记忆时间戳是手写本地时间（无时区后缀），与客户端 ISO/UTC 格式混存，按 createdAt 排序最多漂移 8 小时 | ✅ 属实（route.ts 手拼 `YYYY-MM-DDTHH:mm:ss`，与 `new Date().toISOString()` 混用） |
| 31 | Sidebar 的 `(m.chapter ?? chapter)` 匹配让无 chapter 的记忆重复出现在每个章节下（被 P2 No.7"服务端不写 chapter"放大） | ✅ 属实 |
| 32 | 服务端对同一 saveId 完全无并发控制（双开标签页/多客户端丢更新） | ✅ 属实（getSave→updateSave 读改写无锁；第一轮未收录，此处补记） |
| 33 | `parseNarrative` 无 useMemo，流式期间每 chunk 全量重解析（P3 No.17 的客户端镜像） | ✅ 属实 |
| 34 | summary 被原始 JSON 片段污染：`summarizeConversation` 对 assistant 原文截 120 字，`{"type":"game_u...` 进摘要滚动保留，污染长期记忆 | ✅ 属实（与 P2 No.9 同根因：历史存的是原始 JSON） |

#### 新增 P3（3 条）

| 问题 | 核实结论 |
|------|----------|
| `generateId` 的 Math.random 降级分支产物不符合 `^[a-f0-9]{20}$`，若触发将撞上 No.1 的路径校验被拒（存档不可达） | ✅ 属实（边缘场景：crypto 不可用时） |
| `ChoicePanel` 用 `key={choice.id}`，LLM 输出重复 id 时 React key 冲突 | ✅ 属实（ChoicePanel.tsx#L24） |
| `AI_REASONING` 参数盲目透传给 DeepSeek 等云端 API 可能 400 | ⚠️ 方向成立但未实测；透传前应按 baseURL 白名单过滤 |

---

## 五、业务与产品设计层面的建议和缺陷（补充审查）

### A. 致命设计缺陷：内容与引擎脱节（最重要的发现）

**一半的 game-data 根本没进提示词。** `loadEssentialGameData()` 只拼装了 5 样东西（核心规则、主角、女主、好感度表、场景地图），以下加载函数**定义了但从未被任何地方调用**：

| 未接入的内容 | 后果 |
|------|------|
| [main-quest.md](file:///Users/belos/code/personal/text-rpg/game-data/04_剧情故事库/main-quest.md)（10 章主线大纲，1.5 万字） | **GM 完全不知道主线剧情**，第六幕决战、宰相线、世界树全是它不知道的设定——它在自由发挥一个没有大纲的故事 |
| [npcs/index.md](file:///Users/belos/code/personal/text-rpg/game-data/03_角色人物档案/npcs/index.md) | 宰相、巴尔泽布、大司祭等关键剧情人物对 GM 不存在 |
| [world-setting.md](file:///Users/belos/code/personal/text-rpg/game-data/02_世界观背景库/world-setting.md) + [magic-system.md](file:///Users/belos/code/personal/text-rpg/game-data/02_世界观背景库/magic-system.md) | 五文明、裂隙魔力、斗气等世界观 GM 全靠女主档案里的只言片语脑补 |
| [items.md](file:///Users/belos/code/personal/text-rpg/game-data/06_道具技能天赋/items.md) / [skills.md](file:///Users/belos/code/personal/text-rpg/game-data/06_道具技能天赋/skills.md) | 无名吊坠、羁绊信物、技能体系——道具系统形同虚设 |
| [combat.md](file:///Users/belos/code/personal/text-rpg/game-data/09_判定数值表/combat.md) | 战斗判定表从未生效，战斗全是口头描述 |

**改法（分层注入，不是全塞）**：
```
常驻层（每回合）：核心规则 + 主角 + 当前场景相关女主（按地点/剧情筛选，非 19 人全量）
剧情层（每回合）：主线大纲压缩版（幕结构 + 当前章节概要 + 推进原则）+ 当前章节相关 NPC
世界层（首回合或按需）：世界观 + 魔法体系
```
本地模型 200k 上下文装得下全量，但延迟是实打实的——分层是速度与一致性的双赢。

### B. 其他设计缺陷（引擎与内容的一致性）

| No. | 问题 | 证据与后果 | 改法 |
|-----|------|-----------|------|
| B1 | **玩家名字从未告诉 AI**。开局郑重其事让玩家输入名字，但 `playerName` 只进了存档元数据，`buildSystemPrompt`/`loadGameContext` 都没有它——GM 全程不知道主角叫什么（提示词里只有 config 的占位名"旅人"） | [prompts.ts#L77-83](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L77-L83)、[prompts.ts#L28](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L28) | `loadGameContext` 的玩家状态行加 `玩家:${save.playerName}` |
| B2 | **scene 是死数据**：每回合让 LLM 输出 mood/weather/time，存进存档，但从不回喂提示词、UI 也不展示（StatusBar 不显示天气氛围）——纯浪费 token 的闭环 | [prompts.ts#L25-41](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L25-L41) 无 scene；[StatusBar](file:///Users/belos/code/personal/text-rpg/src/components/game/StatusBar.tsx) 不展示 | 回喂提示词（氛围一致性）或展示到 UI，二选一 |
| B3 | **叙事人称自相矛盾**：`prompts.ts` 要求第一人称「我」叙事，而 `core-rules.md` 要求第二人称「你」称呼玩家——模型每回合收到两份打架的指令，输出人称随机漂移 | [prompts.ts#L81-84](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L81-L84) vs [core-rules.md 叙事原则#1](file:///Users/belos/code/personal/text-rpg/game-data/01_全局游戏规则/core-rules.md) | 二选一统一（建议第一人称，改 core-rules.md） |
| B4 | **提示词引用不存在的规则**：`prompts.ts` 写"按照 core-rules.md 中的 R-18 规则执行"，但 core-rules.md 是全年龄向，根本没有 R-18 小节——模型被要求遵循一条不存在的规则 | [prompts.ts#L147](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L147) | 删掉该条，或把内容分级做成 config 的显式开关 |
| B5 | **没有 flags/任务状态系统**：10 章主线的"过关条件"、支线触发条件（好感 21+/31+）全靠 LLM 从记忆里"猜"。记忆上限 20 条，第 30 回合它就忘了你有没有见过女王 | 过关条件定义在 main-quest.md 但无处结构化存储 | SaveData 加 `flags: Record<string, boolean\|number>`，game_update 允许 LLM 设置 flag（如 `met_queen: true`），提示词按 flag 注入当前章节概要与可触发支线 |
| B6 | **判定表全是"软约束"**：combat.md/affection.md 定义了完整数值规则，但引擎从不执法——HP 可以一回合从 80 到 9999，好感度单次变化不设上限（规则说 ±5） | 全靠 LLM 自觉 | 引擎侧硬执法：hp/mp/gold clamp 到合法区间（与 P2 No.5 合并做）、单回合好感度变化 clamp ±10、day 只增不减 |
| B7 | **harmony（和睦度）没有玩法回路**：它被采集、展示成进度条，但没有任何事件/判定使用它——纯装饰数值 | 全局 grep 只有展示与累加 | 要么在提示词里声明效果（"和睦度低于 40 时触发吃醋事件概率上升"），要么砍掉 |
| B8 | **chapter/day 是自由字符串**：Sidebar 章节树按字符串分组，LLM 输出"第2章"vs"第二章：xxx"就分裂出新章节；天数可以倒流 | [Sidebar.tsx#L41-73](file:///Users/belos/code/personal/text-rpg/src/components/game/Sidebar.tsx#L41-L73) | 章节枚举化（config 预定义章节列表，LLM 只能选不能造），day 引擎 clamp 只增 |

### C. 玩法体验层面的建议

| No. | 建议 | 理由 |
|-----|------|------|
| C1 | **加"重新生成"按钮（最高优先的体验缺口）**：LLM 游戏的刚需——输出质量差/跑偏时玩家唯一能做的就是硬着头皮继续。复用当前 saveId + 不追加 user 消息重发一次即可；配合回滚（删掉最后一轮对话+回滚状态）更佳 | 本地模型质量波动大，这个按钮的使用频率会远超想象 |
| C2 | **开局第一回合用固定文案，不走 LLM**：现在新游戏的第一秒体验 = 5 万 token 提示词 + 本地模型冷启动，玩家盯着 spinner 最久的就是这一刻。config 里加 `openingNarration`（确定性序章文本 + 固定选项），从第二回合再交给 LLM | 第一印象 = 留存 |
| C3 | **好感度变化的即时反馈**：现在好感度只在侧栏数字+1，玩家无感。game_update 里让 LLM 附带 `affectionReason`，前端做"+2 莉娅（帮她捡起了义诊箱）"的浮动提示——这是养成游戏的核心多巴胺回路 | 情感反馈可视化 |
| C4 | **背包从"摆设"变"玩法"**：物品现在只能看不能碰。最小改法：加"赠送"动作（选物品+选角色 → 走好感度判定），直接打通背包→好感度的玩法闭环，也符合游戏里"信物"的设定 | 现有数据结构完全支持，纯前端+一个 API |
| C5 | **导出/分享故事日志**：文字冒险玩家最强的传播动机是"我的故事"。对话文件本来就是 JSON——加一个导出 Markdown 的按钮成本极低，收益是天然的社交传播 | 引擎定位下的口碑引擎 |
| C6 | **结局图鉴（跨存档全局进度）**：19 个人线+4 个主线结局是复玩性的核心，但当前没有任何跨存档状态——结局达成了也没记录。`data/global.json` 存"已解锁结局/已攻略角色"，标题屏展示收集进度 | 给"再开一周目"一个理由 |

### D. 引擎/平台化层面的建议（面向"故事引擎"定位）

| No. | 建议 | 理由 |
|-----|------|------|
| D1 | **用结构化输出替代整个 JSON 解析层**：LM Studio 的 OpenAI 兼容接口支持 `response_format: { type: "json_schema", json_schema: {...} }`——在语法层面强制模型只能输出合法 JSON。这比 zod 三道闸更彻底（zod 仍建议保留做最后防线），解析失效问题从根上消失 | 比修 parser 一劳永逸，云 API（OpenAI/DeepSeek）也普遍支持 |
| D2 | **多故事包支持**：`game-data/` 路径硬编码单故事，与"故事引擎+模板分享"的定位矛盾。改造成 `stories/<pack-id>/` 多目录 + 标题屏故事选择页 + `GET /api/stories` | 引擎价值的核心兑现 |
| D3 | **game-data 校验 CLI**：`bun run validate:story`——检查 config.json 字段完整、目录文件齐全、initialRelations 的 characterId 与 characterEmoji 的名字一致（本次发现的 No.3 类问题可以在创建期拦截） | 给故事创作者（包括未来的你自己）兜底 |
| D4 | **调试面板**：展示最终发出的提示词、原始返回、JSON 解析结果、token 用量——调 game-data 和提示词时这是刚需，否则每次只能靠猜 | 内容作者的效率工具 |
| D5 | **模型策略配置化**：推理模型/非推理模型、上下文长度、reasoning 档位已经踩过一轮坑（gemma/qwen 的 reasoning 差异）——把"推荐模型配置"写进 README 或做成 config，别让下一个用户再踩 | 降低部署摩擦 |

---

## 四、建议修复顺序

```
第一批（一次提交，均为小改动）
  R1 静默吞错 + No.1 路径穿越 + No.3 提示词补 ID
第二批（引入 zod，一起做）
  No.4 三道闸 JSON 校验 + No.2 增量去重 + No.5 clamp 单点化 + No.14 边界校验
第三批（体验与记忆）
  No.6/7 day-chapter 补全 + No.8 竞态 + No.10 超时 + 记忆管理改造
第四批（测试与清理）
  单元测试四件套 + P3 死代码清理 + 格式化配置
```

---

## 六、第二轮深度复审补充（2026-09-10，belos-street 八维清单全量走查）

> 方法：通读 src/ 全部 34 文件 + hooks + 组件，对照第一轮清单排除已报项，交叉验证调用链后定级。
> 已核对：`saves/[id]/route.ts` 的 `params: Promise<{id}>` 写法与 Next.js 16 本地文档一致；`game-data/` 目录结构与 `game-data.ts` 硬编码路径一致。
> 勘误：第一轮 No.12 描述"叙述直接变空"不准确——`extractNarration` fallback 实际是 `return cleaned || text`，真实行为是**把原始 JSON 整串当叙述显示给玩家**，同样需要修。

### 新增红线

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| R2 | 安全 | **`.env.local`（含真实 AI_API_KEY）已被提交进 git**（commit 5248040），`.gitignore` 只忽略 `data/`、`game-data/`，未覆盖 `.env*`。若仓库推送过远端即视为密钥泄漏 | `git rm --cached .env.local`；`.gitignore` 加 `.env*`（保留 `.env.example`）；**立即去服务商后台轮换该密钥**（历史中已存在） | .env.local、.gitignore |

### 新增 P1（正确性 / 数据破坏）

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| 26 | 正确性 | **按官方模板留空 API Key 的本地模型用户必报错**：`.env.example` 明确写"留空即可，Ollama 不需要 API Key"，但 `getClient()` 在非 Mimo 且 key 为空时不设置 `apiKey` → OpenAI SDK 构造函数直接抛 "The API key supplied must be..."，首条消息即失败（除非用户 shell 恰好有 OPENAI_API_KEY） | key 为空时兜底 `opts.apiKey = "sk-local"`（本地服务不校验 key），与 Mimo 分支同样处理 | [ai.ts#L20-22](file:///Users/belos/code/personal/text-rpg/src/lib/ai.ts#L20-L22) |
| 27 | 正确性 | **会话文件一旦损坏，下次追加会抹掉全部历史**：`getConversation` 解析失败静默返回 `[]`，`appendConversation` 随即用 `[...[], 新消息]` 整体覆写文件——静默吞错（第一轮 No.13）在这里升级成**破坏性写入**，且无法恢复 | 区分"不存在"与"损坏"：损坏时 append fail-fast 保留坏文件（可先复制 `.bak`），不要覆盖 | [storage.ts#L126-145](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L126-L145) |
| 28 | 正确性 | **停止/中断回合的服务端行为未定义 + 重发竞态**：客户端 `stop()` 只 abort fetch 并立即解锁（isStreamingRef=false）→ 玩家可马上重发；服务端感知不到断开，旧请求继续消费 LLM 流、半截内容入库，其持久化块与新请求竞态覆盖（新回合成效丢失、对话交错/重复）；且 enqueue 到已取消 controller 抛错后，catch/finally 里再 enqueue/close 会抛次生异常 | route 监听 `req.signal` / stream `cancel()` 提前终止并持久化已有内容；hook stop 后锁定到旧请求真正结束；持久化按 saveId 串行化（配合 No.32） | [use-stream-chat.ts#L142-146](file:///Users/belos/code/personal/text-rpg/src/hooks/use-stream-chat.ts#L142-L146)、[route.ts#L56-110](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L56-L110) |
| 29 | 健壮性 | **`if (data.save)` 缺 else，两个入口永久卡死**：① `startNewGame` 中 POST /api/saves 返回非 2xx（如磁盘写入 500）→ `isLoading` 恒 true → 空屏无限转圈；② `?load=` 传无效 id → 404 → `.catch(() => {})` 吞掉且跳过拉取存档列表的 else 分支 → 标题屏永远停在"正在检查存档……"。另注：失败路径下前端乐观添加的 user 消息服务端并未持久化，刷新即消失 | 两处补 else：报错提示 + `setIsLoading(false)` / `setSavesLoading(false)`；失败时回滚乐观消息 | [page.tsx#L312-332](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L312-L332)、[page.tsx#L209-246](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L209-L246) |

### 新增 P2（正确性 / 健壮性 / 性能）

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| 30 | 正确性 | **记忆 createdAt 双格式混存，排序漂移**：服务端新增记忆用 20 行手写格式化产生本地时间无时区标记（`2026-09-10T22:00:00`），而 `createInitialSave`/客户端用 `toISOString()`（UTC+Z）。同档两种格式经 `new Date()` 解析基准不同（无 Z 按本地、有 Z 按 UTC），UTC+8 下跨格式排序最多漂 8 小时 | 删掉手写格式化，统一 `new Date().toISOString()` | [route.ts#L202-214](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L202-L214) |
| 31 | 正确性 | **无 chapter 的记忆在章节树下重复显示**：Sidebar 过滤 `(m.chapter ?? chapter) === chapter` 对每个章节分组都命中 → 同一条记忆出现在所有章节；服务器又恰好不给记忆写 chapter（第一轮 No.7），放大为"全部记忆重复挂在每个章节" | 改为 `(m.chapter ?? "未知章节") === chapter` | [Sidebar.tsx#L66-68](file:///Users/belos/code/personal/text-rpg/src/components/game/Sidebar.tsx#L66-L68) |
| 32 | 健壮性 | **服务端对同一 saveId 完全无并发控制**：`updateSave`（getSave→写盘）与 `appendConversation`（读→改→全量写）都是无锁读改写，双开标签页 / dev 监听 LAN 时丢更新、对话交错（第一轮只提了 config 竞态 No.8，服务端写路径竞态未覆盖） | 模块级 `Map<saveId, Promise>` 把写操作按存档串行化（最小实现，~15 行） | [storage.ts](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts) |
| 33 | 性能 | **客户端流式渲染 O(n²)**：`parseNarrative` 每次渲染全量重跑且无 useMemo——流式期间每个 chunk 触发对已积累全文的重解析（第一轮 No.17 是服务端解析的镜像问题）；已完成消息的解析还会因兄弟组件状态变化反复重跑 | `const segments = useMemo(() => parseNarrative(text), [text])`；流式气泡可只对最后一段做增量 | [NarrativeText.tsx#L91-92](file:///Users/belos/code/personal/text-rpg/src/components/game/NarrativeText.tsx#L91-L92) |
| 34 | 正确性 | **summary 被原始 JSON 片段永久污染**：`summarizeConversation` 取 assistant 原始输出（整段 JSON）前 120 字进摘要，滚动保留 15 行 → 摘要充满 `{"type": "game_u...` 噪音（与 No.9 同根：喂给摘要前未提取 narration） | 摘要前先 `extractNarration`，与 S1 的 narration-only 管道复用 | [storage.ts#L151-159](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L151-L159) |

### 新增 P3（清理 / 边角）

| No. | 维度 | 问题 | 建议 | 位置 |
|-----|------|------|------|------|
| 35 | 一致性 | `generateId` 降级分支（crypto 不可用）返回 16-17 位 a-z0-9，不符合第一轮 No.1 拟用的 `^[a-f0-9]{20}$` 校验 → 会被误杀 | 实施 No.1 时统一 id 生成（删降级分支）或放宽正则 | [utils.ts#L13-17](file:///Users/belos/code/personal/text-rpg/src/lib/utils.ts#L13-L17) |
| 36 | 健壮性 | LLM 输出重复 choice.id 时 React key 冲突且 `handleChoice` 永远命中第一个；ChoicePanel 按 index 重排显示 A/B/C/D，与实际 id 可能脱节 | zod schema（No.4）中对 choices id 去重/重写 | [ChoicePanel.tsx#L22-34](file:///Users/belos/code/personal/text-rpg/src/components/game/ChoicePanel.tsx#L22-L34) |
| 37 | 抽象 | TitleScreen"新游戏"表单在 `showNewGame` 分支与"无存档"分支重复约 30 行（DRY） | 抽 `NewGameForm` 局部组件 | [TitleScreen.tsx#L54-78](file:///Users/belos/code/personal/text-rpg/src/components/game/TitleScreen.tsx#L54-L78)、[#L142-159](file:///Users/belos/code/personal/text-rpg/src/components/game/TitleScreen.tsx#L142-L159) |
| 38 | 健壮性 | `AI_REASONING` 原样透传给所有 baseURL，DeepSeek 等不支持 `reasoning_effort` 的 API 会 400；temperature 0.9 / max_tokens 4096 硬编码 | 按 baseURL 白名单透传；参数配置化 | [ai.ts#L45-52](file:///Users/belos/code/personal/text-rpg/src/lib/ai.ts#L45-L52) |
| 39 | 健壮性 | `!res.ok` 时对非 JSON 错误响应（如反代 HTML）`res.json()` 二次抛错，玩家看到 "Unexpected token..." | 先 `res.text()` 再尝试 JSON，失败回退状态码文案 | [use-stream-chat.ts#L44-47](file:///Users/belos/code/personal/text-rpg/src/hooks/use-stream-chat.ts#L44-L47) |

### 修复顺序修订（并入第一批）

```
第零批（立即，安全）
  R2 密钥出库 + 轮换
第一批（追加 26/29，均小改动）
  R1 + No.1 + No.3 + 26（空 key 兜底）+ 29（卡死补 else）
第二批（zod，追加 36）
  不变
第三批（体验与记忆，追加 27/28/30/31/34）
  与 No.6/7/8/10 一并处理，32（串行化）与 28 同步做
第四批（测试与清理）
  补 33（useMemo）+ 35/37/38/39
```

### 对第二轮单元测试优先级的补充

新增可测试用例（补进第三节 P0 清单）：
- `appendConversation`：预置损坏 JSON 文件 → 不得清空（验证 27 的修复）
- `summarizeConversation`：输入含原始 JSON 的 assistant 消息 → 摘要不得含 `{"type"`（验证 34）
- 记忆 createdAt：统一 ISO 格式断言（验证 30）
- `getClient`：空 key + 非 tp- 前缀 → 不抛异常（验证 26）
