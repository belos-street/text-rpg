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
| 本批提交 | 批次 2+3+4：状态一致性 5 项、上下文性能 7 项（实测 32k→26k tokens + 前缀缓存友好）、测试基建 47 用例、顺带完成 B1/B4/No.13 |
| 本批提交 | 批次 5+6a 收尾：结构化输出（json_schema 语法层强制合法 JSON + 19 角色ID 白名单）、超时重试、reasoning 白名单、body 校验、B2 scene 回喂、B3 人称统一 |
| 本批提交 | 批次 6b+7+9+8：B5 flags 系统、B6 好感±10 限幅、B7 和睦度规则、B8 章节枚举、#20 槽位自动、C1 重新生成、C2 固定序章、C3 好感反馈、C4 背包赠送、C5 导出、C6 结局图鉴、M1 女主按章筛选、M2 大纲按章注入、D3 校验 CLI、D5 模型文档、批次 9 清理 6 项（#22/#18 延后） |
| 本批提交 | 解耦：prompts.ts 硬编码的「重要规则」8 条全部迁入 core-rules.md（剧情与选项/突破事件/和睦度阈值/第一人称补充），代码提示词只保留引擎契约（输出格式/渲染格式/数据注入） |
| 本批提交 | Bug 修复：C2 固定序章的 SSE 事件 content+done 同包发送，客户端 done 先于 content 处理导致序章被丢弃、空状态提示"输入你的名字"二次出现——服务端分包发送 + 客户端 done 后置；顺带删除标题屏误导性的"需要配置 AI API 密钥"静态提示（浏览器实测复现→修复→验证） |
| 本批提交 | json_schema 优化：affectionChanges 19 个 ID 改为可选键（语法层实测支持稀疏输出）+ choices minItems2/maxItems4 + 数值 minimum 防护 + importance 1-10 + schema 缓存随 config mtime 失效（改配置无需重启）+ 防漂移测试（JSON Schema 与 zod 字段一致性，50 用例全绿） |
| `e4e45a0` | 升级路线图 ⭐1⭐2：SQLite 数据层迁移（自动迁移/会话 O(1) 追加/global-progress 入库）+ 生产模式部署（bun --bun 固定运行时）；顺带修复 LLM 离线时空 assistant 入库 |
| 本批提交 | #18 关账（会话查询侧 LIMIT 封顶）+ M3 真 LLM 摘要（summarySeq 节流、异步不阻塞）+ D4 调试面板最小版（?debug=1）；58 测试全绿。CI workflow 按用户决策不做 |

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

## 批次 2 · 状态一致性 🟡（✅ 已完成）

- [x] **#5 clamp 收敛服务端单点** 🟡 M：`applyStateChanges(save, changes)` helper——hp/mp clamp `[0,max]`、gold ≥0、**day 只增不减**（B6 部分）；SSE 发射与持久化都走该函数
- [x] **#11 onNewItems 状态突变** 🟡 S：immutable 索引替换
- [x] **#8 config 竞态覆盖读档** 🟡 S：`gameStartedRef` 守卫
- [x] **#6 + #7 历史与记忆补 day/chapter** 🟡 M：appendConversation 消息与新建 memories 均带当时 day/chapter
- [x] **#31 Sidebar 无 chapter 记忆在每章节重复** 🟡 S：`(m.chapter || "未知章节")` 严格匹配

---

## 批次 3 · 上下文性能 🟡（✅ 已完成，实测 32k → 26k tokens + 前缀缓存友好）

- [x] **S1 历史压缩为 narration-only**（= No.9）🟡 M：`buildMessages` 对 assistant 历史 `extractNarration`；存储原文不动
- [x] **S2 易变状态后置（救前缀缓存）** 🟡 M：`system(静态) → history → user(状态块+行动)`，静态前缀字节稳定可被 KV cache 命中
- [x] **S3 历史窗口 20 → 10** 🟡 S
- [x] **S4 删除 `trimConversationForTokenLimit` 死代码**（= No.15 部分）⚪ S
- [x] **#17 服务端流式解析节流** ⚪ S：花括号平衡计数，闭合前只跑轻量 narrationPreview
- [x] **#33 parseNarrative 加 useMemo** ⚪ S
- [x] **#21 game-data mtime 缓存** ⚪ S：readMdFile/loadStoryConfig 按 mtime 失效，config 解析失败有日志

---

## 批次 4 · 测试基建 🟡（✅ 已完成，47 用例全绿）

- [x] **affection.test.ts**：阶段边界与非法输入
- [x] **storage.test.ts**：`STORAGE_DATA_DIR` 注入临时目录；裁剪/损坏备份/路径穿越/删除联动全覆盖
- [x] **prompts.test.ts**：S1 历史压缩、S2 消息顺序、关系 ID、B1 玩家名、No.16 无副作用
- [x] **scripts 补全**：`bun test`、`bun run verify`（lint+test+tsc）
- [x] **#34 summary JSON 污染修复**：assistant 消息先 `extractNarration` 再进摘要

---

## 批次 5 · AI 输出可靠性 🟡（✅ 已完成，E2E 实测结构化输出生效）

- [x] **No.10 ai.ts 超时与重试** 🟡 S：`timeout: 120s, maxRetries: 1`
- [x] **D1 结构化输出** 💡 M：`AI_STRUCTURED=auto`（本地端点自动启用）；JSON Schema 动态构建，affectionChanges 的 key **枚举全部合法角色 ID**（语法层根治 No.3 类 bug）；请求失败自动降级普通模式，zod 兜底不变
- [x] **AI_REASONING 透传白名单** ⚪ S：仅本地端点携带 `reasoning_effort`
- [x] **No.14 + #24 API 边界校验** 🟡 S：chat/saves body zod 校验，playerName 限 1-20 字符

---

## 批次 6a · 游戏内容一致性 S（✅ 已完成）

- [x] **B1 玩家名字注入** 💡 S：状态块含 `玩家:{save.playerName}`（随批次 2+3 顺带完成）
- [x] **B2 scene 回喂** 💡 S：`【场景氛围】mood · weather · time` 并入状态块（随本批完成）
- [x] **B3 人称统一** 💡 S：core-rules.md 改为第一人称，与 prompts.ts 一致（随本批完成）
- [x] **B4 删除 R-18 引用** 💡 S：prompts.ts 改为"保持全年龄向的含蓄与美感"（随批次 3 顺带完成）
- [x] **No.13 剩余静默吞错补日志** 🟡 S：listSaves 损坏存档、page.tsx config catch 均已补日志与用户可见提示

## 批次 6b · 游戏系统升级 💡（✅ 已完成）

- [x] **B5 flags 系统** 💡 L：SaveData.flags + config.flags 白名单声明 + 结构化输出语法层限制 key + 状态块展示已激活标记
- [x] **B6 数值硬执法** 💡 S：好感度单回合变化 clamp ±10
- [x] **B7 harmony 玩法回路** 💡 S：提示词声明 <40 摩擦吃醋 / >70 融洽
- [x] **B8 章节枚举化** 💡 M：config.chapters 列表 + applyStateChanges 校验（非法章节忽略）+ 结构化输出 chapter 枚举 + 状态块展示章节列表
- [x] **#20 slot 自动分配** ⚪ S：新存档 slot = 现有最大 +1

---

## 批次 7 · 玩法体验升级 💡（✅ 已完成）

- [x] **C1 重新生成** 💡 M：header 按钮 + `regenerate` 请求（popLastTurn 移除最后一轮重掷；状态以首次生成为准，杜绝增量重复）
- [x] **C2 固定开场序章** 💡 S：config `openingNarration`——新档秒开（实测 0.1s），不走 LLM 冷启动
- [x] **C3 好感度即时反馈** 💡 M：`affectionReason` 字段 + 底部浮动 toast（4s 自动消失）
- [x] **C4 背包赠送** 💡 M：Sidebar 选物品→选角色 → `POST /api/gift`（道具-1、好感+3、写对话记录）
- [x] **C5 导出故事日志** 💡 S：header 导出按钮 → Markdown 下载
- [x] **C6 结局图鉴** 💡 M：`data/global.json` + `GET/POST /api/progress` + game_update `ending` 字段（schema 过滤 "None" 类垃圾值）+ 标题屏展示

---

## 批次 8 · 引擎平台化 💡（✅ 完成，D2 延后）

- [x] **M1 女主档案按场景筛选** 💡 L：`config.chapterHeroines` 每章重点女主 → `loadHeroinesByIds` 按章注入（未配置章节回退全量）
- [x] **M2 主线大纲按章注入** 💡 M：`loadMainQuestForChapter` 提取总纲+当前章节+推进原则（15k → ~2-3k）
- [x] **M3 真 LLM 摘要** ✅（2026-09-12）：`summary.ts`——每累计 10 条新消息（AI_SUMMARY_EVERY 可调）异步执行一次轻量 LLM 调用，伪摘要+最近 14 条叙述 → 300 字连贯摘要 → 写回 save.summary（summarySeq 节流）；不阻塞响应、失败下回合重试、AI_SUMMARY=off 可关
- [ ] **D2 多故事包** ⏸ 延后：架构级改造（stories/<id>/ + 选择页），建议作为独立版本规划
- [x] **D3 game-data 校验 CLI** 💡 S：`bun run validate:story`（94 项检查：文件完整性/config 字段/ID-emoji 一致/章节映射）
- [x] **D4 调试面板（最小版）** ✅（2026-09-12）：URL 带 `?debug=1` 时，chat SSE 追加一次性 debug 事件（请求消息预览与字符数/原始输出/解析结果/会话总数），前端 [debug-panel.tsx](src/components/game/debug-panel.tsx) 浮层展示
- [x] **D5 模型配置文档** 💡 S：README 补充推荐模型/reasoning/结构化输出/前缀缓存说明

---

## 批次 9 · 清理与风格 ⚪（✅ 已完成，#22 延后）

- [x] **#15 剩余死代码**：`GameUpdate.newChoices`、`SaveData.dialogueHistory` 已删（S4 已删 trim 函数）
- [x] **#16 loadGameContext 原地 sort**：随批次 3 重写修复
- [x] **#19 历史恢复逻辑去重**：抽 `applyHistory()` 两处共用
- [x] **#25 applySaveData 参数类型**：改 `SaveData`
- [x] **#23 Sidebar 文案与遮罩**：和睦度文案纠正；遮罩点击关闭侧栏
- [x] **choice.id React key 冲突**：`${choice.id}-${index}` 兜底
- [ ] **#22 格式化工具链** ⏸ 延后：涉及全量重排版与组件文件名规范决策，需单独一次"仅格式化"提交
- [x] **#18 会话无上限增长** ✅（2026-09-12）：SQLite 迁移后追加写入 O(1)（根治）；同批补查询侧封顶——`getConversation(saveId, limit?)`，chat 路由按需取最近 10/6/14 条，读档恢复与导出仍全量

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
