# @wang-junjian/dsh-artifact-viewer

A DeepSeek Harness bundle plugin that adds an artifact sidebar and bookmarking
for agent conversations.

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

## Installation

Install the plugin into a DeepSeek Harness profile. The plugin does not modify
the `deepseek-harness` repository itself.

```sh
# From a local checkout
dsh plugin --profile web add /Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer

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

## Bookmarks file format

Bookmarks are stored at `<project-root>/.dsh/bookmarks.json`:

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

## Host RPC endpoints

The host half registers a loopback-only channel at `/artifact-viewer`:

- `bookmarks/read` — returns the bookmark array.
- `bookmarks/write` — writes the bookmark array.
- `file/preview` — returns UTF-8 file content or base64-encoded binary data
  (for images/SVG/HTML) up to 512 KiB.

## Known limitations

- The panel floats over the app via `shell.overlay`; a native right-column slot
  would be preferable once dsh exposes one.
- Preview of bookmarked images is limited because bookmarks only store the
  attachment id, not the full image reference.
- Video files are listed but not previewed inline.
