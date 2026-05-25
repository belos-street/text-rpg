<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Text RPG Pro - 项目开发规范

## 项目概述

基于 Next.js 16 + TypeScript 的 AI 驱动文字冒险游戏引擎。代码与故事内容完全解耦——故事数据存放在 `game-data/` 目录（不纳入版本控制），代码通过 `src/lib/game-data.ts` 动态读取。

## 项目目录结构

```
text-rpg-pro/
├── game-data/              # 实际故事内容（.gitignore 排除，不上传）
├── game-data-example/      # 故事模板框架（可上传，给其他人参考）
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API Route Handlers
│   │   ├── saves/          # 存档管理页面
│   │   └── page.tsx        # 游戏主页面
│   ├── components/
│   │   ├── game/           # 游戏核心组件（ChatPanel, Sidebar, StatusBar...）
│   │   ├── saves/          # 存档相关组件
│   │   └── ui/             # 基础 UI 组件（shadcn/ui 风格）
│   ├── lib/                # 核心逻辑层
│   │   ├── ai.ts           # AI 调用封装
│   │   ├── game-data.ts    # 故事数据加载（解耦层）
│   │   ├── prompts.ts      # AI 提示词构建
│   │   ├── storage.ts      # 存档读写
│   │   ├── affection.ts    # 好感度系统
│   │   └── utils.ts        # 工具函数
│   └── types/              # TypeScript 类型定义
├── data/                   # 运行时数据（存档、会话记录）
└── assets/                 # 静态资源
```

---

## Skills 使用指南

项目配备了 `.agents/skills/` 目录下的技能库，在不同开发场景中应当主动调用对应 skill。

### 何时使用哪个 Skill

| 场景 | Skill | 说明 |
|------|-------|------|
| 创建新功能、新组件前 | `brainstorming` | **必须先用**——探索需求、设计方案，获得用户批准后再动手 |
| 从设计到编码前 | `writing-plans` | 将设计拆分为可执行的分步计划 |
| 写 React / TSX 代码时 | `react-best-practices` | Hooks、性能优化、组件模式的最佳实践 |
| 写 Next.js 路由/API 时 | `nextjs` | App Router、Server Components、数据获取 |
| 状态管理相关 | `zustand` | Zustand store 的定义、中间件、选择器 |
| 审查代码 / PR 时 | `TRAE-code-review` | 结构化的代码审查流程 |
| 调试运行时问题时 | `TRAE-debugger` | 科学调试流程：假设→插桩→复现→分析→修复 |
| 新项目从零开始 | `vibe-flow` | 独立开发者全流程（商业→需求→设计→编码→部署） |
| 制定实施计划 | `writing-plans` | 将 spec 拆解为带具体代码的分步任务 |

### 个人编码规范 (belos-street)

所有代码必须遵循 `.agents/skills/belos-street/` 中定义的规范：

**命名速查：**

| 类型 | 风格 | 示例 |
|------|------|------|
| 文件/目录 | kebab-case | `chat-panel.tsx`, `game-data/` |
| React 组件 | kebab-case 文件名 | `chat-panel.tsx` → `ChatPanel` 组件 |
| 函数/变量 | camelCase | `fetchSaves`, `isLoading` |
| 接口/类型 | PascalCase | `SaveData`, `Message` |
| 常量 | UPPER_SNAKE_CASE | `MAX_MEMORIES` |
| 布尔值 | is/has/can 前缀 | `isStreaming`, `hasError` |

**代码风格要点：**
- 单引号，无分号，无尾随逗号
- 2 空格缩进，行宽 80
- JSX 使用双引号
- 箭头函数参数始终加括号

### LLM 编码准则 (Karpathy Guidelines)

- **先思考再编码**：不确定时先说清假设和方案，不默默做选择
- **最小化代码**：不写"以防万一"的功能，不为单一用法做抽象
- **精准改动**：只改必须改的，不顺手"优化"无关代码
- **目标驱动**：每步都有可验证的成功标准

---

## UI 设计规范

项目采用 **Linear / Modern Dark** 设计风格，适用于沉浸式文字冒险游戏引擎。

**完整设计规范参见：[.agents/docs/ui-design/modern-dark.md](.agents/docs/ui-design/modern-dark.md)**

**核心原则速记：**
- 深邃背景（`#050506`）+ 多层光晕，营造"深夜桌面应用"氛围
- 文字是主角，界面是画框——阅读舒适优先
- 所有阴影必须多层叠加，所有动画用 expo-out，禁止弹跳
- 代码中不硬编码任何视觉值（颜色、间距等），使用 Tailwind 设计 token

---

## 故事数据解耦规则

**核心原则：代码中不包含任何故事内容。**

- 所有角色名、剧情、世界观、道具数据均从 `game-data/` 目录读取
- `game-data/` 目录被 `.gitignore` 排除，不会上传到仓库
- `game-data-example/` 提供完整的模板结构和填写说明
- 新建存档时调用 `createInitialSave()` 从 `config.json` 动态读取初始数据
- AI 提示词中的示例使用通用占位符（角色A、角色B），不使用具体角色名

**如果发现代码中硬编码了故事内容（角色名、地名、剧情等），必须立即修复为从配置读取。**
