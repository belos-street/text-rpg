# upgrade-roadmap — 未来升级路线图

> 前置文档：[bug-fix-todo.md](./bug-fix-todo.md)（43 项审查问题已修复 38 项，5 项记录延后）
> 定位：bug 清零之后的演进方向。每项标注**触发条件**——避免过早优化，达到条件再动手。
> 更新：2026-09-11

---

## 优先级总览

| 方向 | 内容 | 规模 | 触发条件 |
|------|------|------|----------|
| ⭐ 1 | SQLite 数据层迁移 | L | 单存档 >300 回合 / 存档 >5 个 / 需要历史分页 |
| ⭐ 2 | 生产模式部署 | S | 局域网多人稳定游玩需求 |
| 3 | 长期记忆检索（RAG） | L | 玩家反馈"AI 忘记早期剧情" |
| 4 | 消息列表虚拟化 | M | 单日消息 >200 或滚动明显卡顿 |
| 5 | 多故事包（D2） | L | 开始创作第二个故事包 |
| 6 | 调试面板（D4） | M | 内容创作/提示词调优频繁时 |
| 7 | 真 LLM 摘要（M3） | M | RAG 落地前的过渡或配合 RAG 一起做 |
| 8 | 格式化工具链（#22） | S | 团队协作或多设备开发前 |
| — | 会话文件增长（#18） | — | SQLite 落地后自动解决 |

---

## ⭐ 1. 数据层迁移：bun:sqlite

### 动机

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

## ⭐ 2. 生产模式部署（最便宜的正确方案）

开发服务器（`bun dev`）有跨源限制（已用 `allowedDevOrigins` 缓解）、无缓存优化、按需编译。

```bash
bun run build && bun start   # 生产模式无跨源阻断，性能与稳定性全面优于 dev
```

- 规模 S，**局域网稳定游玩的正解**——如果 LAN 模式是长期需求，优先做这个而不是继续给 dev 打补丁
- 可选：加 `systemd`/`launchd` 服务或 `docker-compose`，实现"开机即玩"

---

## 3. 长期记忆检索（RAG）——tools/检索的正确用武之地

状态块（背包/关系/标记）保留全量注入是对的（成本低、每回合都需要）；**检索化的对象应该是长期记忆与世界书**：

- **阶段 1（M3 真摘要）**：每 N 回合用一次 LLM 调用把旧对话压缩成高质量段落替换伪 summary
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

## 6. 调试面板（D4）——内容创作者效率工具

- 展示：最终提示词（含状态块）/ 模型原始返回 / JSON 解析结果 / token 用量 / 前缀缓存命中
- 最小实现：`?debug=1` 时 SSE 附加一次性 `debug` 事件（服务端已持有全部信息），前端浮层展示
- 触发条件：开始频繁调优 game-data 内容或提示词时

---

## 7. 工程化

- [ ] **#22 格式化工具链**：补 oxfmt/prettier 配置（单引号/无分号/2 空格，对齐 AGENTS.md），**单独一次"仅格式化"提交**，不与功能改动混合；组件文件名 kebab-case 规范存废一并决策
- [ ] **CI**：GitHub Actions 跑 `bun run verify`（lint + test + tsc）——脚本已就绪，只差 workflow 文件
- [ ] **#18 会话增长**：SQLite 落地后自动解决；在此之前长战役玩家可手动删除旧存档

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
