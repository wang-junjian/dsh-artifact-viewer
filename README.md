# @wang-junjian/dsh-artifact-viewer

[中文](README.zh.md) | English

A DeepSeek Harness bundle plugin that adds an artifact sidebar and bookmarking
for agent conversations. It does **not** modify the `deepseek-harness` source
tree; it is built as a standalone plugin and loaded into the `web` profile.

## What it does

- **Detects artifacts** produced during a conversation: files created or edited
  by tools, JSON tool results, and image attachments in messages.
- **Renders a right-hand overlay panel** (registered into `shell.overlay`)
  listing artifacts for the current session.
- **Lets users bookmark artifacts**; bookmarks are persisted in
  `<project-root>/.dsh/bookmarks.json` by the host half.
- **Replaces the default message-image renderer**
  (`conversation.message.images`) with one that adds a bookmark star overlay.
- **Opens clicked artifacts in preview tabs** inside the panel and renders
  HTML (sandboxed iframe), Markdown, images, SVG, JSON, and source code.
- **Can open files with the host default application** via the workspace API.
- **Expands the panel to full window** with a header button; automatically uses
  an opaque background when the user has set a background image, while keeping
  the translucent blurred look for solid-color themes.
- **Navigates from a bookmark back to its source session** via the header
  "open conversation" button in the bookmarks tab or preview pane.

## Installation

Install the plugin into a DeepSeek Harness profile. The plugin does not modify
the `deepseek-harness` repository itself.

```sh
# From a local checkout
dsh plugin --profile web add ~/GitHub/wang-junjian/dsh-artifact-viewer

# Or from a registry, once published
dsh plugin --profile web add @wang-junjian/dsh-artifact-viewer
```

The bundle is appended to `dsh.profile.bundles` automatically.

### Cordis config

You can override the plugin config in your profile's `cordis.patch.yml`:

```yaml
- id: artifact-viewer
  config:
    enabled: true
```

## Development

This package uses `link:` dependencies that point at a local checkout of
`deepseek-harness`, so it can resolve `@deepseek-ai/dsh-*` packages without
being inside the monorepo workspace.

```sh
pnpm install
pnpm run typecheck
pnpm run build
pnpm run test
pnpm run lint
```

## Project layout

```
src/
  index.ts                    # Node/host half: bookmarks + preview RPC
  client/
    index.ts                  # Browser half: slot registrations
    store.ts                  # Panel UI state store
    locales.ts                # Chinese/English copy
    current-session.ts        # Observable source for the current session snapshot
    bookmarks.ts              # Browser bookmark controller
    artifacts.ts              # Artifact detection from ConversationSnapshot
    display.ts                # Display/bookmark conversion helpers
    ArtifactToggle.tsx        # sidebar.footer.action entry
    ArtifactPanel.tsx         # shell.overlay panel
    ArtifactList.tsx          # Artifact list inside the panel
    ArtifactPreview.tsx       # Preview pane for selected artifact
    ArtifactMessageImages.tsx # conversation.message.images replacement
```

## Supported previews

| File kind | Rendering |
|-----------|-----------|
| HTML, HTM | Sandboxed iframe |
| Markdown, MD | Markdown text |
| SVG, PNG, JPG, JPEG, WEBP, GIF | Image |
| JSON | Syntax-highlighted code (via CodeBlock) |
| Source code (py, js, ts, jsx, tsx, css, scss, less, rs, go, c, cpp, cc, java, kt, swift, rb, php, sh, sql, xml, yaml, yml, toml, dockerfile, txt, log) | Syntax-highlighted code |
| Plain text / unknown | Pre-formatted text |
| Video (mp4, webm, mov) | Listed; no inline preview |

## Bookmarks file format

Bookmarks are stored in the DeepSeek Harness home under
`~/.dsh/storages/artifact-viewer/bookmarks.json`. The file groups bookmarks by
canonical project path, so multiple projects can share one store while staying
isolated:

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

### Storage location and cross-browser consistency

The DSH home directory is resolved via `@deepseek-ai/dsh-home-paths`, which
honors the `$DSH_HOME` environment variable and falls back to `~/.dsh`. Because
the store lives in the Harness home rather than inside any project directory,
switching between browsers (Chrome, Safari, etc.) for the same project reads the
same bookmark file, provided both browsers resolve the workspace to the same
canonical path. The host normalizes `projectPath` with `fs.realpath` before it
is used as a lookup key, so macOS symbolic-link differences such as
`/var/folders` vs `/private/var/folders` do not split bookmarks across browsers.

### Migration from earlier versions

Versions before this change stored bookmarks at
`<project-root>/.dsh/bookmarks.json`. Those files are no longer read; if you
have existing bookmarks in the old location, move them into the new store under
`~/.dsh/storages/artifact-viewer/bookmarks.json` and wrap them under the
project's canonical path key, or re-create the bookmarks in the UI.

## Host RPC endpoints

The host half registers a loopback-only channel at `/artifact-viewer`:

- `bookmarks/read` — returns the bookmark array.
- `bookmarks/write` — writes the bookmark array.
- `file/preview` — returns UTF-8 file content or base64-encoded binary data
  (for images/SVG/HTML) up to 512 KiB. Non-UTF-8 text files are rejected with
  an error so that binary files are not rendered as garbled text.

## Known limitations

- The panel floats over the app via `shell.overlay`; a native right-column slot
  would be preferable once dsh exposes one.
- Preview of bookmarked images is limited because bookmarks only store the
  attachment id, not the full image reference.
- Video files are listed but not previewed inline.
- Bookmarks created before the `sessionId` field was added cannot be navigated
  back to their source session.
