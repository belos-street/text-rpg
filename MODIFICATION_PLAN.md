# Text RPG Pro — 代码与 UI 修改计划

> 基于 `.agents/skills/belos-street/` 编码规范、React/Next.js 最佳实践、Karpathy 编码准则，以及 `.agents/docs/ui-design/modern-dark.md` 设计规范，对当前代码库的全面审查与修改计划。

---

## 一、代码架构问题

### 1.1 page.tsx 是上帝组件（~863 行，最严重）

**文件：** [page.tsx](file:///c:/develop/code/game/text-rpg-pro/src/app/page.tsx)

`GamePage` 组件拥有 **20+ 个 useState**，将游戏状态管理、AI 流式通信、存档管理、UI 渲染全部塞在一个函数中。

**违反：** Karpathy 准则（最小化代码）、React 最佳实践（单一职责）、belos-street 代码组织规范。

**修改方案：** 拆分为 4 个部分——

| 拆出内容 | 目标文件 | 说明 |
|----------|---------|------|
| 20+ useState + 所有状态更新逻辑 | `src/hooks/use-game-state.ts` | 自定义 Hook，管理 playerState/messages/choices/relations/inventory/memories 等 |
| sendMessage/startNewGame/loadSave + 流式 SSE 解析 | `src/hooks/use-stream-chat.ts` | 自定义 Hook，封装 `/api/chat` 流式通信 |
| 标题画面（showTitleScreen 分支，约 200 行 JSX） | `src/components/game/TitleScreen.tsx` | 独立组件 |
| 删除确认 Dialog（重复了两次） | `src/components/game/DeleteConfirmDialog.tsx` | 提取为复用组件 |

拆分后 `page.tsx` 预计缩减到 ~150 行，仅负责组合各组件和 Hook。

---

### 1.2 重复代码：extractNarration / extractChoices

**文件：**
- [page.tsx:L33-L76](file:///c:/develop/code/game/text-rpg-pro/src/app/page.tsx#L33-L76)（客户端版本）
- [chat/route.ts:L15-L42](file:///c:/develop/code/game/text-rpg-pro/src/app/api/chat/route.ts#L15-L42)（服务端版本）

`extractNarration` 和 `extractChoices` 在客户端和服务端各实现了一遍，逻辑几乎相同。

**修改方案：**
- 在 `src/lib/` 下新建 `parser.ts`，导出 `extractNarration`、`extractChoices`、`parseGameUpdate`
- `page.tsx` 和 `chat/route.ts` 统一从 `parser.ts` 导入
- 消除代码重复

---

### 1.3 好感度阶段计算重复

**文件：**
- [page.tsx:L329-L340](file:///c:/develop/code/game/text-rpg-pro/src/app/page.tsx#L329-L340)（内联 if-else 链）
- [chat/route.ts:L179-L193](file:///c:/develop/code/game/text-rpg-pro/src/app/api/chat/route.ts#L179-L193)（同样的 if-else 链）
- [types/index.ts:L127-L143](file:///c:/develop/code/game/text-rpg-pro/src/types/index.ts#L127-L143)（`getAffectionStage` 函数，存在但未被使用）

`getAffectionStage` 已经在 `types/index.ts` 中定义，但 `page.tsx` 和 `chat/route.ts` 都手写了内联版本。

**修改方案：**
- 将 `getAffectionStage` 移到 `src/lib/affection.ts`（该文件已存在，是正确位置）
- `page.tsx` 和 `chat/route.ts` 统一调用 `getAffectionStage(newAffection)`
- 删除 `types/index.ts` 中的 `AFFECTION_STAGES` 常量和 `getAffectionStage` 函数（类型文件不应包含业务逻辑）

---

### 1.4 types/index.ts 混入业务逻辑

**文件：** [types/index.ts:L127-L143](file:///c:/develop/code/game/text-rpg-pro/src/types/index.ts#L127-L143)

`AFFECTION_STAGES` 常量和 `getAffectionStage` 函数是业务逻辑，不应出现在类型定义文件中。

**修改方案：** 移到 `src/lib/affection.ts`。

---

### 1.5 未使用的导入

**文件：** [page.tsx:L3](file:///c:/develop/code/game/text-rpg-pro/src/app/page.tsx#L3)

`Save, Menu, Play, MapPin, Calendar, Heart` 中部分仅在标题画面使用，拆分后主页面不再需要。拆分 TitleScreen 组件时一并清理。

---

### 1.6 InputPanel 使用原生 input 而非 shadcn Input

**文件：** [InputPanel.tsx:L40-L50](file:///c:/develop/code/game/text-rpg-pro/src/components/game/InputPanel.tsx#L40-L50)

使用了原生 `<input>` 元素，但项目已有 `@/components/ui/input` 组件。

**修改方案：** 替换为 shadcn `<Input>` 组件，保持样式一致性。

---

### 1.7 loadGameContext 放在 storage.ts 中不合适

**文件：** [storage.ts:L197-L229](file:///c:/develop/code/game/text-rpg-pro/src/lib/storage.ts#L197-L229)

`loadGameContext` 负责将存档数据格式化为 AI 上下文字符串，属于提示词构建逻辑，不应放在文件 I/O 层。

**修改方案：** 移到 `src/lib/prompts.ts` 中（该文件负责提示词构建）。

---

### 1.8 删除确认 Dialog 重复渲染

**文件：** [page.tsx](file:///c:/develop/code/game/text-rpg-pro/src/app/page.tsx)

`deleteTarget` 确认 Dialog 在标题画面和游戏中各渲染了一次（完全相同的 JSX），应提取为组件复用。

**修改方案：** 提取为 `DeleteConfirmDialog` 组件，两个场景共享。

---

### 1.9 applySaveData 参数类型过长

**文件：** [page.tsx:L183](file:///c:/develop/code/game/text-rpg-pro/src/app/page.tsx#L183)

`applySaveData` 的参数是一个内联的长类型定义。

**修改方案：** 直接使用 `SaveData` 类型（已存在于 `types/index.ts`）。

---

### 1.10 generateId 使用 Math.random

**文件：** [utils.ts:L8-L10](file:///c:/develop/code/game/text-rpg-pro/src/lib/utils.ts#L8-L10)

`Math.random().toString(36)` 生成的 ID 碰撞概率虽然低，但不如 `crypto.randomUUID()` 可靠。项目运行在 Node.js 环境，可以直接使用。

**修改方案：** 替换为 `crypto.randomUUID().slice(0, 12)` 或类似方案。

---

## 二、UI 设计规范问题

> 对照 `.agents/docs/ui-design/modern-dark.md` 设计规范审查。

### 2.1 背景层次缺失（影响全局沉浸感）

**规范要求：** 多层背景叠加——基底渐变 + 噪点纹理 + 浮动光晕 + 网格叠加

**当前现状：** 全局使用纯色 `bg-zinc-950`，无任何渐变/噪点/光晕效果。

**修改方案：**

**globals.css 新增：**
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
}

.bg-scene {
  background: radial-gradient(ellipse_at_top, #0a0a0f 0%, #050506 50%, #020203 100%);
}

.bg-noise {
  background-image: url("data:image/svg+xml,..."); /* SVG noise */
  opacity: 0.015;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: float 8s ease-in-out infinite;
}
```

**layout.tsx 修改：** `<body>` 添加 `bg-scene` 类替代 `bg-zinc-950`。

**影响文件：** `globals.css`、`layout.tsx`、`page.tsx`（标题画面）

---

### 2.2 强调色体系不一致

**规范要求：** accent `#5E6AD2`（indigo）为主强调色，fuchsia 保留用于情感化元素。

**当前现状：** `globals.css` 中 `--primary: #d946ef`（fuchsia），全局所有交互元素都使用 primary。

**修改方案：**
- `globals.css` 中 `--primary` 改为 `#5E6AD2`
- 好感度进度条、和睦度条等情感化元素保留使用 fuchsia/pink（已在组件中硬编码 `bg-pink-500`）
- 流式光标从 `bg-primary/70` 改为 `bg-primary/70`（自动跟随 primary 变化）
- 聚焦环从 `ring-primary/50` 改为 `ring-primary/50`（自动跟随）

**影响文件：** `globals.css`、所有使用 `text-primary`/`bg-primary` 的组件

---

### 2.3 animate-bounce 违反禁止事项

**文件：** [page.tsx:L776-L780](file:///c:/develop/code/game/text-rpg-pro/src/app/page.tsx#L776-L780)

"思考中"加载指示器使用了 `animate-bounce`，规范明确禁止弹跳动画。

**修改方案：** 改为 `animate-pulse` 或自定义淡入淡出动画。

---

### 2.4 卡片缺少多层阴影

**规范要求：** 所有凸起元素使用 3-4 层阴影叠加

**当前现状：** 所有卡片（标题画面、存档槽位、侧边栏卡片、对话框）仅使用 `border border-zinc-800`，无阴影。

**修改方案：** 为以下组件添加多层阴影——

| 组件 | 当前 | 目标 |
|------|------|------|
| 标题画面卡片 | `border border-zinc-800 rounded-2xl bg-zinc-900/50` | + `shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4),0_0_40px_rgba(0,0,0,0.2)]` |
| 存档卡片 (SaveSlot) | `bg-zinc-900/50 border-zinc-800` | 同上 |
| 侧边栏角色卡片 | `border border-zinc-800 bg-zinc-900/50` | 同上 |
| Dialog | `bg-zinc-950 border-zinc-800` | 同上 |
| 消息气泡 | `bg-zinc-800/50 border border-zinc-700/50` | 可选添加轻微阴影 |

**影响文件：** `page.tsx`、`SaveSlot.tsx`、`Sidebar.tsx`、`dialog.tsx`

---

### 2.5 Button 缺少规范交互效果

**规范要求：** 按下态 `scale-[0.98]`、内高光、accent 光晕

**当前现状：** [button.tsx](file:///c:/develop/code/game/text-rpg-pro/src/components/ui/button.tsx) 的 `default` variant 仅 `shadow hover:bg-primary/90`，缺少规范效果。

**修改方案：**
```tsx
default: "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:bg-primary/90 active:scale-[0.98]"
```

**影响文件：** `button.tsx`

---

### 2.6 输入框聚焦环颜色

**文件：** [InputPanel.tsx:L48](file:///c:/develop/code/game/text-rpg-pro/src/components/game/InputPanel.tsx#L48)

当前使用 `focus:ring-primary/50`。规范要求 accent 色聚焦环 + `ring-offset-2 ring-offset-background`。

**修改方案：**
```
focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background
```

---

### 2.7 侧边栏移动端响应式缺失

**规范要求：** `< 768px` 时侧边栏应为覆盖模式（overlay），带 backdrop-blur。

**当前现状：** [Sidebar.tsx](file:///c:/develop/code/game/text-rpg-pro/src/components/game/Sidebar.tsx) 仅通过 `if (!open) return null` 控制显示，无移动端覆盖模式。

**修改方案：**
- 移动端（`< md`）：侧边栏使用 `fixed inset-0 z-50` + 半透明遮罩
- 桌面端（`≥ md`）：保持当前 `border-l` 并列布局
- 点击遮罩关闭侧边栏

**影响文件：** `Sidebar.tsx`、`page.tsx`

---

### 2.8 标题画面缺少光晕效果

**规范要求：** 浮动光晕（900-1400px 渐变色块，8-10s 缓动动画）

**当前现状：** 标题画面是纯黑背景。

**修改方案：** 在标题画面容器中添加 1-2 个浮动光晕元素：
```html
<div class="orb w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(94,106,210,0.08)_0%,transparent_70%)] top-[-20%] left-[-10%]" />
```

**影响文件：** `page.tsx`（标题画面部分）或新提取的 `TitleScreen.tsx`

---

### 2.9 状态栏 HP/MP 缺少规范渐变

**规范要求：** HP 渐变色条（绿→黄→红），MP（蓝→紫）

**当前现状：** [StatusBar.tsx](file:///c:/develop/code/game/text-rpg-pro/src/components/game/StatusBar.tsx) 使用固定色（红/橙/红），无渐变。

**修改方案：** HP 使用 `bg-gradient-to-r from-green-500 via-yellow-500 to-red-500` 并通过 `background-size` + `background-position` 实现根据百分比动态渐变效果。

**影响文件：** `StatusBar.tsx`

---

### 2.10 消息入场动画缺失

**规范要求：** 消息入场 `opacity 0→1, y 24px→0`，子元素间隔 `0.08s`

**当前现状：** 消息直接出现，无入场动画。

**修改方案：** 在 `globals.css` 中添加 `animate-message-in` 动画，应用于消息气泡容器。

**影响文件：** `globals.css`、`ChatPanel.tsx`

---

### 2.11 ChoicePanel 按钮缺少悬停光晕

**规范要求：** 悬停时边框变为 accent 色并带光晕

**当前现状：** 使用 shadcn 默认 Button variant，无 accent 光晕效果。

**修改方案：** ChoicePanel 的按钮添加 `hover:shadow-[0_0_20px_rgba(94,106,210,0.15)]` 效果。

**影响文件：** `ChoicePanel.tsx`

---

### 2.12 animate-pulse 覆盖问题

**文件：** [globals.css:L82-L84](file:///c:/develop/code/game/text-rpg-pro/src/app/globals.css#L82-L84)

自定义的 `animate-pulse` 覆盖了 Tailwind 默认的 pulse 动画（仅在本组件内生效），可能导致其他地方使用 `animate-pulse` 时行为不符预期。

**修改方案：** 重命名为自定义动画名 `animate-cursor-blink`，避免与 Tailwind 内置冲突。

**影响文件：** `globals.css`、`ChatPanel.tsx`

---

## 三、修改优先级

### P0 — 架构级重构（影响可维护性）

| # | 任务 | 涉及文件 | 工作量 |
|---|------|---------|--------|
| 1 | 拆分 page.tsx 上帝组件 | `page.tsx` → `use-game-state.ts` + `use-stream-chat.ts` + `TitleScreen.tsx` + `DeleteConfirmDialog.tsx` | 大 |
| 2 | 提取公共 parser 到 `src/lib/parser.ts` | 新建 `parser.ts`，修改 `page.tsx`、`chat/route.ts` | 中 |
| 3 | 好感度逻辑统一到 `affection.ts` | 修改 `affection.ts`、`page.tsx`、`chat/route.ts`、`types/index.ts` | 小 |
| 4 | `loadGameContext` 移到 `prompts.ts` | 修改 `storage.ts`、`prompts.ts` | 小 |

### P1 — UI 设计规范对齐（影响视觉一致性）

| # | 任务 | 涉及文件 | 工作量 |
|---|------|---------|--------|
| 5 | 强调色体系迁移（fuchsia → indigo） | `globals.css` | 小 |
| 6 | 背景层次系统（渐变 + 噪点 + 光晕） | `globals.css`、`layout.tsx` | 中 |
| 7 | 卡片多层阴影 | `page.tsx`、`SaveSlot.tsx`、`Sidebar.tsx`、`dialog.tsx` | 中 |
| 8 | Button 交互效果规范化 | `button.tsx` | 小 |
| 9 | 消息入场动画 | `globals.css`、`ChatPanel.tsx` | 小 |
| 10 | 修复 animate-bounce 违规 | `page.tsx` | 小 |
| 11 | animate-pulse 重命名避免冲突 | `globals.css`、`ChatPanel.tsx` | 小 |

### P2 — 体验优化（影响移动端和细节）

| # | 任务 | 涉及文件 | 工作量 |
|---|------|---------|--------|
| 12 | 侧边栏移动端覆盖模式 | `Sidebar.tsx`、`page.tsx` | 中 |
| 13 | 标题画面光晕效果 | `page.tsx` 或 `TitleScreen.tsx` | 小 |
| 14 | StatusBar HP/MP 渐变优化 | `StatusBar.tsx` | 小 |
| 15 | ChoicePanel 悬停光晕 | `ChoicePanel.tsx` | 小 |
| 16 | InputPanel 改用 shadcn Input | `InputPanel.tsx` | 小 |
| 17 | 输入框聚焦环规范化 | `InputPanel.tsx` | 小 |

### P3 — 清理与收尾

| # | 任务 | 涉及文件 | 工作量 |
|---|------|---------|--------|
| 18 | 清理未使用的导入 | `page.tsx`（拆分后自然解决） | 小 |
| 19 | applySaveData 参数类型简化 | `page.tsx` | 小 |
| 20 | generateId 改用 crypto | `utils.ts` | 小 |

---

## 四、建议执行顺序

```
第一阶段（架构）：1 → 2 → 3 → 4
    ↓
第二阶段（样式）：5 → 6 → 7 → 8 → 9 → 10 → 11
    ↓
第三阶段（体验）：12 → 13 → 14 → 15 → 16 → 17
    ↓
第四阶段（清理）：18 → 19 → 20
```

先完成架构拆分（P0），因为后续样式修改会涉及同样文件，避免在 863 行的巨型文件上反复冲突。
