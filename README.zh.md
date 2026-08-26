# @wangjunjian/dsh-artifact-viewer

[English](README.md) | 中文

一个 DeepSeek Harness 的 bundle 插件，为 Agent 对话添加产物侧边栏与收藏功能。
该插件**不会**修改 `deepseek-harness` 源码；它作为独立插件构建，然后加载到
`web` profile 中使用。

## 功能

- **自动检测对话中生成的产物**：工具创建或编辑的文件，以及消息中的图片附件。
- **在右侧渲染悬浮面板**（注册到 `shell.overlay`），列出当前会话的产物。
- **允许用户收藏产物**；收藏数据由 host 端持久化到 Harness 用户目录
  `~/.dsh/storages/artifact-viewer/bookmarks.json`。
- **替换默认的消息图片渲染器**（`conversation.message.images`），在图片上
  叠加收藏星星按钮。
- **拦截会话窗口中的文件链接**，包括工具行 `.fileLink` 按钮、
  `ui-deliverables` 的“产物”标签、结束语中的行内代码文件提及、Markdown
  链接（如 `[sample.html](/Users/.../sample.html)`）和行内 `<code>` 路径
  （如 `/Users/.../cat.svg`），点击生成的文件时直接在产物面板中打开，而
  不是调用宿主默认应用。
- **点击产物在面板内以标签页预览**，支持 HTML（沙箱 iframe）、Markdown、
  图片、SVG、JSON 和源代码。
- **通过 workspace API 调用宿主默认应用打开文件**，或打开预览产物所在的文件夹。
- **通过标题栏按钮将面板放大到整个窗口**；当用户设置了背景图片时，全屏模式
  会自动使用不透明背景，避免重叠加模糊；纯色背景下仍保留半透明毛玻璃效果。
- **从收藏的文档跳转回生成它的会话**：在"收藏"标签页或预览标题栏中点击
  "打开对话"按钮即可切换会话。

## 安装

将插件安装到 DeepSeek Harness 的 profile 中。该插件不会修改
`deepseek-harness` 仓库本身。

```sh
# 从本地目录安装
dsh plugin --profile web add ~/GitHub/wang-junjian/dsh-artifact-viewer

# 或者发布之后从 registry 安装
dsh plugin --profile web add @wangjunjian/dsh-artifact-viewer
```

bundle 会被自动追加到 `dsh.profile.bundles`。

### Cordis 配置

你可以在 profile 的 `cordis.patch.yml` 中覆盖插件配置：

```yaml
- id: artifact-viewer
  config:
    enabled: true
```

## 开发

`@deepseek-ai/dsh-*` 依赖均为 registry 上的常规包（目前是 rc 版本），无需本地检出
`deepseek-harness` 仓库。

```sh
pnpm install
pnpm run typecheck
pnpm run build
pnpm run test
pnpm run lint
```

## 项目结构

```
src/
  index.ts                    # Node/host 端：收藏 + 预览 RPC
  client/
    index.ts                  # 浏览器端：slot 注册
    store.ts                  # 面板 UI 状态 store
    locales.ts                # 中英文案
    current-session.ts        # 当前会话快照的 observable 源
    bookmarks.ts              # 浏览器端收藏控制器
    artifacts.ts              # 从 ConversationSnapshot 中检测产物
    display.ts                # 展示/收藏转换辅助函数
    ArtifactToggle.tsx        # sidebar.footer.action 入口
    ArtifactPanel.tsx         # shell.overlay 面板
    ArtifactList.tsx          # 面板内的产物列表
    ArtifactPreview.tsx       # 选中产物的预览区
    ArtifactMessageImages.tsx # conversation.message.images 替换
```

## 支持的预览

| 文件类型 | 渲染方式 |
|---------|---------|
| HTML、HTM | 沙箱 iframe |
| Markdown、MD | Markdown 文本（mermaid 代码块渲染为 SVG 图表） |
| SVG、PNG、JPG、JPEG、WEBP、GIF | 图片 |
| JSON | 语法高亮代码（通过 CodeBlock） |
| 源代码（py、js、ts、jsx、tsx、css、scss、less、rs、go、c、cpp、cc、java、kt、swift、rb、php、sh、sql、xml、yaml、yml、toml、dockerfile、txt、log） | 语法高亮代码 |
| 纯文本 / 未知类型 | 预格式化文本 |
| 视频（mp4、webm、mov） | 仅列出，不内联预览 |

## 收藏文件格式

收藏数据保存在 DeepSeek Harness 用户目录下：
`~/.dsh/storages/artifact-viewer/bookmarks.json`。文件按规范化的项目路径
分组，多个项目可以共用同一个存储文件但彼此隔离：

```json
{
  "version": 1,
  "projects": {
    "/workspace/project-a": [
      {
        "id": "file:/workspace/foo.ts:42",
        "kind": "file",
        "name": "foo.ts",
        "path": "/workspace/foo.ts",
        "seq": 42,
        "sessionId": "<session-id>",
        "createdAt": 1234567890
      }
    ]
  }
}
```

### 存储位置与跨浏览器一致性

DSH 用户目录通过 `@deepseek-ai/dsh-home-paths` 解析，优先使用环境变量
`$DSH_HOME`，否则回退到 `~/.dsh`。由于收藏存储在 Harness 用户目录而不是
项目目录下，同一项目在不同浏览器（Chrome、Safari 等）中打开时会读取同一
个收藏文件，前提是两个浏览器解析出的工作空间路径一致。host 端在把路径
用作查询 key 之前会先用 `fs.realpath` 规范化，因此 macOS 上
`/var/folders` 和 `/private/var/folders` 这类符号链接差异不会导致收藏
在不同浏览器中分裂。

### 从旧版本迁移

在此之前的版本把收藏保存在 `<project-root>/.dsh/bookmarks.json`。这些
文件已不再被读取；如果你已有旧位置的收藏，可以手动迁移到
`~/.dsh/storages/artifact-viewer/bookmarks.json`，把它们放到对应项目
的规范化路径 key 下，也可以直接在 UI 中重新收藏。

## Host RPC 端点

Host 端注册了一个仅本地回环的 RPC 通道 `/artifact-viewer`：

- `bookmarks/read` — 返回收藏数组。
- `bookmarks/write` — 写入收藏数组。
- `file/preview` — 返回 UTF-8 文本内容，或 base64 编码的二进制数据
  （用于图片/SVG/HTML），上限 512 KiB。非 UTF-8 的文本文件会被拒绝，
  避免二进制文件被渲染成乱码。

## 已知限制

- 面板通过 `shell.overlay` 悬浮在应用之上；如果 dsh 后续暴露原生的右栏
  slot，迁移过去会更合适。
- 收藏图片的预览受限，因为收藏只保存了 attachment id，没有保存完整图片引用。
- 视频文件仅列出，不支持内联预览。
- 在增加 `sessionId` 字段之前创建的收藏，无法跳转回原始会话。
