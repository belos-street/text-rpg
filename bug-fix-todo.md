# bug-fix-todo — 分批执行清单

> 来源：2026-09-10 两轮代码审查 + 业务/产品设计审查 + 上下文性能分析
> 图例：✅ 已完成 ｜ 🔴 P1 必修 ｜ 🟡 P2 重要 ｜ ⚪ P3 可选 ｜ 💡 升级建议
> 规模：S（<1h）/ M（半天）/ L（1-2 天）
> 约定：**一个批次 = 一次独立提交**，批内任务无相互依赖，可随时从任意未完成批次开始

---

## ✅ 已完成

| 提交 | 内容 |
|------|------|
| `e2e28e4` | R2：`.env.local` 移出版本控制 + 恢复 gitignore 规则 |
| `82249a8` | 第一批：R1 持久化静默吞错、No.1 路径穿越、No.2 流式增量重复、No.3 好感度 ID、No.4 JSON 三道闸（zod + parser 重写）、No.12 围栏提取、parser 测试 20 用例 |
| `06e7861` | 批次 1：#26 空 key、#27 会话损坏备份、#28 停止竞态、#29 两处卡死、#30 时间戳 ISO、#32 写队列、generateId 降级兼容 hex20 |

---

## 📋 批次总览

| 批次 | 主题 | 条目 | 规模 | 风险 |
|------|------|------|------|------|
| 1 | 稳定性热修（数据丢失/卡死/竞态） | 6 | S×6 | 低 |
| 2 | 状态一致性（双写漂移收敛） | 5 | S-M | 低 |
| 3 | 上下文性能（32k→15k tokens） | 7 | S-M | 中（动 prompts） |
| 4 | 测试基建 | 4 | M | 低 |
| 5 | AI 输出可靠性（结构化输出） | 3 | M | 中 |
| 6a | 游戏内容一致性（提示词修正） | 5 | S | 低 |
| 6b | 游戏系统升级（flags/硬执法） | 5 | L | 中 |
| 7 | 玩法体验升级 | 6 | M×6 | 中 |
| 8 | 引擎平台化 | 7 | L | 高 |
| 9 | 清理与风格 | 7 | S | 低 |

---

## 批次 1 · 稳定性热修 🔴（✅ 已完成）

- [x] **#26 留空 API key 必崩** 🔴 S
  - 位置：[ai.ts#L8-24](file:///Users/belos/code/personal/text-rpg/src/lib/ai.ts#L8-L24)
  - 改法：`opts.apiKey = apiKey || "local-model"`（本地服务不校验 key）；同步修正 [.env.example](file:///Users/belos/code/personal/text-rpg/.env.example) 里"留空即可"的误导注释
- [x] **#29 两处入口永久卡死** 🔴 S
  - 位置：[page.tsx#L311-332](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L311-L332)、[page.tsx#L209-246](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L209-L246)
  - 改法：两处 `if (data.save)` 补 else——`res.ok` 检查 + `onError` 提示 + `isLoading/savesLoading` 复位
- [x] **#27 会话损坏 = 历史全灭** 🔴 S
  - 位置：[storage.ts#L138-160](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts#L138-L160)
  - 改法：`getConversation` 解析失败时先把损坏文件改名备份（`{id}.corrupt-{ts}.json`）+ console.error，再返回 `[]`，避免 append 整体覆写
- [x] **#28 停止按钮竞态** 🔴 S
  - 位置：[use-stream-chat.ts#L142-146](file:///Users/belos/code/personal/text-rpg/src/hooks/use-stream-chat.ts#L142-L146)
  - 改法：`stop()` 只调 `abort()` 不手动解锁（统一由 finally 解锁）；配合下方写队列消除服务端竞态窗口
- [x] **#32 存档无并发控制** 🔴 S
  - 位置：[storage.ts](file:///Users/belos/code/personal/text-rpg/src/lib/storage.ts)
  - 改法：模块级 `Map<id, Promise>` 写队列，把 `updateSave`/`appendConversation` 按 id 串行化（约 10 行，同时收窄 #28 的竞态窗口）
- [x] **#30 记忆时间戳时区混存** 🟡 S
  - 位置：route.ts 手拼 `YYYY-MM-DDTHH:mm:ss` 处
  - 改法：改用 `new Date().toISOString()`，与客户端格式统一
- [x] **顺带：generateId 降级分支兼容 hex20** ⚪ S
  - 位置：[utils.ts](file:///Users/belos/code/personal/text-rpg/src/lib/utils.ts)
  - 改法：crypto 不可用时的降级路径同样输出 20 位 hex，与 No.1 的 id 校验正则兼容

---

## 批次 2 · 状态一致性 🟡（消灭双写漂移）

- [ ] **#5 clamp 收敛服务端单点** 🟡 M
  - 位置：[route.ts#L138-141](file:///Users/belos/code/personal/text-rpg/src/app/api/chat/route.ts#L138-L141)
  - 改法：抽 `applyStateChanges(save, changes)` helper——hp/mp clamp `[0,max]`、gold ≥0、**day 只增不减**（顺带实现 B6 一半）；客户端 [page.tsx#L125-141](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L125-L141) 改为纯展示
- [ ] **#11 onNewItems 状态突变** 🟡 S
  - 位置：[page.tsx#L158-171](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L158-L171)
  - 改法：`existing.quantity += 1` 改为 immutable map 返回新对象
- [ ] **#8 config 竞态覆盖读档** 🟡 S
  - 位置：[page.tsx#L187-204](file:///Users/belos/code/personal/text-rpg/src/app/page.tsx#L187-L204)
  - 改法：`gameStartedRef` 守卫——已开局则跳过 initialState 应用
- [ ] **#6 + #7 历史与记忆补 day/chapter** 🟡 M
  - 位置：route.ts 持久化块
  - 改法：`appendConversation` 存入当时的 day/chapter；服务端写 memories 时从 save 补全（修好重载后"按天回看"）
- [ ] **#31 Sidebar 无 chapter 记忆在每章节重复** 🟡 S（依赖上一条）
  - 位置：[Sidebar.tsx#L67](file:///Users/belos/code/personal/text-rpg/src/components/game/Sidebar.tsx#L67)
  - 改法：去掉 `(m.chapter ?? chapter)` 的宽容匹配，无 chapter 归入当前存档章节

---

## 批次 3 · 上下文性能 🟡（32k → ~15k tokens，方案详见附录 D）

- [ ] **S1 历史压缩为 narration-only**（= No.9）🟡 M
  - 位置：[prompts.ts#L172-182](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L172-L182)
  - 改法：`buildMessages` 喂历史前对 assistant 消息 `extractNarration`；存储原文不动（选项恢复依赖）
- [ ] **S2 易变状态后置（救前缀缓存）** 🟡 M
  - 改法：消息序列改为 `system(静态规则) → history → system(当前状态) → user`，静态层字节稳定可被 LM Studio KV cache 命中
- [ ] **S3 历史窗口 20 → 10** 🟡 S
- [ ] **S4 删除 `trimConversationForTokenLimit` 死代码**（= No.15 部分）⚪ S
- [ ] **#17 服务端流式解析节流** ⚪ S
  - 改法：`{`/`}` 计数不平衡时跳过 parseGameUpdate
- [ ] **#33 parseNarrative 加 useMemo** ⚪ S
  - 位置：[NarrativeText.tsx#L92](file:///Users/belos/code/personal/text-rpg/src/components/game/NarrativeText.tsx#L92)
- [ ] **#21 game-data mtime 缓存** ⚪ S
  - 位置：[game-data.ts](file:///Users/belos/code/personal/text-rpg/src/lib/game-data.ts)；按文件 mtime 失效，保住 dev 热更新

---

## 批次 4 · 测试基建 🟡（parser 已有 20 用例 ✅）

- [ ] **affection.test.ts**：阶段边界 20/21/60/61/95/96/100/NaN/越界
- [ ] **storage.test.ts**：临时目录注入；create/list/update 记忆裁剪/delete 联动/损坏 JSON/非法 id 被拒（验证 No.1）
- [ ] **prompts.test.ts**：buildMessages 消息顺序（验证 S2）、历史压缩、关系段含 ID
- [ ] **scripts 补全**：`"test": "bun test"`、`"verify": "bun run lint && bun test && bunx tsc --noEmit"`
- [ ] **#34 summary JSON 污染修复**（与测试同批做）：`summarizeConversation` 对 assistant 消息先 `extractNarration` 再截断

---

## 批次 5 · AI 输出可靠性 🟡

- [ ] **No.10 ai.ts 超时与重试** 🟡 S
  - 改法：`new OpenAI({ baseURL, timeout: 60_000, maxRetries: 1 })`——本地模型 JIT 冷启动不再表现为无限"思考中"
- [ ] **D1 结构化输出** 💡 M
  - 改法：LM Studio OpenAI 兼容接口支持 `response_format: { type: "json_schema" }`——用 zod schema 生成 JSON Schema（zod v4 内置 `z.toJSONSchema`）在语法层强制合法输出；env 开关 `AI_STRUCTURED=auto`（本地开、云端探测），zod 保留为最后防线
- [ ] **AI_REASONING 透传白名单** ⚪ S（第二轮 P3 未验证项）
  - 改法：仅当 baseURL 为本地地址时携带 `reasoning_effort`，防云端 400
- [ ] **No.14 + #24 API 边界校验** 🟡 S
  - 改法：chat/saves 路由 body 用 zod 校验（复用 schema.ts）；playerName 限 20 字符

---

## 批次 6a · 游戏内容一致性 S（纯提示词/文案，立竿见影）

- [ ] **B1 玩家名字注入** 💡 S：`loadGameContext` 玩家状态行加 `玩家：{save.playerName}`——现在 AI 根本不知道主角叫什么
- [ ] **B2 scene 回喂** 💡 S：氛围/天气并入状态段或 StatusBar，终结死数据闭环
- [ ] **B3 人称统一** 💡 S：core-rules.md 第二人称 vs prompts.ts 第一人称矛盾，二选一（建议第一人称，改 core-rules.md）
- [ ] **B4 删除 R-18 引用** 💡 S：[prompts.ts#L147](file:///Users/belos/code/personal/text-rpg/src/lib/prompts.ts#L147) 引用了不存在的规则
- [ ] **No.13 剩余静默吞错补日志** 🟡 S：listSaves 损坏存档、page.tsx config catch

## 批次 6b · 游戏系统升级 💡（动 schema，依赖 6a）

- [ ] **B5 flags 系统** 💡 L：SaveData 加 `flags: Record<string, boolean|number>`，game_update 允许 LLM 设置 flag；10 章主线的过关条件/支线触发有了结构化依托
- [ ] **B6 数值硬执法** 💡 S：好感度单回合变化 clamp ±10（其余在批次 2 #5 已做）
- [ ] **B7 harmony 玩法回路** 💡 S：提示词声明效果（和睦度 <40 触发吃醋事件）或砍掉
- [ ] **B8 章节枚举化** 💡 M：config 预定义章节列表，LLM 只能选不能造；修复章节树因"第2章/第二章"分裂
- [ ] **#20 slot 半成品决策** ⚪ S：实现槽位选择或删字段

---

## 批次 7 · 玩法体验升级 💡

- [ ] **C1 重新生成按钮** 💡 M：复用 saveId 不追加消息重发；配合回滚（删最后一轮+回滚状态）。LLM 游戏刚需，最高优先
- [ ] **C2 固定开场序章** 💡 S：config 加 `openingNarration`，开局不走 5 万 token 的 LLM 冷启动
- [ ] **C3 好感度即时反馈** 💡 M：game_update 加 `affectionReason`，前端浮动提示"+2 莉娅（帮她捡起义诊箱）"
- [ ] **C4 背包赠送** 💡 M：选物品+选角色 → 好感度判定，打通背包→养成闭环
- [ ] **C5 导出故事日志** 💡 S：conversations JSON → Markdown 下载，社交传播
- [ ] **C6 结局图鉴** 💡 M：`data/global.json` 跨存档记录已解锁结局/已攻略角色，标题屏展示

---

## 批次 8 · 引擎平台化 💡（依赖批次 6b）

- [ ] **M1 女主档案按场景筛选** 💡 L：按当前章节重点女主注入 3-5 人（静态层 42k → 8-12k）
- [ ] **M2 主线大纲按章注入** 💡 M：只注入当前章节概要+推进原则（15k → ~2k）
- [ ] **M3 真 LLM 摘要** 💡 M：每 N 回合替换伪 summary
- [ ] **D2 多故事包** 💡 L：`stories/<pack-id>/` + 标题屏故事选择页——兑现"故事引擎"定位
- [ ] **D3 game-data 校验 CLI** 💡 S：`bun run validate:story` 检查 config 完整性、ID/emoji 一致性
- [ ] **D4 调试面板** 💡 M：展示最终提示词/原始返回/解析结果/token 用量
- [ ] **D5 模型配置文档** 💡 S：推荐模型、reasoning 档位、上下文要求写进 README

---

## 批次 9 · 清理与风格 ⚪

- [ ] **#15 剩余死代码**：`GameUpdate.newChoices`、`SaveData.dialogueHistory`（S4 已删 trim 函数）
- [ ] **#16 loadGameContext 原地 sort**：改 `[...save.memories].sort()`
- [ ] **#19 历史恢复逻辑去重**：page.tsx 两处 30 行重复抽 `restoreHistory()`
- [ ] **#25 applySaveData 参数类型**：内联形状改 `SaveData`
- [ ] **#23 Sidebar 文案与遮罩**：和睦度文案纠正；遮罩点击关闭侧栏
- [ ] **choice.id React key 冲突**（第二轮 P3）：[ChoicePanel.tsx#L24](file:///Users/belos/code/personal/text-rpg/src/components/game/ChoicePanel.tsx#L24) 改用 `${choice.id}-${index}` 兜底重复 id
- [ ] **#22 格式化工具链**：补 oxfmt/prettier 配置；决策组件文件名 kebab-case 规范存废
- [ ] **#18 会话文件无上限增长**：分片或归档（长战役才明显，可延后）

---

## 附录 A · 上下文性能实测（批次 3 依据）

| 层 | 内容 | 截断方式 | 实测大小 |
|----|------|----------|----------|
| 静态层 | 核心规则+主角+**19 女主全量**+好感表+地图 | 不截断，每回合重发 | 42,266 字符 ≈ 21k tokens |
| 状态层 | summary+状态+好感+背包+记忆(前15) | 记忆上限 20 | ~2k 字符 |
| 历史层 | 最近 20 条对话 | `slice(-20)` 按条数 | 满载 ~20k 字符 ≈ 10k tokens |

- 稳态 ≈ **32k tokens/回合**；assistant 原始 JSON 约 2,038 字符/条，narration 仅占 74%
- 越玩越慢根因：①前 20 轮历史线性增长；②易变状态拼在 system 尾部破坏前缀 KV 缓存；③原始 JSON 回喂 + summary 与窗口重复；④流式 O(n²) 解析
- 预期：批次 3 后 ~15k → 批次 8（M1/M2）后 ~6-8k；前缀缓存命中后每回合实际新增 prefill 1-2k tokens

## 附录 B · 业务/产品设计要点（批次 6-8 依据）

- **内容与引擎脱节**（已在修复记录中明确）：`loadMainQuest/loadNPCs/loadWorldSetting/loadItems/loadCombatTable` 等加载函数从未被调用——主线大纲、NPC、世界观、道具、战斗表都没进提示词；批次 6-8 的分层注入解决
- **B 系列设计缺陷**：B1 玩家名未注入 / B2 scene 死数据 / B3 人称矛盾 / B4 幽灵 R-18 规则 / B5 无 flags / B6 判定表软约束 / B7 harmony 装饰化 / B8 章节自由字符串
- **C 系列体验**：重新生成是刚需；开局冷启动伤第一印象；好感度反馈是多巴胺回路；导出是传播引擎；结局图鉴给复玩理由
- **D 系列平台化**：结构化输出一劳永逸；多故事包兑现引擎定位；校验 CLI 与调试面板服务创作者

## 附录 C · 原始审查证据索引

<details>
<summary>第一轮 25 项（R1✅、No.1-4✅、No.12✅ 已修复，其余并入批次）</summary>

- R1 静默吞错 route.ts#L234 ✅ ｜ No.1 路径穿越 storage.ts ✅ ｜ No.2 增量重复 route.ts ✅ ｜ No.3 好感度 ID prompts.ts ✅ ｜ No.4 JSON 零校验 parser.ts ✅（引入 zod）
- No.5 clamp 双写→批次2 ｜ No.6/7 day-chapter→批次2 ｜ No.8 config 竞态→批次2 ｜ No.9 历史 JSON 回喂→批次3(S1) ｜ No.10 ai.ts 超时→**待安排**（建议并入批次5）｜ No.11 mutation→批次2 ｜ No.12 围栏提取✅ ｜ No.13 日志→批次1/4/6a 分摊 ｜ No.14 边界校验→批次5
- No.15 死代码→批次3(S4)/9 ｜ No.16 sort→批次9 ｜ No.17 O(n²)→批次3 ｜ No.18 会话增长→批次9 ｜ No.19 重复逻辑→批次9 ｜ No.20 slot→批次6b ｜ No.21 缓存→批次3 ｜ No.22 风格→批次9 ｜ No.23 Sidebar→批次9 ｜ No.24 长度→批次5 ｜ No.25 类型→批次9
</details>

<details>
<summary>第二轮 15 项（R2✅、其余 #26-34 已并入批次 1-4）</summary>

- R2 .env.local 入库 ✅（e2e28e4）｜ #26 空 key→批次1 ｜ #27 会话覆写→批次1 ｜ #28 停止竞态→批次1 ｜ #29 卡死→批次1
- #30 时区→批次1 ｜ #31 Sidebar→批次2 ｜ #32 并发→批次1 ｜ #33 memo→批次3 ｜ #34 summary 污染→批次4
- P3：generateId 降级分支→批次1 顺带确认（No.1 正则依赖 hex20）｜ choice.id key→批次7 顺带 ｜ AI_REASONING 白名单→批次5
</details>
