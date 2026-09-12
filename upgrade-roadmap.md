# upgrade-roadmap — 未来升级路线图

> 前置文档：[bug-fix-todo.md](./bug-fix-todo.md)（43 项审查问题已修复 38 项，5 项记录延后）
> 定位：bug 清零之后的演进方向。每项标注**触发条件**——避免过早优化，达到条件再动手。
> 更新：2026-09-11

---

## 优先级总览

| 方向 | 内容 | 规模 | 触发条件 |
|------|------|------|----------|
| ✅ 1 | SQLite 数据层迁移（2026-09-12） | L | 已完成 |
| ✅ 2 | 生产模式部署（2026-09-12） | S | 已完成 |
| 3 | 长期记忆检索（RAG）——阶段 1 真摘要 ✅ | L | 玩家反馈"AI 忘记早期剧情" |
| 4 | 消息列表虚拟化 | M | 单日消息 >200 或滚动明显卡顿 |
| 5 | 多故事包（D2） | L | 开始创作第二个故事包 |
| ✅ 6 | 调试面板最小版（D4）（2026-09-12） | M | 已完成 |
| ✅ 7 | 真 LLM 摘要（M3）（2026-09-12） | M | 已完成 |
| 8 | 格式化工具链（#22） | S | 团队协作或多设备开发前 |
| ✅ — | 会话增长（#18）（2026-09-12） | — | 已完成 |

---

## ⭐ 1. 数据层迁移：bun:sqlite ✅（2026-09-12 完成）

### 实施要点（与原方案的差异）

- **`bun:sqlite` 必须惰性加载**：构建期 page-data 收集 worker 运行在 Node 下，顶层 import 会导致 `next build` 失败——已通过 `createRequire` 首次调用时加载解决（[db.ts](src/lib/db.ts)）
- **`next` 默认运行在 Node 下**，`bun:sqlite` 加载失败——scripts 已固定 `bun --bun next dev/build/start` 强制 Bun 运行时（package.json）
- `db.exec()` 在新类型中弃用，统一用 `db.run()`
- 顺带修复：LLM 完全失败（如模型服务离线）时空 assistant 消息不再入库污染历史
- 实测：旧 JSON 存档（哈基汪）自动迁移为 `.migrated` 备份；52 测试全绿；生产模式重启持久化验证通过

### 动机（原方案，供回溯）

- **#18 根治**：会话文件全量读写 + 无上限增长 → 追加写入 O(1) + 分页查询
- **历史真分页**：前端"加载更早"从数据库 `LIMIT/OFFSET` 拉取（现在全量读文件）
- **架构统一**：saves / conversations / global-progress 三处存储收敛为一个库
- **查询能力地基**：为真摘要（M3）、记忆检索（RAG）、跨存档统计铺路

### 表设计

```sql
PRAGMA journal_mode = WAL;

CREATE TABLE saves (
  id TEXT PRIMARY KEY,              -- 20 位 hex（校验规则不变）
  slot INTEGER,
  player_name TEXT,
  chapter TEXT,
  day INTEGER,
  updated_at TEXT,
  data TEXT                         -- SaveData 完整 JSON（读档仍是整体读）
);
CREATE INDEX idx_saves_updated ON saves(updated_at DESC);

CREATE TABLE conversations (
  save_id TEXT NOT NULL,
  seq INTEGER NOT NULL,             -- 轮内自增，追加 O(1)
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  day INTEGER,
  chapter TEXT,
  created_at TEXT,
  PRIMARY KEY (save_id, seq)
);
CREATE INDEX idx_conv_save ON conversations(save_id, seq);

CREATE TABLE global_progress (
  key TEXT PRIMARY KEY,             -- 如 ending:ending_dawn_pact
  value TEXT,
  updated_at TEXT
);
```

### 迁移策略

1. 启动时检测 `data/game.db` 不存在 **且** 存在旧 `data/saves/*.json` → 自动导入 → 旧文件改名 `.migrated` 备份
2. `storage.ts` 作为唯一数据入口不变，内部实现从 fs 换成 `bun:sqlite`（调用方零改动）
3. 导入/导出：补 JSON 存档导出/导入 API（配合 C5，保持可移植性）

### 收益边界（诚实预期）

- ✅ 架构健康、长战役写入、历史分页、查询统计（"上一章发生了什么"可 SQL 查）
- ❌ **回 合响应速度无感**——瓶颈是 LLM 推理（秒级），JSON 读写只有毫秒级
- 触发条件达到前不值得做

---

## ⭐ 2. 生产模式部署 ✅（2026-09-12 完成）

生产构建 + `bun start`（已固定 `bun --bun` 强制 Bun 运行时）。实测冷启动 50-92ms，无跨源阻断，局域网直接可玩。后续可选项：`launchd`/`docker-compose` 实现开机即玩。

---

## 3. 长期记忆检索（RAG）——tools/检索的正确用武之地

状态块（背包/关系/标记）保留全量注入是对的（成本低、每回合都需要）；**检索化的对象应该是长期记忆与世界书**：

- **阶段 1（M3 真摘要）** ✅ 已完成（2026-09-12）：每累计 10 条新消息异步一次轻量 LLM 调用，伪摘要+最近 14 条叙述 → 300 字连贯摘要写回 save.summary；实测摘要质量显著优于启发式拼接（详见 [bug-fix-todo.md](./bug-fix-todo.md) 批次 8）
- **阶段 2（记忆归档）**：被 MAX_MEMORIES 裁剪的记忆不丢弃，存入归档表
- **阶段 3（RAG）**：
  - LM Studio 自带 embeddings 端点（如 `text-embedding-nomic-embed-text-v1.5`，已在本地模型列表中）
  - 对话分块 → 向量化 → 存 SQLite（`vec0` 扩展或独立向量表）
  - 每回合按当前场景检索 top-k 相关记忆注入提示词
- **触发条件**：单存档 >100 回合，或玩家反馈"AI 忘记了几十章前的剧情"

---

## 4. 消息列表虚拟化（前端渲染天花板）

已做：消息行 `React.memo`（bb202ef）+ 单日 50 条分页 + "加载更早"。

- **下一步（触发后）**：引入 `react-virtuoso` 做虚拟化列表——任意滚动位置只渲染可视区 ±缓冲，配合动态高度消息完全无分页按钮
- **配合**：SQLite 历史分页 API（`GET /api/conversations?saveId&offset&limit`）
- 触发条件：单日消息 >200，或滚动/流式更新出现可感知卡顿

---

## 5. 多故事包（D2）——兑现"故事引擎"定位

- 结构：`stories/<pack-id>/`（现 game-data 结构整体平移）+ 标题屏故事选择页 + `GET /api/stories`
- 配套：
  - `validate:story` CLI 已就绪（D3），支持 `bun run validate:story stories/<pack-id>` 校验任意包
  - 存档与故事包关联（SaveData 加 `storyId`，跨包隔离）
  - 可选：zip 导入/导出故事包，实现分享
- 触发条件：开始创作第二个故事包时；建议配合 M3/RAG 一起规划（每个包独立的记忆库）

---

## 6. 调试面板（D4）✅ 最小版完成（2026-09-12）

- 已实现：URL 带 `?debug=1` → chat SSE 附带一次性 `debug` 事件（请求消息预览与字符数 / 原始输出 / JSON 解析结果 / 会话总数），前端 [debug-panel.tsx](src/components/game/debug-panel.tsx) 浮层展示
- 后续可扩展（按需）：token 用量（需 stream_options.include_usage）、前缀缓存命中统计、game-data 注入内容查看

---

## 7. 工程化

- [ ] **#22 格式化工具链**：补 oxfmt/prettier 配置（单引号/无分号/2 空格，对齐 AGENTS.md），**单独一次"仅格式化"提交**，不与功能改动混合；组件文件名 kebab-case 规范存废一并决策
- [x] **#18 会话增长** ✅（2026-09-12）：SQLite 追加 O(1) + 查询侧 LIMIT 封顶（chat 路由按需取最近 10/6/14 条）

---

## 8. 灵感池（未排期，随玩随记）

- 道具 ID 白名单进结构化 schema（防模型编造道具，配合 C4 赠送）
- 女主"按地点"动态筛选（比按章节更细粒度，需要 locations 与女主的映射数据）
- 天气/时间系统与场景氛围联动（scene 已回喂，可加环境事件）
- 存档缩略图 / 章节封面（endings 图鉴配图）
- TTS 朗读（LM Studio 无此能力，需外部 TTS 服务）
- 结局图鉴点击查看解锁条件提示

---

## 有意不做（权衡记录，防止反复）

| 决策 | 理由 |
|------|------|
| 状态块（背包/关系/标记）tool 化 | 成本 <300 tokens 且每回合必用；tool 查询多一次本地往返 +1~3s；与 json_schema 结构化输出同请求互斥。检索化的正确对象是长期记忆（见第 3 节） |
| location 枚举化 | 限制叙事自由度（子位置描述），保持自由字符串 |
| 永久死亡 | core-rules.md 已明确本作不设（失败走"长夜将至"结局线可重来） |
| affectionChanges 强制全量回显 | 已改为可选键稀疏输出（e648efd），省 token 且无正确性影响 |
| CI workflow | 用户决策（2026-09-12）：本地个人项目不需要 |
