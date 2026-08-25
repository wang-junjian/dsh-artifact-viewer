# @wang-junjian/dsh-artifact-viewer

[English](README.md) | 中文

一个 DeepSeek Harness 的 bundle 插件，为 Agent 对话添加产物侧边栏与收藏功能。
该插件**不会**修改 `deepseek-harness` 源码；它作为独立插件构建，然后加载到
`web` profile 中使用。

## 功能

- **自动检测对话中生成的产物**：工具创建或编辑的文件、JSON 工具结果，以及
  消息中的图片附件。
- **在右侧渲染悬浮面板**（注册到 `shell.overlay`），列出当前会话的产物。
- **允许用户收藏产物**；收藏数据由 host 端持久化到
  `<project-root>/.dsh/bookmarks.json`。
- **替换默认的消息图片渲染器**（`conversation.message.images`），在图片上
  叠加收藏星星按钮。
- **点击产物在面板内以标签页预览**，支持 HTML（沙箱 iframe）、Markdown、
  图片、SVG、JSON 和源代码。
- **通过 workspace API 调用宿主默认应用打开文件**。
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
dsh plugin --profile web add @wang-junjian/dsh-artifact-viewer
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

本包使用指向本地 `deepseek-harness` 仓库的 `link:` 依赖，因此无需放入
monorepo workspace 即可解析 `@deepseek-ai/dsh-*` 包。

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
| Markdown、MD | Markdown 文本 |
| SVG、PNG、JPG、JPEG、WEBP、GIF | 图片 |
| JSON | 语法高亮代码（通过 CodeBlock） |
| 源代码（py、js、ts、jsx、tsx、css、scss、less、rs、go、c、cpp、cc、java、kt、swift、rb、php、sh、sql、xml、yaml、yml、toml、dockerfile、txt、log） | 语法高亮代码 |
| 纯文本 / 未知类型 | 预格式化文本 |
| 视频（mp4、webm、mov） | 仅列出，不内联预览 |

## 收藏文件格式

收藏数据保存在 `<project-root>/.dsh/bookmarks.json`：

```json
[
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
```

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
