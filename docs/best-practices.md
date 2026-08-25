# DSH 插件开发最佳实践总结

本文档基于 `@wang-junjian/dsh-artifact-viewer` 的开发过程，梳理在 DeepSeek Harness（DSH）生态中开发 bundle 插件的关键实践、常见踩坑与推荐做法。

## 1. 插件架构：host 端与 client 端分离

DSH 插件通常由两个半部分组成：

- **Host 半部分**（`src/index.ts`）：在 Node 端运行，负责持久化数据、文件系统访问、RPC 注册。
- **Client 半部分**（`src/client/index.ts`）：在浏览器端运行，负责注册 slot、渲染 UI、响应用户交互。

### 实践要点

- host 端通过 `connection.rpc.handle(channel, handler, { authority: 'loopback' })` 暴露本地 RPC。
- client 端通过 `ctx.slots.inject` 监听 slot 声明，并通过 `ctx.slots.register` 注册组件。
- 跨端通信只通过 RPC 通道，不要在 client 端直接访问 Node API。

## 2. RPC 通道命名

### 踩坑

最初使用 `/plugin/artifact-viewer` 作为 RPC channel，DSH 启动时报错：

```
connection: invalid or reserved RPC channel "/plugin/artifact-viewer"
```

### 推荐做法

- 不要使用 `/plugin/*` 前缀，该前缀被 DSH 保留。
- 使用应用自定义的短路径，例如 `/artifact-viewer`。
- 在 client 和 host 端使用同一个常量，避免拼写不一致。

## 3. Slot 注册与优先级

### 踩坑

注册 `conversation.message.images` 时使用默认优先级，报错：

```
single slot "conversation.message.images" already has a registration at priority 0
```

### 推荐做法

- 替换 single slot 时，设置 `priority: -1` 以 shadow 默认实现。
- additive slot（如 `sidebar.footer.action`、`conversation.session.header.actions`）通常不需要调整优先级，按 `order` 排序即可。
- 在注册前先用 `ctx.slots.inject` 声明注入，确保依赖的 slot 已存在。

## 4. 状态管理：使用 DSH 的 defineStore

- 使用 `@deepseek-ai/dsh-client-runtime/client` 提供的 `defineStore` 创建面板状态。
- actions 是 Immer draft mutator，写法简洁且类型安全。
- 通过 `createArtifactViewerStore().create()` 可在测试中获得真实 store 实例，无需 mock hook。

## 5. 会话与书签

### 获取当前会话

- 通过 `ctx.sessions.list.getSnapshot().current` 获取当前会话 ID。
- 使用 `ctx.sessions.binding(sessionId).session` 订阅会话快照。
- 封装为 `CurrentSessionSource` 便于组件消费。

### 持久化收藏

- 收藏数据保存在 `<project>/.dsh/bookmarks.json`。
- 写文件时使用 `writeFile(tmp)` + `rename(tmp, file)`，保证原子性。
- bookmark 记录中保留 `sessionId`，用于后续"跳转回源会话"功能。

### 跳转源会话

- 注入 `ctx.sessions.open(sessionId)` 到面板 face。
- 只在收藏（bookmarks）标签页显示"打开对话"按钮，当前会话产物不需要。

## 6. UI 设计原则

### 侧边栏按钮

- 注册到 `sidebar.footer.action`，样式参考 DSH 设置按钮，保持左对齐和一致的尺寸。
- 区分 `wide` 和 rail 模式，rail 模式下只显示图标。

### 右侧面板

- 注册到 `shell.overlay`，默认以悬浮面板形式展示。
- 标题栏从左到右：产物图标/标题、预览标签页、操作按钮（收藏、放大、关闭）。
- 操作按钮右对齐，使用图标按钮减少视觉噪音。

### 标签页行为

- 点击产物列表中的文件打开新标签页，已打开则激活。
- 标签页标题自适应宽度，超出时隐藏最早标签，关闭后自动释放空间。
- 标签页本身使用真实 `<button>`，而不是 `div role="button"`，满足 a11y。

### 文件预览

| 类型 | 推荐渲染方式 |
|------|-------------|
| HTML/HTM | 沙箱 iframe |
| Markdown | `MarkdownText` |
| 图片/SVG | `<img>` |
| 源代码/JSON | `CodeBlock`，但隐藏自带标题和复制按钮，自行控制样式 |
| 纯文本 | `<pre>` |

- 文本文件读取后先校验 UTF-8，避免二进制文件显示乱码。
- 二进制文件走 base64 通道。

## 7. 背景与全屏适配

### 踩坑

用户设置背景图片后，面板放大到全屏会出现背景"重叠加模糊"。

### 解决方案

- 检测当前主题背景：
  - `getComputedStyle(body).getPropertyValue('--dsw-alias-bg-base')` 是否包含 `url(` / `transparent`
  - 或 `getComputedStyle(body).backgroundImage !== 'none'`
- 如果是图片/透明背景，给全屏面板添加 `.opaque` 类，使用静态不透明色并移除 `backdrop-filter`。
- 纯色背景时保留半透明毛玻璃效果。

## 8. 图标与视觉一致性

- 优先使用 `@deepseek-ai/dsh-client-ui-primitives` 提供的图标。
- 需要自定义图标时（如五角星收藏），保持 16×16 viewBox、1.4 strokeWidth、一致的圆角/连接风格。
- 所有自定义 SVG 图标统一风格，避免视觉大小不一。

## 9. 构建与打包

### tsdown 配置

- client bundle 输出为 CJS 格式，并通过 `__ModuleLoader__.load` 注册到浏览器模块表。
- 将 `react`、`react-dom`、DSH 相关包声明为 external，避免重复打包。
- 对 CSS Modules 使用 `lightningcss` 编译并注入为 style tag。

###  purity gate

- 在 tsdown plugin 中检查 `@deepseek-ai/*` 导入，阻止未加入 module table 的包被内联，避免运行时 scope tag 不匹配。

## 10. 测试

### Host 端测试

- 使用 `vitest` + 临时目录，测试 RPC handler 的读写、文件预览、错误码。
- mock `connection.rpc.handle` 收集 handler。

### Client 端测试

- 使用 `@testing-library/react` + `jsdom`。
- 注意 DSH 与插件项目可能存在两个 React 副本，需在 `vitest.config.ts` 中配置 alias 指向本项目的 react/react-dom。
- 避免直接测试依赖 DSH module loader 的组件；优先测试纯 props 组件。

## 11. 代码规范

- 使用 Biome 进行 lint 和 format，配置 `lineWidth: 120`、单引号、trailing commas。
- package.json 中提供 `lint`、`lint:fix`、`format` 脚本。
- CI 前应跑通 `lint`、`typecheck`、`build`、`test`。

## 12. 安装与部署

```sh
# 本地开发版本
dsh plugin --profile web add /Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer

# 发布后
dsh plugin --profile web add @wang-junjian/dsh-artifact-viewer
```

- 插件不修改 `deepseek-harness` 源码，独立构建后通过 profile 加载。
- 修改插件后需要重新 build，然后刷新 DSH Web 页面。

## 13. 调试技巧

- 插件报错时优先查看 DSH 启动日志，常见错误：
  - RPC channel 被保留
  - single slot 优先级冲突
  - module table 外部包被内联
- 浏览器控制台查看 `window.__ModuleLoader__` 可确认插件 bundle 是否加载。
- 样式问题先检查 CSS 变量是否被 DSH 主题正确赋值。

## 14. 推荐开发流程

1. 在 `src/index.ts` 实现 host 端 RPC。
2. 在 `src/client/index.ts` 注册 slot 并注入所需 face。
3. 实现具体组件，保持组件纯 props，便于测试。
4. 添加/更新 locale 文案。
5. 运行 `pnpm run lint`、`pnpm run typecheck`、`pnpm run build`、`pnpm test`。
6. 在 DSH 中通过 `dsh plugin --profile web add <path>` 安装并验证。
7. 迭代 UI 细节，注意主题背景和暗色模式。

---

本总结会随着插件迭代持续更新。
