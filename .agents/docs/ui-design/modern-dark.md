# Text RPG Pro - UI 设计规范

> 基于 Linear / Modern Dark 设计风格，专为沉浸式文字冒险游戏引擎定制。

---

## 设计哲学

**"深夜桌面应用讲故事"**——深色背景中浮动着柔和的光晕，文字是主角，界面是安静的画框。

核心原则：
- **精密**：每个阴影有三层，每个动画用 expo-out 缓动，没有任意选择
- **深度**：表面存在于三维空间，通过柔和的环境光营造层次
- **沉浸**：交互即时精准，像使用原生桌面应用而非网页
- **留白**：大量阅读场景下，呼吸感比炫技更重要

Tech Stack: Next.js 16 + Tailwind CSS + shadcn/ui + Radix UI + lucide-react

---

## Design Token System

### 色彩系统

深空底色 + 单一饱和强调色。深度来自半透明层叠，而非硬阴影。

**背景层：**

| Token | 值 | 用途 |
|:------|:------|:------|
| `--background` | `#09090b` | 主画布（globals.css 中定义） |
| `background-deep` | `#020203` | 最深层——页脚、叠底 |
| `background-elevated` | `#0a0a0c` | 抬升面——侧边栏、弹窗 |

**表面层：**

| Token | 值 | 用途 |
|:------|:------|:------|
| `surface` | `rgba(255,255,255,0.05)` | 卡片、消息气泡 |
| `surface-hover` | `rgba(255,255,255,0.08)` | 悬停态 |

**文字层：**

| Token | 值 | 用途 |
|:------|:------|:------|
| `foreground` | `#EDEDEF` | 主文字 |
| `foreground-muted` | `#8A8F98` | 描述、元数据、数值标签 |
| `foreground-subtle` | `rgba(255,255,255,0.60)` | 占位符、辅助文字 |

**强调色（当前项目）：**

| Token | 值 | 用途 |
|:------|:------|:------|
| `primary` | `#d946ef`（fuchsia） | 当前主题强调色 |
| `accent` | `#5E6AD2`（indigo） | 目标设计方向的强调色 |
| `accent-bright` | `#6872D9` | accent 悬停态 |
| `accent-glow` | `rgba(94,106,210,0.3)` | 光晕效果 |

> **迁移说明：** 当前项目使用 fuchsia 作为 primary。逐步将交互高亮迁移到 indigo 体系，fuchsia 保留用于好感度/关系系统等情感化元素。

**边框：**

| Token | 值 | 用途 |
|:------|:------|:------|
| `border-default` | `rgba(255,255,255,0.06)` | 细线边框 |
| `border-hover` | `rgba(255,255,255,0.10)` | 悬停态边框 |
| `border-accent` | `rgba(94,106,210,0.30)` | 强调边框 |

**语义色（用于特定系统）：**

| 色值 | 用途 | Tailwind |
|:------|:------|:------|
| `#ef4444` / `#dc2626` | HP 生命值 | `red-500` / `red-600` |
| `#3b82f6` | MP 魔力值 | `blue-500` |
| `#eab308` / `#f59e0b` | 金币 | `yellow-500` / `amber-500` |
| `#e879f9` / `#ec4899` | 好感度/和睦度 | `fuchsia-400` / `pink-500` |
| `#fbbf24` | 叙事-对话 | `amber-200` |
| `#67e8f9` | 叙事-强调（角色名/道具） | `cyan-300` |

---

### 背景层次系统

背景不是纯色，而是多层叠加营造深度：

**Layer 1 — 基底渐变：**
```
bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]
```

**Layer 2 — 噪点纹理：**
SVG noise，`opacity: 0.015`，防止色带断层。

**Layer 3 — 浮动光晕：**
大尺寸（900-1400px）、重度模糊的渐变色块，营造"呼吸感"光池：
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
}
/* Duration: 8-10s, ease-in-out, infinite */
```

**Layer 4 — 网格叠加：**
64px 网格，`opacity: 0.02`，增添技术感。

> **游戏场景建议：** 背景光晕色可根据当前场景/章节变换——森林场景偏绿，城堡偏金，夜晚偏蓝紫。通过 CSS 变量实现动态切换。

---

## Typography

### 字体栈

```css
--font-sans: "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace;
```

### 长文本阅读优化（核心）

文字冒险游戏中，用户 80% 的时间在阅读叙事文字。排版必须舒适：

| 属性 | 值 | 说明 |
|:-----|:---|:-----|
| 正文字号 | `text-sm`（14px） | 对话气泡内正文 |
| 正文字号-lg | `text-base` 到 `text-lg` | 独立叙事区域 |
| 行高 | `leading-relaxed`（1.625） | 中文长文本必须宽松 |
| 段落间距 | `space-y-4`（16px） | 消息间间距 |
| 气泡最大宽度 | `max-w-[85%]` 或 `max-w-3xl` | 防止行过长 |
| 对齐 | 居中容器 `max-w-3xl mx-auto` | 限制阅读宽度 |

### 标题与标签

| 层级 | 样式 | 用途 |
|:-----|:-----|:-----|
| 章节标题 | `text-xl font-semibold tracking-tight` | 侧边栏标签 |
| 区域标签 | `text-xs font-mono tracking-widest uppercase` | "你的选择"、"后宫和睦度" |
| 数值显示 | `font-mono tabular-nums` | HP/MP/金币/好感度 |

### 叙事文字色彩语法

NarrativeText 组件解析 AI 输出的文本标记，应用不同色彩：

| 标记格式 | 类型 | 色彩 |
|:---------|:-----|:-----|
| 普通文本 | narration | `text-zinc-100` |
| `「对话」` | dialogue | `text-amber-200` |
| `『内心』` | thought | `text-zinc-400 italic` |
| `【角色名】` | emphasis | `text-cyan-300 font-medium` |
| `（动作）` | action | `text-zinc-400 italic text-sm` |
| `【角色】「对话」` | character_dialogue | `text-amber-200`（角色名用 `text-cyan-300`） |

---

## 阴影与发光系统

### 多层阴影公式

所有凸起元素使用 3-4 层阴影叠加，**禁止使用单层阴影**：

```css
/* 卡片默认态 */
shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4),0_0_40px_rgba(0,0,0,0.2)]

/* 卡片悬停态 */
shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(94,106,210,0.1)]

/* 强调按钮 */
shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]

/* 内高光（按钮/凸起面上边沿） */
shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]
```

### 发光效果

交互元素（按钮、输入框聚焦）需要柔和的 accent 光晕：
```
ring-2 ring-primary/50 ring-offset-2 ring-offset-background
```

---

## 圆角与边框

| 元素 | 圆角 | 边框 |
|:-----|:-----|:-----|
| 消息气泡 | `rounded-2xl`（16px） | `border border-zinc-700/50` |
| 侧边栏卡片 | `rounded-lg`（8px） | `border border-zinc-800` |
| 按钮 | `rounded-lg`（8px） | 内阴影替代边框 |
| 输入框 | `rounded-lg`（8px） | `border border-zinc-700` |
| 进度条 | `rounded-full` | 无 |
| Badge | `rounded-full` | `border border-accent/30` |

边框悬停渐变效果（用于卡片高亮）：
```css
background: linear-gradient(to bottom, rgba(94,106,210,0.3), transparent);
mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
mask-composite: exclude;
padding: 1px;
```

---

## 动画与过渡

### 时序

| 场景 | 时长 | 用途 |
|:-----|:-----|:-----|
| 快速交互 | `200ms` | hover 态变化 |
| 标准过渡 | `300ms` | 状态切换、展开收起 |
| 入场动画 | `600ms` | 组件首次出现 |
| 光晕浮动 | `8000-10000ms` | 背景环境动画 |
| 进度条 | `500ms` | HP/MP/好感度变化 |

### 缓动

- **主要缓动**：`[0.16, 1, 0.3, 1]`（expo-out）
- **悬停**：`ease-out`
- **禁止**：spring 物理、bounce、overshoot

### 交互规则

- 悬停位移：最多 4-8px
- 按下态：`scale-[0.98]`
- 流式输出光标：`animate-pulse`（1s 周期，ease-in-out）
- 消息入场：`opacity 0→1, y 24px→0`，子元素间隔 `0.08s`

---

## 游戏组件设计规范

### ChatPanel（对话面板）

消息流的核心容器，负责展示叙事和玩家交互。

**布局：**
- 容器使用 `flex-1` 填充剩余空间
- 内容区 `max-w-3xl mx-auto` 居中限制宽度
- ScrollArea + viewportRef 实现自动滚底

**消息气泡：**

| 类型 | 背景 | 圆角 | 边框 |
|:-----|:-----|:-----|:-----|
| 玩家消息 | `bg-primary/20` | `rounded-2xl rounded-br-md` | 无 |
| 叙事消息 | `bg-zinc-800/50` | `rounded-2xl rounded-bl-md` | `border-zinc-700/50` |
| 流式输出 | 同叙事 + 光标 | 同叙事 | 同叙事 |

**空状态：**
- 居中显示标题和副标题
- `text-zinc-600` 弱化，不抢视觉焦点

**流式光标：**
```html
<span class="inline-block w-1.5 h-4 bg-primary/70 ml-0.5 animate-pulse" />
```

### NarrativeText（叙事文字渲染）

AI 输出的结构化文本解析器，将文本标记转为视觉样式。

**解析优先级（从高到低）：**
1. `【角色】「对话」` → character_dialogue
2. `「对话」` → dialogue
3. `『内心独白』` → thought
4. `【强调文本】` → emphasis
5. `（动作描写）` → action
6. 其余 → narration

**角色表情映射：**
- 通过 `characterEmoji` prop 传入角色名→emoji 映射
- 未知角色默认 `👤`

### StatusBar（状态栏）

顶部固定的信息条，显示玩家核心状态。

**布局：** `border-b border-zinc-800` + `bg-zinc-950/95 backdrop-blur`

**内容排列（从左到右）：**
1. ❤️ HP（`red-400/500`，图标填充）
2. 💧 MP（`blue-400/500`，图标填充）
3. 🪙 金币（`yellow-400/500`）
4. 📍 位置（`text-zinc-400`，小屏隐藏）
5. [右侧] 章节 → 日数 → 时间（日 `amber-400` / 夜 `blue-400`）

**HP/MP 进度条：**
- 高度 `h-1.5`，`rounded-full`
- HP 色彩梯度：>50% `red-500`，>25% `orange-500`，≤25% `red-600`
- MP：固定 `blue-500`
- 过渡动画 `transition-all duration-500`

### Sidebar（侧边栏）

右侧面板，展示角色关系、背包、记忆。

**布局：** 固定宽度 `w-72`，`border-l border-zinc-800` + `bg-zinc-950/90 backdrop-blur`

**标签页：** 三个 Tab（关系❤️ / 背包📦 / 记忆📖）

**和睦度条：**
- 标签：`text-zinc-500`，数值色彩：≥60 `pink-400`，≥40 `yellow-400`，<40 `red-400`
- 进度条：`bg-gradient-to-r from-pink-500 to-rose-500`

**角色关系卡片：**
- `rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5`
- 角色名 `text-zinc-200` + 好感阶段 Badge
- 好感度进度条 `bg-pink-500`，数值 `tabular-nums`

**背包/记忆列表：**
- 空状态 `text-zinc-500`
- 列表项 `border-zinc-800 bg-zinc-900/50`

### ChoicePanel（选择面板）

底部选择区域，展示 AI 生成的分支选项。

**布局：** `border-t border-zinc-800` + `bg-zinc-950/95 backdrop-blur`

**标题：** `text-xs text-zinc-500 font-medium uppercase tracking-wider` "你的选择"

**选项按钮：**
- 轮流使用 variant：`default` → `secondary` → `outline` → `ghost`
- 左侧序号 `font-mono text-xs text-muted-foreground`
- 文字左对齐 `justify-start text-left whitespace-normal break-words`
- 自适应高度 `h-auto py-3 px-4`

### InputPanel（输入面板）

底部输入区域，玩家自由输入行动。

**布局：** `border-t border-zinc-800` + `bg-zinc-950/95 backdrop-blur`

**输入框：**
- `h-10 rounded-lg border border-zinc-700 bg-zinc-900/50`
- 文字 `text-zinc-100`，占位符 `text-zinc-500`
- 聚焦：`ring-2 ring-primary/50`
- 禁用态 `opacity-50`

**按钮：**
- 发送：`variant="default"` + Send 图标
- 停止：`variant="destructive"` + Square 图标

### SaveSlot（存档槽位）

存档管理页面的卡片组件。

**布局：** 卡片式，显示存档元信息（玩家名、章节、位置、日期）

---

## 按钮系统

### Primary Button
- 背景：solid accent/primary
- 文字：白色
- 阴影：多层 + accent 光晕
- 悬停：亮度微增，光晕增强
- 按下：`scale-[0.98]`

### Secondary Button
- 背景：`bg-white/[0.05]` 或 `bg-zinc-800`
- 文字：`text-zinc-100`
- 边框：内阴影
- 悬停：`bg-white/[0.08]`

### Ghost Button
- 背景：透明
- 文字：`text-zinc-400`
- 悬停：`bg-white/[0.05]`，文字变亮

### Destructive Button
- 背景：`bg-red-600`
- 用于停止流式输出等破坏性操作

---

## 表单输入

- 背景：`bg-zinc-900/50` 或 `bg-[#0F0F12]`
- 边框：`border-zinc-700` / `border-white/10`
- 聚焦：`border-primary` + accent 光晕 ring
- 文字：`text-zinc-100`
- 占位符：`text-zinc-500` / `text-gray-500`

---

## 响应式策略

### 断点

| 断点 | 布局调整 |
|:-----|:---------|
| `< 640px` (sm) | StatusBar 隐藏位置/章节，侧边栏叠层覆盖 |
| `< 768px` (md) | 侧边栏默认收起，汉堡菜单切换 |
| `≥ 1024px` (lg) | 完整布局：主面板 + 侧边栏并列 |

### 移动端适配

- 侧边栏：覆盖模式（overlay），带 backdrop-blur
- 输入面板：固定底部，`safe-area-inset` 适配
- 消息气泡：移动端 `max-w-[90%]`
- 状态栏：精简模式，仅显示核心数值

---

## 禁止事项

1. **纯黑 `#000000`** → 用 `#050506` 或 `#09090b`
2. **纯白文字** → 用 `#EDEDEF` 或 `#f4f4f5`
3. **单层阴影** → 必须 3-4 层叠加
4. **弹跳动画** → 用 expo-out，不要 spring/bounce
5. **实色背景** → 必须渐变 + 噪点层叠
6. **长行文本** → 正文宽度不超过 `max-w-3xl`（768px）
7. **硬编码颜色值** → 使用 Tailwind token 或 CSS 变量
8. **过亮的强调色大面积使用** → accent 用于高亮和交互，不是装饰
9. **过窄的行高** → 中文叙事文字行高不低于 1.625
10. **缺失焦点环** → 所有交互元素必须有可见的 focus 状态

---

## 无障碍

- 主文字 `#EDEDEF` on `#09090b`：对比度 > 15:1 ✓
- 弱化文字 `#8A8F98` on `#09090b`：对比度 > 6:1 ✓
- 强调色 on 暗背景：确保 ≥ 4.5:1
- 所有交互元素有可见焦点环
- 尊重 `prefers-reduced-motion`
- 不单独依赖颜色传递信息，配合图标/标签/位置
