# ADR: Hermes-Agent-Ultra 跨平台桌面端框架与 UI/UX 复用策略

> 英文对等版本：[DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.en.md](./DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.en.md)

## Status

Accepted (2026-05-28) — 架构方向已确认；实现分阶段进行（见「实现路径」）。

## Context

Hermes-Agent-Ultra 是一个 **Rust-first** 的 monorepo（17 个 crate，`workspace` 版本 0.14.2，edition 2021，MIT 许可），核心通过成熟的 trait 契约组织：`PlatformAdapter` / `LlmProvider` / `ToolHandler` / `MemoryProvider` / `SkillProvider`（见 [crates/hermes-core/src/traits.rs](../../crates/hermes-core/src/traits.rs)）。仓库已具备：

- Axum HTTP + WebSocket API 服务（[crates/hermes-http/src/lib.rs](../../crates/hermes-http/src/lib.rs)，含 `HttpPlatformAdapter`，桥接 `AgentLoop`）；
- 终端 UI（Rust Ratatui + 一层 React/Ink，见 [ui-tui/](../../ui-tui/)）；
- dashboard 插件系统（FastAPI + JS bundle）。

**当前没有任何桌面 GUI** —— 这是一块全新的工作。目标：为 macOS 与 Windows 打造一个优美、现代、**真正可交互、可视化、易用**的可视化桌面端 App。

**调研对象（本 ADR 的输入）**：
- `hermes-agent-cn-desktop`（本地，**同为用户本人的项目**）：Hermes Agent 中文桌面端，Tauri v2 + React 19，**sidecar 子进程**架构；其公开许可证为 PolyForm Noncommercial，但**因系用户自有版权，可随时直接复用其代码**。
- `uclaw`（本地 `/Users/ryanliu/Documents/uclaw`）：**用户本人的项目**，AI 桌面协作端，Tauri v2 + React 18，**进程内嵌入 Rust 核心**，**Apache-2.0 许可**。
- `openhuman`（本地 `/Users/ryanliu/Documents/openhuman`，**亦为用户本人的项目**）：Tauri v2 + React 19 + 纯 Tailwind 桌面应用，其**设置页（Settings）UI/UX 与原语**作为本项目设置窗口的直接参考与复用来源。

**已确认的前置决策**：
1. 集成方式 = **进程内嵌入 Rust 核心**（直连 `#[tauri::command]`，非 sidecar）；
2. 国际化 = **en + zh 双语，自 day 1**；
3. v1 范围 = **broad parity（~14 屏）**，但以 uclaw 的 workspace+session+message-view 为主干；
4. 使用场景 = **个人 / 非商业 / 不分发**；
5. 前端基座 = **以 uclaw 为基座/灵魂，高保真复用**；cn-desktop = Hermes 领域屏幕的**直接代码来源**（两者均为用户自有项目）。

**本轮新增的强约束（用户明确要求）**：
- **A. 最大化复用 uclaw 前端**（这是用户自己的心血）：尽量保留 uclaw 的前端逻辑与 UI/UX；以 **Workspace + Session** 概念作为应用的**主题思想**；**Agent message view 相关内容须 1:1「原盘复刻」**（基于 Hermes Ultra 的基础设施）。
- **B. 严禁 god file（前后端均是）**：必须规避 uclaw 的 **两个**单体反面教材 —— 后端 `src-tauri/src/tauri_commands.rs`（**18,069 行 / ~120 命令**）与前端 `ui/src/lib/tauri-bridge.ts`（**3000+ 行的桥接单体**）。Tauri 命令、前端 IPC 桥接、以及整体 UI/UX 代码都须按域**严格模块化、结构化、良好解耦**，禁止把功能堆进单一文件。
- **C. 复刻左侧栏的 workspace 管理 + ARC 浏览器式 workspace 切换**。

## Decision

1. **桌面框架** = **Tauri v2** + React + TypeScript + Vite。Ultra 是 Rust-first，Tauri 后端本身即 Rust，可直接依赖 Ultra 的 crate；系统 WebView 带来 ~15–30MB 小体积二进制。

2. **集成架构** = **进程内嵌入 Rust 核心，零 sidecar、零 localhost 端口**。Tauri 后端依赖 `hermes-agent` / `hermes-gateway` / `hermes-core` 等，经 `#[tauri::command]` 直接调用 `AgentLoop`。交付物是**单个签名二进制**。

3. **前端基座 = uclaw，高保真复用**（约束 A）。因 uclaw 是用户自有的 Apache-2.0 项目，复用尺度从「设计系统 + 原语」上调为**尽量原盘复刻前端逻辑与 UI/UX**；数据层从 uclaw 的 Tauri 命令**重指向 Hermes Ultra 基础设施**（机制见「前端契约保持 + 反腐层」）。

4. **主题思想 = uclaw 的 Workspace + Session 范式**（约束 A）。以 workspace（含 ARC 式切换）+ session/tab 作为应用主干，使其成为真正可交互、可视化、易用的桌面 App。复用 `WorkspaceInfo` / `WorkspaceSession` / `TabItem` 数据模型与相应 Jotai 原子。

5. **Agent message view 1:1「原盘复刻」**（约束 A）。整套消息渲染栈逐文件复制，仅替换数据源；通过**保持前端契约 + 后端反腐层**实现（见专节）。

6. **复刻左侧栏 workspace 管理 + ARC 式切换**（约束 C）。复制 `LeftSidebar` 的 framer-motion `workspaceSlideVariants`、`useWorkspaceSwipe`、`workspaceSwitchDirectionAtom` / `swipeGestureAtom`、`WorkspaceSwitcherBar` 的图标密度坍缩逻辑（见专节）。

7. **cn-desktop = Hermes 领域屏幕的直接代码来源**（同为用户自有项目，可直接复用代码）。因 cn-desktop 本身就是 Hermes 桌面端，其领域屏幕（skills / memory / cron / mcp / models / profiles / console / health / logs / analytics / IM 引导）连同对应的 TanStack Query hooks、数据模型与 API 集成，已编码了正确的 Hermes 领域逻辑——**直接搬运这些屏幕与 hooks**，再做两件事：(a) 数据层从其 HTTP `api_request` **重指向**到本项目的 Tauri 命令 / 反腐层；(b) **统一换肤到 uclaw 的 shadcn/Tailwind 设计语言**（保持视觉一致，uclaw 是产品灵魂与基座）。uclaw 的 app-shell 仍是骨架，这些屏幕作为标签/路由内嵌。
    - **换肤取舍（待最终确认）**：本 ADR 默认「统一换肤到 shadcn」以保证视觉一致；更快的替代是「带 cn-desktop 原有 CSS Modules 直接落地」，但会造成双套样式系统并存，与「优美统一」目标冲突。

8. **样式系统** = **Tailwind CSS + shadcn/ui（Radix）**，随 uclaw 基座到位。

9. **状态与数据** = **Jotai**（客户端，随 uclaw）+ **TanStack Query**（服务端列表/轮询）+ **Tauri 事件 / Channel**（流式 token 与工具活动）。

10. **国际化** = **i18next + react-i18next**，默认 `en`、随附 `zh`，自 day 1（对两个参考项目均缺失项的升级）。

11. **反 god file：Tauri 命令严格模块化**（约束 B）。按域拆分 `commands/*.rs`，**薄命令**（仅解析参数 → 调服务 → 映射结果 → emit 事件）+ **trait 服务层**（反腐层，封装 Hermes crate）+ **聚合注册模块**。显式禁止复刻 uclaw 的 18K 行单体（见专节）。

12. **类型契约** = 用 **`tauri-specta` / `ts-rs`** 从 Rust 自动生成前端 TS 类型，保证命令签名前后端类型安全。

13. **仓内位置** = 新建顶层 **`desktop/`**：`desktop/src-tauri/`（Rust，加入 Cargo workspace）+ `desktop/ui/`（React + Vite，pnpm）。

14. **打包分发** = macOS **通用 DMG**（aarch64 + x86_64）+ Windows **NSIS x64**；**`tauri-plugin-updater`** 自动更新；macOS 公证 + Windows Authenticode 签名；扩展现有 GitHub Actions 矩阵。

15. **多主题系统复用**（用户要求）：复用 uclaw 的 11 套主题（`.theme-{name}` CSS 变量 + `theme.ts` 原子 + `applyThemeToDOM` + `AppearanceSettings` 选择器），持久化到桌面 `ui_store`，作为设置窗口的 Appearance 分页。

16. **底部 Dock 作模式/域导航**：复用 uclaw 的 `BottomDock`（自动隐藏、底部 hover 唤出、图标磁化放大、长按拖拽重排、动态 pinned 项、`motion/react` 弹簧动画），承载高频域；与左侧栏（workspace/session）**并存**——左侧栏=空间导航，Dock=模式导航。

17. **Dock 与设置的域划分**（由本 ADR 决定）：高频交互域上 Dock，低频配置/诊断域进设置窗口（划分见「导航信息架构」）。

18. **App 设置页基于 openhuman**：复用并参考 openhuman 设置页的原语与信息架构，**换肤到 shadcn + 多主题令牌**；为桌面效率采用「左侧分类导航 + 右侧内容」两栏布局；Appearance 分页承载主题选择器。

19. **完整复刻 Agent view 的 App Shell**（用户要求，见截图）：**右侧面板**（Files / Teams / Plan / Trajectory / Browser 标签）、Files 标签的**工作区文件树 / 文件改动 / 附加目录**、**文件预览面板**（含 file/browser 多标签分页）、打开文件的 **Focus 模式**、聊天区 **Session 标签栏** —— 均 1:1 复刻；数据源重指向 Hermes（文件 I/O / 文件监听 / artifact 操作 / `agent_stop` 等改为本项目 Tauri 命令）。Teams/Plan/Browser 标签若 Ultra 暂无对应能力，则先隐藏、待后续接入。

20. **前端同样严禁 god file，UI/UX 代码模块化/结构化**（约束 B 延伸）：uclaw 的 `ui/src/lib/tauri-bridge.ts`（3000+ 行）与 `tauri_commands.rs`（18,069 行）**同为反面教材**。前端 IPC 桥接按域拆分（`lib/bridge/<domain>.ts` + 薄聚合器，类型由 `tauri-specta` 生成），与后端 `commands/<domain>.rs` 一一对应；前端整体采用**特性化（feature-based）模块结构**（组件/原子/hooks/lib 按域分层、设文件体量上限、以 `index.ts` barrel 暴露最小公共接口、禁止跨特性深引用）。

## Rationale

### 为什么是 uclaw 基座 + cn-desktop 领域屏幕直接复用

1. **许可证**：uclaw 与 cn-desktop **均为用户自有项目**，代码皆可直接复用；uclaw 的 Apache-2.0 与 Ultra 的 MIT 天然兼容。许可证不再是基座取舍的决定因素——下述架构与设计因素才是。
2. **架构吻合**：用户已选「嵌入式直连」。uclaw 现成就是这套（`uclaw_core` 进程内 + `invoke()` 直调），零阻抗、无需取巧；cn-desktop 的 HTTP 代理 transport 是为 sidecar 设计，故其屏幕复用时需把 transport 重指向到 Tauri 命令。
3. **更美、更快、组件更厚**：Tailwind + shadcn/ui；uclaw 的 ai-elements / app-shell / 编辑器 / hooks 复用评分 ~8.5/10——确立为统一设计语言。
4. **是用户自有心血**：uclaw 的 workspace+session+message-view 范式正是用户希望延续的产品灵魂；高保真复用既省工，又保留设计意图。

### cn-desktop 的独特价值（现可直接复用代码）

cn-desktop **本身就是 Hermes 桌面端**，14 屏与 Ultra 后端 1:1 对应。既然同为用户自有项目，它从「领域 IA 参考」升级为 **Hermes 领域屏幕与领域逻辑（hooks/数据模型/API 集成）的直接代码来源**——直接搬运其屏幕与 hooks，重指向 transport 到 Tauri 命令，并换肤到 uclaw 的 shadcn 设计语言。

## 前端契约保持 + 反腐层（实现 1:1 复刻的核心机制）

要做到 message view「原盘复刻」，**前端尽量不动**，让后端讲前端的语言：

- **保持前端契约不变**：复用 uclaw 的类型（`AgentMessage` / `PrimaChatMessage` / `ContentBlock` / `ToolActivity` / `AgentStreamState`）、原子（`agent-atoms.ts` 的 `applyAgentEvent()` 纯函数、`agentStreamingStatesAtom` 等）、以及 `agent:*` 事件名与载荷形状。
- **后端反腐层（anti-corruption layer）**：在 Ultra 的 Tauri 命令/服务层，用**相同的 `invoke` 命令名**与**相同的 `agent:*` 事件载荷**对接 Hermes 的 `AgentLoop` / `SessionPersistence` 等。Hermes 的内部类型在此层翻译成 uclaw 前端契约，前端无需感知差异。

### Hermes ↔ uclaw 前端契约 映射

| uclaw 前端契约 | Hermes Ultra 基础设施 | 适配说明 |
|---|---|---|
| `agent:text-delta` 事件 | `AgentLoop` 流式 `StreamChunk`（文本增量） | 反腐层把 StreamChunk 文本增量 emit 为 `agent:text-delta` |
| `agent:thinking` / `agent:thinking-done` | reasoning/thinking 增量（Anthropic thinking 等） | 有则映射，无则不发 |
| `agent:tool-start` / `agent:tool-result` | `ToolHandler` 执行的开始/结果 | 工具调用与结果翻译为 `ToolActivity` 载荷 |
| `agent:turn_cost` | `hermes-telemetry` 的 usage/token 计量 | 映射 input/output/cache token、cost |
| `agent:done` / `agent:error` | 轮次完成/错误 | 终结 `AgentStreamState` |
| `ContentBlock`（text/thinking/tool_use/tool_result） | Hermes 消息内容块 | 按原顺序配对 tool_use ↔ tool_result |
| `WorkspaceSession`（`spaceId` 分组） | `SessionPersistence` 会话（SQLite+FTS5） | session 主体来自 Hermes，桌面侧补充 workspace 归属与展示元数据 |
| `WorkspaceInfo`（workspace 概念） | **Hermes 无原生 workspace 概念** | **workspace 为桌面端自有组织概念**：在桌面 SQLite 新建 `workspaces` 与 `workspace_sessions` 表，按 workspace 对 Hermes session 分组 |

> 结论：workspace 是**桌面侧新增的组织层**，session 主体仍是 Hermes 的会话。这样既复刻了 uclaw 的范式，又落在 Ultra 的真实基础设施上。

## 复用清单（Reuse Manifest）— uclaw（Apache-2.0）+ cn-desktop（用户自有）

### 来自 uclaw（Apache-2.0）

### Agent message view（1:1 复刻目标，整目录复制）
- `ui/src/components/ai-elements/` — `message.tsx`（Message / MessageHeader / MessageContent / MessageResponse / MarkdownLink）、`conversation.tsx`（自动贴底滚动容器）、`reasoning.tsx`、`scroll-minimap.tsx`、`provider-avatar.tsx`、`sticky-user-message.tsx`
- `ui/src/components/agent/` — `AgentMessages.tsx`、`NativeBlockRenderer.tsx`（ContentBlock[] 按序渲染、配对 tool_use↔tool_result）、`ContentBlock.tsx`（ThinkingBlock 折叠块）、`ToolActivityItem.tsx`、`tool-renderers/`（bash / read / write / edit / screenshot / gbrain / collapsible / default 等结果渲染器）、`TaskProgressCard.tsx`
- `ui/src/components/chat/` — `ChatMessageItem.tsx`、`ChatMessages.tsx`、`ChatToolBlock.tsx`、`ChatToolActivityIndicator.tsx`
- 类型与状态 — `ui/src/lib/chat-types.ts`、`ui/src/lib/agent-types.ts`、`ui/src/atoms/chat-atoms.ts`、`ui/src/atoms/agent-atoms.ts`（含 `applyAgentEvent()`）
- 富渲染 — react-markdown + remark-gfm + remarkPreserveBreaks；Shiki 代码高亮；`FilePathChip` 文件路径芯片

### Workspace + Session 主干
- 状态/类型 — `ui/src/atoms/workspace.ts`（`WorkspaceInfo` / `WorkspaceSession` + `workspacesAtom` / `activeWorkspaceIdAtom` / `workspaceSessionsAtom` / `selectWorkspaceAtom` / `reorderWorkspacesAtom` 等）、`ui/src/atoms/tab-atoms.ts`（`TabItem` + per-workspace 标签池 `visibleTabsAtom` / `activeTabIdAtom`）、`ui/src/lib/workspace-icons.ts`（~56 个 lucide 图标 + `getWorkspaceIcon()`）
- 组件 — `ui/src/components/app-shell/LeftSidebar.tsx`、`ui/src/components/workspace/`（`WorkspaceSwitcherBar.tsx` / `WorkspaceHeader.tsx` / `WorkspaceRail.tsx` / `SessionItem.tsx` / `WorkspaceCreateDialog.tsx` / `IconPicker.tsx`）

> 复用 uclaw 时**保留其 `LICENSE` / `NOTICE` 归属**（Apache-2.0 要求）。

### 来自 cn-desktop（用户自有，直接复用 Hermes 领域屏幕与领域逻辑）
- **领域屏幕（搬运结构 + 数据接线，再换肤到 shadcn）**：`web/src/routes/` 下的 `models` / `skills` / `memory` / `mcp` / `cron` / `console` / `health` / `logs` / `analytics` / `profiles` / `projects` / `im-onboarding` / `advanced`。
- **领域 hooks（编码了正确的 Hermes 操作，价值最高）**：`web/src/hooks/` 下的 `use-sessions` / `use-profiles` / `use-memory` / `use-cron` / `use-gateway` 等（TanStack Query，原对接 Hermes dashboard REST）——**重指向到本项目 Tauri 命令后即可复用其领域逻辑**。
- **数据契约 / 解析**：`packages/protocol/`（Zod schema、`session-log` 解析）。
- **领域设置组件与 IM 引导向导**：`web/src/components/settings/`、`im-onboarding` 流程。
- **状态栏/健康指示**：`app-status-bar`（gateway 健康、模型、token、上下文）。

> 复用规则：**保留 cn-desktop 的结构与领域逻辑/数据接线，但视觉统一到 uclaw 的 shadcn/Tailwind**；transport 由 `api_request`-over-HTTP 改为本项目的 Tauri 命令/反腐层。

## 左侧栏 workspace 管理 + ARC 式切换（约束 C，专节）

照搬 uclaw 的实现并重指向 Hermes：

- **滑动动画**：复制 `LeftSidebar.tsx` 的 framer-motion `workspaceSlideVariants`（`forward` 新栏从右 +100% 入、旧栏左 −100% 出；`backward` 反向；纯 translate、同槽叠放、父级 `relative + overflow:hidden` 裁剪）。
- **手势**：复用 `useWorkspaceSwipe`（实时写 `swipeGestureAtom`：`offsetPx` / `containerWidth` / `previewWorkspaceId`）+ 切换时的 `GesturePreviewCard`（图标 + 名称 + 路径预览）。
- **方向状态**：`workspaceSwitchDirectionAtom`（`'forward' | 'backward'`）驱动入场方向。
- **图标密度**：`WorkspaceSwitcherBar` —— ≤5 个 workspace 全显 24px 图标；>5 个时活动项全图标、其余坍缩为 6px 圆点；`ResizeObserver` 监听容器宽度平滑切换。
- **数据重指向**：`selectWorkspaceAtom` / `reorderWorkspacesAtom` 等动作原子改调桌面侧 `workspace` 命令（持久化到桌面 SQLite），而非 uclaw 的 `set_active_workspace_id` 后端。

## 导航信息架构（Navigation IA）— 左侧栏 + 底部 Dock + 设置窗口（专节）

应用采用三层导航，各司其职：

- **左侧栏（ARC 式）= 空间导航**：「我在哪个 workspace、哪个 session」（workspace 切换 + 会话 rail）。见上节。
- **底部 Dock（macOS 式）= 模式/域导航**：「我在用哪个高频功能」。复用 uclaw 的 `BottomDock`（自动隐藏、底部 hover 唤出、图标磁化放大、长按拖拽重排、动态 pinned 项、`motion/react` 弹簧动画）。
- **设置窗口 = 低频配置/诊断**：由 Dock 的齿轮项唤出，承载不常用的领域（见下表）。

### Dock 与设置的领域划分（由本 ADR 决定）

| 放在 **底部 Dock**（高频、交互式） | 放进 **设置窗口**（低频、配置/诊断） |
|---|---|
| Chat / Agent 工作台 | Appearance（多主题 + 密度 + 语言） |
| Sessions（历史） | Providers & Models（API key、模型路由） |
| Memory | MCP Servers |
| Skills | Scheduled Tasks（Cron） |
| Console（PTY 终端） | Integrations（IM 引导 / 消息渠道） |
| ⚙ Settings（唤出设置窗口） | Profiles |
| + 动态 pinned sessions/workspaces | Diagnostics（Health / Logs / Analytics） |
| | Advanced（高级/开发者、运行时） |
| | About（版本 / 自动更新） |

> Projects 归入 workspace 概念（左侧栏），不单列为 Dock 模式，避免与 workspace 冗余。

**复用清单（来自 uclaw 的 Dock）**：`components/dock/`（`BottomDock` / `BottomDockHoverRegion` / `DockItem` / `DockPinnedItem`）、`hooks/useDockBounce.ts`、`hooks/useDockLiveness.ts`、`atoms/dock-atoms.ts`。
**改造**：重建 `MODE_REGISTRY`，把 Dock 模式映射到 Hermes 高频域（chat/agent/memory/skills/console/settings）与各自的点击导航（切换 tab/route）；`useDockBounce` 的「需审批」信号改接 Ultra 的工具审批事件；`useDockLiveness` 的 streaming/consolidating 改接 `agent:*` 流式与 memory 状态。

## 多主题系统（复用 uclaw，约束：多主题需复用）

复用 uclaw 的整套多主题系统（可移植性极高，~9/10）：

- **主题定义**：`styles/globals.css` 的 `@layer base` —— 以 `.theme-{name}` 类承载整套 HSL CSS 变量（`--background` / `--foreground` / `--primary` / …），配 `.dark` 覆盖。内置 11 套：`light` / `dark` / `ocean-light` / `ocean-dark` / `forest-light` / `forest-dark` / `slate-light` / `slate-dark` / `warm-paper` / `qingye` / `black` / `the-finals`（the-finals 自带 Saira/Poppins 字体与背景）。
- **状态**：`atoms/theme.ts` —— `themeModeAtom`（`light`|`dark`|`system`|`special`）、`themeStyleAtom`（主题名）、`systemIsDarkAtom`、派生 `resolvedThemeAtom`。
- **应用**：`applyThemeToDOM()` 在 `<html>` 上切换 `.dark` 与 `.theme-{name}` 类（同一时刻仅一套 special 主题）。
- **选择器 UI**：`components/settings/AppearanceSettings.tsx` 的主题卡片网格 —— 作为设置窗口的 **Appearance** 分页。
- **持久化**：`themeMode` / `themeStyle` 落 localStorage + 桌面 `ui_store`（rusqlite，经 Tauri 命令）；初始化在 `main.tsx` 的 `ThemeInitializer`。
- **改造**：把 uclaw 的 `bridge.getSettings/patchSettings` 改接本项目的 `ui_store` 命令；字体迁移到 `desktop/ui/public/themes/`。Hermes 品牌主题作为新增 `.theme-hermes-*` 加入同一体系。

## App 设置页设计（基于 openhuman，用户自有）

设置窗口的思路与 UI/UX **复用并参考 openhuman 的设置页**（纯 Tailwind、桌面优先、整洁的 stone 配色与卡片分组、行/分区原语、Danger Zone、模态确认），并**换肤到本项目 shadcn + 多主题令牌**。

- **复用的原语（openhuman，lift 后换肤）**：`SettingsMenuItem`（行：图标 + 标题 + 描述 + 右侧控件，支持 `dangerous`）、`SettingsHeader`（标题 + 返回 + 面包屑）、`PageBackButton`、`useSettingsNavigation`（导航 + 自动面包屑）、`SettingsSectionPage`（分区容器）；及其表单模式（开关行、分组卡片、Danger Zone、模态确认）。
- **布局决定（为桌面效率）**：采用 **左侧分类导航 + 右侧内容面板** 两栏布局（经典桌面设置 UX，一屏纵览分类、点击更少），内容面板内沿用 openhuman 的行/分区原语。
  - openhuman 原生是「扁平列表 + 面包屑下钻」；本 ADR 为桌面效率改为两栏，**作为待确认取舍**（若你更想 1:1 复刻 openhuman 的扁平+面包屑，告知即可翻转）。
- **分页**：Appearance（主题/密度/语言）、Providers & Models、MCP、Scheduled Tasks、Integrations、Profiles、Diagnostics（Health/Logs/Analytics）、Advanced、About。
- **数据 / 持久化**：各分页经本项目 Tauri 命令读写（models/mcp/cron/profiles → 对应 service；appearance → `ui_store`）；沿用 openhuman 的「本地缓冲 + 显式保存 / 乐观更新」模式。
- **复用清单（来自 openhuman，用户自有）**：`components/settings/`（`SettingsHome` / `SettingsSectionPage` / `components/SettingsMenuItem` / `SettingsHeader` / `PageBackButton`）、`hooks/useSettingsNavigation.ts`、`pages/Settings.tsx`（路由结构作模板）。

## App Shell 复刻：右侧面板 + 文件预览 + Focus 模式 + 标签系统（约束：见截图，1:1 复刻）

截图所示的 uclaw Agent view 三栏布局须**完整复刻**到本项目（数据源重指向 Hermes）。可移植性 **~70% 纯 UI 直接复用，~30% 重指向 Tauri 命令**。

### 右侧面板（`RightSidePanel`，固定 ~400px，可滑动进出，按 workspace 记忆激活页）

五标签 `files | teams | plan | trajectory | browser`（`workspaceActiveRightPanelTabMapAtom` 按 workspace 存激活页；`plan:updated` 事件自动切到 plan）：

| 右侧面板标签 | uclaw 组件 | 映射到 Hermes |
|---|---|---|
| **Files**（工作区文件） | `WorkspaceFilesView` → `FilesRail` | 读 workspace/session/附加目录文件树（新 `files_service` 命令）✅ 直接映射 |
| **Trajectory**（轨迹） | `TrajectoryReel` | Agent 步骤/工具时间线 ← `agent:*` 事件 / 会话轨迹 ✅ 映射良好 |
| **Plan**（计划） | `PlanViewer` | Agent 计划/待办（Ultra 暴露则接，否则先隐藏）⚠ 待定 |
| **Teams**（团队） | `AgentTeamsPanel` | 子 Agent / teammates（Ultra 多 Agent 则接，否则先隐藏）⚠ 待定 |
| **Browser** | `BrowserViewer` | 浏览器工具视图（Ultra 有 browser 工具则接，否则延后）⚠ 待定 |

### Files 标签内容（工作区文件 / 文件改动 / 附加目录）

- **子标签** `工作区文件 / 文件改动`（`filesRailTabAtom`）。
- **文件树**：递归 `FileTreeNode`（懒加载目录、`FileTypeIcon` 文件图标、`FileRowMenu` 右键菜单），由 `useFileTree` + `mountRootsAtomFamily` / `fileTreeAtomFamily` / `expandedPathsAtomFamily` 驱动；文件系统监听 `useFilesRailWatcher`（`files:changed:{mountId}` 事件）。
- **附加目录**：`AttachedDirRow` + `workspaceAttachedDirsMapAtom`；附加经 `attachWorkspaceDirectory`。
- **文件改动**：`FileChangesPanel`（uclaw 中为 stub）→ 本项目接 Hermes 会话产生的文件改动 / git 状态。
- **重指向**：`files_rail_list_mounts` / `files_rail_read_dir` / `files_rail_watch_*` → 新 `files_service` Tauri 命令（基于会话工作目录 + `notify` 文件监听）。

### 文件预览面板（`PreviewPanel`）+ file/browser 标签分页

- **多标签池**：`previewTabsAtom` + `activePreviewTabKeyAtom`（key = `mountId:relPath`）；agent 来源标签靠左（✨ 标记）、手动来源靠右、同文件复用不重复开（`PreviewTabBar` / `PreviewTabItem`）。
- **按类型分发**：`PreviewSurface` + `usePreviewRouter` + `useFileBytes` → code（CodeMirror+Shiki）/ markdown / diff / image / video / pdf（pdfjs）/ docx（mammoth）/ xlsx / pptx / 兜底。可编辑 `EditorSurface` + 脏缓冲 `dirtyBuffersAtom` + 写入审批 `WriteApprovalDialog`。
- **与聊天区横向分屏**：`WorkspaceShell` 内聊天/预览左右分屏，`previewPanelSplitRatioAtom`（localStorage，默认 0.55），分隔条可拖拽。
- **打开触发**：文件树点击 → `openPreviewTabAction({source:'manual'})`；Shift+点击 → 加入上下文附件；Agent 写文件 → `useAutoPreview` 自动预览。
- **重指向**：`preview_read_bytes` / `preview_resolve_path` → 新 Tauri 命令。

### Focus 模式（打开文件时的专注 UI，纯 UI，可移植性极高）

- **触发**：Alt+F 或打开预览（`useFocusModeShortcut`）；`focusModeAtom` 全局开关。
- **交互**：开启后右侧面板隐藏；鼠标接近屏幕左右边缘（160px 起辉光渐显、32px 峰值），到 8px 热区时**浮动岛**（`FloatingIsland`，左 280px / 右 400px）以 260ms cubic 缓动滑入，承载 LeftSidebar / RightSidePanel；离开边缘 >32px 后 200ms 隐藏；关预览或 Esc 退出。
- **实现**：`FocusModeOverlay` + `FloatingIsland` + `GlowIndicator`（三层辉光 + Y-trace，鼠标位置经 ref 直接改 DOM，避免 60Hz 重渲染）+ `useFocusModeHotzone`（热区状态机）+ `lib/focus-mode-geometry.ts`（几何常量 + `isInsideIslandRect`）+ `useFocusModeAutoExit`。动画 framer-motion，缓动 `[0.32,0.72,0,1]`（与 Dock/TabBar/右面板统一）。

### 聊天区 Session 标签栏（`TabBar`）+ 标签模型

- **组件**：`tabs/TabBar`（+`TabBarInner`）、`TabBarItem`（按类型图标 chat/agent/browser、流式脉冲点、× 关闭、中键关闭、hover 出 `TabPreviewPanel` 迷你预览）、`TabBarWorkspaceChip`；workspace 切换按方向滑动（与 ARC 一致）。
- **模型**：`tab-atoms.ts` —— `TabItem{ type:'chat'|'agent'|'browser'|'symphony', sessionId, title, workspaceId }`；`tabsAtom`（跨 workspace 标签池）、`workspaceActiveTabIdMapAtom`、派生 `visibleTabsAtom`/`activeTabIdAtom`/`activeTabAtom`、`tabMruAtom`、派生 `tabStreamingMapAtom`/`tabIndicatorMapAtom`；helper `openTab`/`closeTab`/`updateTabTitle`。
- **内容分发**：`TabContent` 按 `type` 渲染 `ChatView`/`AgentView`/`BrowserPanel`/`SymphonyCanvas`（含 `TabErrorBoundary`）。
- **关闭与同步**：`useCloseTab`（agent 会话先 `agent_stop`、流式中弹确认）；`TabSessionSyncer` 同步会话↔标签；`WorkspaceTabCleaner` 在删除 workspace 时清理标签。
- **重指向**：`agent_stop` 等 → Ultra 命令；`AgentView`/`ChatView` 接前述「前端契约保持 + 反腐层」与 `agent:*` 流式。

**复用清单**：`components/app-shell/RightSidePanel`、`components/agent/{SidePanel,TrajectoryReel,PlanViewer,AgentTeamsPanel,BrowserViewer}`、`components/files-rail/**`、`components/preview/**`、`components/focus-mode/**`、`components/tabs/**` 及相关 hooks/atoms（`preview-panel-atoms`/`preview-editor-atoms`/`files-rail-atoms`/`focus-mode-atoms`/`tab-atoms`）。

## 模块化架构（约束 B，前后端均反 god file，专节）

### 后端：Tauri 命令（Rust）

**反面教材（双重）**：uclaw 的 `src-tauri/src/tauri_commands.rs`（**18,069 行 / ~120 命令单体**，`main.rs` 300+ 行 `generate_handler!`、命令内联业务逻辑、无服务边界）**与** `ui/src/lib/tauri-bridge.ts`（**3000+ 行的前端桥接单体**）**同为 god file 反面教材，均禁止复刻**。后端纪律如下；前端纪律见「前端模块化架构」专节。

**Ultra 桌面端强制结构**（`desktop/src-tauri/src/`）：

```
src/
  main.rs                  # 仅 builder/window/setup，保持精简
  state.rs                 # AppState：对 Hermes 各服务的 Arc 句柄
  events.rs                # agent:* 事件载荷结构体 + emit 辅助
  services/                # trait 服务层（反腐层，可脱离 Tauri 单测）
    mod.rs
    agent_service.rs       # 包装 hermes-agent AgentLoop → 流式
    session_service.rs     # 包装 SessionPersistence
    workspace_service.rs   # 桌面自有 workspace 存储(rusqlite) + 会话分组
    model_service.rs       # hermes-config / hermes-intelligence
    skill_service.rs       # hermes-skills
    memory_service.rs      # MemoryProvider
    mcp_service.rs         # hermes-mcp
    cron_service.rs        # hermes-cron
    terminal_service.rs    # portable-pty
    diagnostics_service.rs # telemetry / doctor
  commands/                # 薄 #[tauri::command]，一域一文件
    mod.rs                 # handlers() 聚合 → generate_handler!
    agent.rs   chat.rs   workspace.rs   session.rs   models.rs
    skills.rs  memory.rs  mcp.rs   cron.rs   terminal.rs
    diagnostics.rs   ui_store.rs
```

**强制纪律（写入 ADR 作为验收项）**：
1. 命令文件**一域一文件**；单文件软上限 ~400 行，超出即拆。
2. 命令体**只做四件事**：解析入参 → 调用服务 → 映射结果/错误 → emit 事件。**禁止内联业务逻辑**。
3. 业务逻辑只存在于 `services/` 的 **trait 实现**中（如 `trait WorkspaceService { fn list(); fn create(); ... }`），可不依赖 Tauri 单测。
4. 注册集中在 `commands/mod.rs` 的聚合器，`main.rs` 不出现长 `generate_handler!` 列表。
5. 服务层即反腐层：Hermes 内部类型在此翻译为前端契约（`agent:*` / `WorkspaceSession` 等）。

## 前端模块化架构（约束 B 延伸：前端同样反 god file，专节）

uclaw 的 `ui/src/lib/tauri-bridge.ts`（3000+ 行）是**前端 god file 反面教材**；本项目前端必须模块化、结构化、可维护。

### 前端 IPC 桥接（镜像后端 `commands/`，反 `tauri-bridge.ts` 单体）

```
desktop/ui/src/lib/bridge/
  index.ts        # 薄聚合 / re-export，不写逻辑
  client.ts       # invoke/listen 薄封装 + 错误归一
  agent.ts  chat.ts  workspace.ts  session.ts  models.ts
  skills.ts memory.ts mcp.ts cron.ts terminal.ts
  files.ts  preview.ts  diagnostics.ts  ui-store.ts
  events.ts       # agent:* 等事件订阅工厂
```

规则：**一域一文件**，与后端 `commands/<domain>.rs` 一一对应；类型由 `tauri-specta`/`ts-rs` **生成**（不手抄命令名）；**禁止再出现 `tauri-bridge.ts` 式巨型单文件**。

### 前端整体结构（特性化 feature-based）

```
desktop/ui/src/
  app/                 # 路由 / 壳装配（精简）
  shared/
    ui/                # shadcn 原语（设计系统）
    lib/               # 通用工具
    theme/             # 多主题（globals.css 主题层 + theme atoms）
    i18n/              # i18next + en/zh
  lib/bridge/          # 见上（IPC 桥接，按域）
  features/<domain>/   # 按域自包含：components/ hooks/ atoms/ lib/ index.ts
    chat-agent/        # message view: ai-elements + agent + chat 栈
    workspace/         # ARC 侧栏 + session/tab
    dock/              # 底部 Dock
    files/  preview/  focus-mode/  settings/  trajectory/  …
```

**前端强制纪律（写入验收项）**：
1. **特性化自包含**：每个 `features/<domain>/` 自带 components/hooks/atoms/lib，经 `index.ts` barrel 暴露**最小公共接口**；**禁止跨特性深引用**对方内部文件（只走对方 `index.ts`）。
2. **文件体量上限**：组件 ≤ ~300 行、hook/atom 模块 ≤ ~200 行、bridge 单域 ≤ ~200 行，超出即拆。
3. **关注点分离**：展示组件不直接 `invoke`；数据访问走 `lib/bridge/*` + hooks（TanStack Query / Jotai），副作用集中于 hooks。
4. **共享只下沉**：跨特性复用之物放 `shared/`，不在特性之间横向依赖。
5. **桥接单一入口**：所有 IPC 经 `lib/bridge/`，组件/atoms 不直接触碰 `@tauri-apps/api`。

> 复用 uclaw 组件时即按此结构**重新归类**（uclaw 的 `tauri-bridge.ts` 调用点改为 `lib/bridge/<domain>` 的细粒度函数），而非整文件搬运其桥接。

## Alternatives Considered

### A. 桌面集成架构

| 方案 | 优点 | 缺点 | ROI |
|---|---|---|---|
| **进程内嵌入（选中）** | 单一 ~15–30MB 二进制；无 sidecar/端口；直接复用 Ultra crate 与 uclaw 前端；原生性能 | 命令/流式桥接需自建；各 OS WebView 差异 | **最高** |
| Sidecar + HTTP/WS（cn-desktop 模式） | app/core 版本解耦 | 子进程+端口；运行时下载/校验复杂度；对 Rust 外壳冗余 | 中 |
| Electron + HTTP 客户端 | 生态庞大 | 100MB+；内置 Chromium；仍需 sidecar；放弃 Rust-first | 低 |
| 原生 Rust GUI（egui/Dioxus/Slint） | 纯 Rust | 无法复用 uclaw UI；富文本弱；离「优美」远 | 低 |

### B. 前端基座

| 方案 | 优点 | 缺点 | ROI |
|---|---|---|---|
| **uclaw 高保真复用（选中）** | Apache-2.0；架构=嵌入式；Tailwind+shadcn 更美；workspace+session+message-view 范式现成；用户自有心血 | 是别的产品域，部分领域 atoms/视图需重指向；代码量大需裁剪 | **最高** |
| cn-desktop 作整体基座 | 领域对齐 | sidecar transport 失配嵌入式；CSS Modules 生态弱于 shadcn；放弃 uclaw 的 workspace/session 灵魂 | 偏低 |
| 全新自建 | 最干净 | 工时最大；丢弃 uclaw 现成范式 | 中 |

> **更新（2026-05-28）**：cn-desktop 亦为用户自有项目，**不再受许可证限制**。最终策略 = **uclaw 作基座/灵魂（统一 shadcn 设计语言）+ cn-desktop 作 Hermes 领域屏幕的直接代码来源（重指向 transport + 换肤）**，两者代码均直接复用。

### C. message view 复用方式

| 方案 | 优点 | 缺点 | 取舍 |
|---|---|---|---|
| **保持前端契约 + 后端反腐层（选中）** | 前端 1:1 不动；翻译集中在 Rust 服务层；符合「原盘复刻」 | 需在 Rust 写映射；Hermes 无 workspace 概念需补桌面存储 | **采纳** |
| 改写前端数据层去贴 Hermes 原生 API | 后端零适配 | 前端大改，违背「原盘复刻」 | 否 |

## 许可证考量（License）

| 项目 | 许可证 | 影响 |
|---|---|---|
| **Ultra（本仓）** | MIT | 保持纯净 |
| **uclaw** | **Apache-2.0** | ✅ 可复用代码（含商用），保留版权/NOTICE，与 MIT 兼容 |
| **cn-desktop** | PolyForm Noncommercial 1.0.0（**但系用户自有版权**） | ✅ 因用户为版权方，可随时直接复用其代码。注意：若 Ultra 仓为公开 MIT 仓，并入即等于把该部分以 MIT 对外开放——作为版权方你有权如此，但需知悉此重许可效果。 |

**决策**：uclaw 与 cn-desktop **均为用户自有项目**，两者代码皆可直接复用，无许可证障碍。复用 uclaw 须随包保留其 `LICENSE` / `NOTICE`（Apache-2.0 要求）；cn-desktop 作为自有代码可直接搬运。若 Ultra 主仓将来公开，需留意上表的重许可效果。

## 架构（Architecture）

```
┌──────────────────────────────────────────────────────────────────┐
│  desktop/ui  (React + Vite + Tailwind + shadcn/ui)                 │
│   ├─ 高保真复用自 uclaw:                                            │
│   │    • Workspace+Session 主干 (workspace.ts / tab-atoms.ts)      │
│   │    • LeftSidebar + ARC 式切换 (framer-motion / useWorkspaceSwipe)│
│   │    • Agent message view 全栈 (ai-elements/ + agent/ + chat/)    │
│   ├─ i18next (en + zh)                                             │
│   ├─ Jotai(客户端) + TanStack Query(列表/轮询)                     │
│   └─ lib/bridge.ts  (类型由 tauri-specta 生成；保持 agent:* 契约)   │
└───────────────┬────────────────────────────────┬───────────────────┘
   invoke(cmd)   │                                │  listen('agent:*') / Channel
                 ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  desktop/src-tauri  (Rust, Tauri v2)                               │
│   commands/*.rs  (薄, 一域一文件)                                   │
│        │ 调用                                                       │
│   services/*.rs  (trait 服务层 = 反腐层: Hermes → uclaw 前端契约)   │
└───────────────┬────────────────────────────────┬───────────────────┘
                ▼                                ▼
   hermes-agent (AgentLoop, SessionPersistence)   hermes-gateway
   hermes-config / -intelligence / -skills / -mcp / -cron / -telemetry
   + 桌面自有: workspaces / workspace_sessions (rusqlite)
```

## v1 屏幕地图（broad parity；主干 = uclaw workspace+session+message-view）

> 导航位置（Dock 高频 / 设置低频）见「导航信息架构」专节；下表聚焦各屏与 Ultra 后端的映射。

| 屏幕 | Ultra 后端（已存在） | UI 来源 |
|---|---|---|
| **Chat / Agent workbench（message view，1:1 复刻）** | `AgentLoop` 流式 | **uclaw ai-elements/ + agent/** |
| **左侧栏 workspace 切换（ARC 式）** | 桌面自有 workspace 存储 + `SessionPersistence` | **uclaw LeftSidebar + workspace/** |
| Session history / detail | `SessionPersistence` | uclaw + cn-desktop 直接复用（重指向+换肤） |
| Models / providers | `hermes-config` / `hermes-intelligence` | shadcn 表单 |
| Skills | `hermes-skills` | cn-desktop 直接复用（重指向+换肤） |
| Memory | `MemoryProvider` | uclaw memory 思路 |
| MCP servers | `hermes-mcp` | cn-desktop 直接复用（重指向+换肤） |
| Cron | `hermes-cron` | cn-desktop 直接复用（重指向+换肤） |
| Console（PTY） | `portable-pty`（新增命令） | xterm.js |
| Health / Logs / Analytics | `hermes-telemetry` / doctor | recharts |
| Projects / Profiles / Advanced | `hermes-config` | uclaw shell |

## 实现路径（Implementation Path）

- **Phase 0 — 法务与抽取边界**：保留 uclaw `LICENSE`/`NOTICE`；划定「整目录复用」（ai-elements/agent/chat 消息栈、workspace/ 与 app-shell/LeftSidebar、`workspace.ts`/`tab-atoms.ts`/`agent-atoms.ts`/`chat-atoms.ts`、构建/样式配置）与「需重指向」（数据源从 uclaw 命令 → Hermes 反腐层）。

- **Phase 1 — 脚手架 `desktop/`**：建 Tauri v2 应用；`desktop/src-tauri` 加入 Cargo workspace；移植 uclaw 构建/样式/shadcn 配置；接入 i18next（en + zh）；**先立 `commands/` + `services/` 模块骨架与纪律**（约束 B）。

- **Phase 2 — 复刻导航主干（左侧栏 + Dock）+ 多主题**（约束 A/C + 多主题）：整目录复制 `app-shell/LeftSidebar`、`workspace/`、`workspace.ts`/`tab-atoms.ts`/`workspace-icons.ts`，接 `workspace_service`，验证 ARC 滑动/手势/图标密度；**复用 uclaw 底部 Dock**（`components/dock/` + `dock-atoms`），重建 `MODE_REGISTRY` 映射 Hermes 高频域；**复用 uclaw 多主题系统**（`globals.css` 主题层 + `theme.ts` + `applyThemeToDOM` + `AppearanceSettings`），`ThemeInitializer` 接 `ui_store`。

- **Phase 3 — 反腐层与 message view 1:1 复刻**（约束 A）：实现 `agent_service` / `session_service`，以 `agent:*` 事件 + 相同命令名对接 `AgentLoop`/`SessionPersistence`；整目录复制 `ai-elements/`+`agent/`+`chat/` 消息栈与 `agent-atoms.ts`；端到端打通流式渲染（text-delta/thinking/tool-start/tool-result/turn_cost/done）。

- **Phase 3.5 — App Shell 复刻（右侧面板 + 预览 + Focus + 标签栏）**：整目录复制 `components/app-shell/RightSidePanel`、`files-rail/**`、`preview/**`、`focus-mode/**`、`tabs/**` 及相关 atoms；把文件 I/O / 监听 / artifact / `agent_stop` 重指向新 `files_service` 等 Tauri 命令；右侧面板先落 Files + Trajectory（Teams/Plan/Browser 视 Ultra 能力接入或隐藏）。

- **Phase 4 — 直接复用 cn-desktop 的 Hermes 领域屏幕**：搬运 `web/src/routes/` 领域屏幕与 `web/src/hooks/` 领域 hooks（models/skills/memory/mcp/cron/console/health/logs/analytics/profiles/im-onboarding），(a) 数据层从 `api_request`-over-HTTP **重指向**到本项目 Tauri 命令/反腐层，(b) **换肤到 shadcn/Tailwind** 与 uclaw 壳统一；作为标签/路由内嵌。列表/轮询沿用 TanStack Query。

- **Phase 4.5 — App 设置窗口（基于 openhuman）**：lift openhuman 的 `SettingsMenuItem` / `SettingsHeader` / `PageBackButton` / `useSettingsNavigation` / `SettingsSectionPage` 原语并换肤到 shadcn；两栏（左分类导航 + 右内容）布局；落各低频配置/诊断分页（Appearance/Providers&Models/MCP/Cron/Integrations/Profiles/Diagnostics/Advanced/About），数据经各 Tauri service / `ui_store`。

- **Phase 5 — i18n / 主题品牌化 / 视觉**：抽字符串到 `en.json`+`zh.json`，CJK 排版；在已复用的多主题体系上新增 Hermes 品牌主题（`.theme-hermes-*`）；视觉细节单独走设计轮（design-consultation / design-shotgun）。

- **Phase 6 — 打包分发**：macOS 通用 DMG + Windows NSIS；`tauri-plugin-updater`；签名/公证；扩展 GitHub Actions。

## Consequences

**正面**
- 单一二进制、无 sidecar/端口、无运行时下载校验 —— 运维与分发显著简化。
- 高保真复用 uclaw（含 workspace+session+message-view 范式），前端工时预估省 ~60–70%，并保留用户的设计意图。
- 复用 Ultra 既有后端；主要工作量集中在反腐层 + 命令模块化 + i18n + 领域屏幕，而非新增 agent 能力。
- **cn-desktop 领域屏幕与 hooks 可直接复用**（同为自有项目），其已对接 Hermes 的领域逻辑（sessions/skills/memory/cron/mcp/models/IM 引导）省去从零重建，主要剩「重指向 transport + 换肤」。
- **多主题系统、底部 Dock、设置页均可高复用**（uclaw 主题/Dock + openhuman 设置原语，三者均为用户自有），省去自研导航、主题工程与设置框架。
- 命令严格模块化 + trait 服务层，从一开始规避 god file，提升可测试性与可维护性。
- 许可证干净，未来商业化无需返工。

**负面 / 成本**
- uclaw 体量大（458 TSX / ~338 atoms），需裁剪与领域中立化。
- 反腐层需在 Rust 写 Hermes ↔ uclaw 契约映射；workspace 概念需新建桌面侧存储。
- 自建命令/流式桥接：uclaw 的 `tauri-bridge.ts`（3000+ 行）与 `tauri_commands.rs`（18K 行）**均为 god file 反面教材**，仅作功能参考、按域重写，不可照搬；复用 uclaw 组件时也需按特性化结构重新归类。
- cn-desktop 领域屏幕**换肤到 shadcn** 需额外工时（CSS Modules → Tailwind/shadcn）；其 hooks 的 transport 需从 HTTP 重指向到 Tauri 命令。

**风险**
- 各 OS WebView 渲染差异 —— 需双端 QA。
- `agent:*` 事件与 Hermes 流式语义的细粒度对齐（thinking/tool/retry/compact 等 20+ 事件类型）需逐一核对。
- 领域 atoms 重指向工作量易低估 —— 以「复用渲染、重指向数据」为纪律。

## Follow-up / 验收标准

- [ ] `desktop/` 在 macOS 与 Windows 各自 `tauri build` 出可运行产物。
- [ ] **Agent message view 与 uclaw 视觉/交互一致**（流式 text-delta、thinking 折叠、tool-start/result、turn_cost），数据源为 Hermes。
- [ ] **左侧栏 workspace 管理 + ARC 式切换**复刻到位（滑动方向、手势预览、>5 图标坍缩）。
- [ ] **底部 Dock** 复刻到位（hover 唤出、磁化、拖拽重排、pinned），`MODE_REGISTRY` 映射到 Hermes 高频域。
- [ ] **多主题系统**复用到位（light/dark/system + uclaw 命名主题可切换并持久化到 `ui_store`）。
- [ ] **App 设置窗口**（基于 openhuman 原语、换肤 shadcn、两栏布局）承载低频配置/诊断分页；Appearance 分页内含主题选择器。
- [ ] **右侧面板**五标签框架就位（Files + Trajectory 可用；Teams/Plan/Browser 视 Ultra 能力接入或隐藏），按 workspace 记忆激活页。
- [ ] **Files 标签**：工作区文件树（懒加载/图标/右键菜单）、文件改动、附加目录可用，文件系统变更实时刷新。
- [ ] **文件预览面板**：多类型渲染（code/md/image/pdf/diff…）、file 多标签分页、与聊天区可拖拽分屏，Agent 写文件自动预览。
- [ ] **Focus 模式**复刻到位（Alt+F、边缘辉光、浮动岛滑入/隐藏、Esc 退出）。
- [ ] **聊天区 Session 标签栏**复刻到位（按类型图标、流式指示、hover 迷你预览、关闭确认、workspace 切换滑动）。
- [ ] workspace 为桌面侧存储，session 主体来自 `SessionPersistence`，分组正确。
- [ ] **后端无 god file**：命令一域一文件、命令体无业务逻辑、业务在 trait 服务层、`main.rs` 无长 `generate_handler!`。
- [ ] **前端无 god file**：无 `tauri-bridge.ts` 式单体；IPC 桥接 `lib/bridge/<domain>` 与后端一一对应；前端按 `features/<domain>` 特性化组织、经 `index.ts` 暴露接口、无跨特性深引用、文件不超体量上限。
- [ ] 14 屏具备占位路由，核心屏（chat/agent、workspace、sessions、models、skills）可用。
- [ ] 全量 UI 无硬编码字符串；`en`/`zh` 可切换并持久化。
- [ ] 复用自 uclaw 的文件保留 Apache-2.0 归属；复用自 cn-desktop 的领域屏幕已**重指向 Tauri 命令并换肤到 shadcn**（视觉与 uclaw 壳统一）。
- [ ] CI 出 macOS 通用 DMG 与 Windows NSIS；接入自动更新。

## 备注

本 ADR 以中文撰写以契合当前协作语言；英文对等版本见 [DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.en.md](./DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.en.md)。后续可经 superpowers `writing-plans` 技能将本 ADR 拆解为可执行实现计划。
