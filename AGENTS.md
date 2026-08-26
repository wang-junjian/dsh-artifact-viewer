# AGENTS.md

Guidance for AI coding agents working in this repository. The reader is assumed
to know nothing about the project.

## Project overview

`@wangjunjian/dsh-artifact-viewer` is a **DeepSeek Harness (DSH) bundle plugin**
(published on npm, MIT licensed) that adds an artifact sidebar and bookmarking
for agent conversations in the DSH `web` profile. It does not modify the
`deepseek-harness` source tree; it is a standalone package installed into a
profile with `dsh plugin --profile web add <pkg>`.

The plugin:

- Detects artifacts produced during a conversation (files created/edited by
  tools, image attachments) and lists them in a right-hand
  overlay panel registered into the `shell.overlay` slot.
- Lets users bookmark artifacts; bookmarks are persisted by the host half at
  `~/.dsh/storages/artifact-viewer/bookmarks.json` (grouped by canonical
  project path).
- Replaces the default `conversation.message.images` renderer with one that
  adds a bookmark star overlay, and intercepts file links in the conversation
  so generated files open inside the artifact panel.
- Renders previews for HTML (sandboxed iframe), Markdown, images/SVG, JSON,
  and source code; videos are listed but not previewed inline.

## Technology stack

- **Language**: TypeScript (strict mode), ESM (`"type": "module"`), React 18.
- **Runtime halves**: a Node/host half (`src/index.ts`) and a browser half
  (`src/client/`), communicating only through a loopback RPC channel.
- **Framework**: `@deepseek-ai/cordis` plugin model (`name`, `inject`,
  `Config`, `apply(ctx, config)`) plus the DSH client slot system
  (`ctx.slots.inject` / `ctx.slots.register`).
- **Config schema**: `@deepseek-ai/schemastery` (the only runtime dependency);
  `apply()` receives config with schema defaults already applied.
- **Package manager**: pnpm 10 (pinned via `packageManager`; lockfile committed).
- **Build**: `tsc` (TypeScript 6, NodeNext) + `tsdown` (Rolldown-based bundler)
  + `lightningcss` for CSS Modules.
- **Lint/format**: Biome 2 (`biome.json`).
- **Tests**: Vitest 4 + jsdom + `@testing-library/react`.
- **Peer dependencies**: the `@deepseek-ai/dsh-*` packages are regular registry
  packages (release candidates), so no local checkout of `deepseek-harness` is
  needed for development.

## Repository layout

```
src/
  index.ts                    # Node/host half: Cordis plugin, bookmarks store, preview RPC
  css-modules.d.ts            # Ambient declarations for *.module.css imports
  client/
    index.ts                  # Browser half entry: locale + slot registrations
    store.ts                  # Panel UI-state store (defineStore from dsh-client-runtime)
    types.ts                  # Artifact/ArtifactKind types shared across the client
    locales.ts                # zh/en dictionaries under the 'artifact-viewer' namespace
    current-session.ts        # Observable source for the current session snapshot
    bookmarks.ts              # Browser bookmark controller backed by the host RPC
    artifacts.ts              # Artifact detection from ConversationSnapshot
    display.ts                # Artifact/bookmark -> DisplayItem conversion helpers
    ArtifactToggle.tsx        # sidebar.footer.action entry (panel toggle button)
    ArtifactPanel.tsx         # shell.overlay panel (list + preview + bookmarks tabs)
    ArtifactList.tsx          # Artifact list inside the panel
    ArtifactPreview.tsx       # Preview pane for the selected artifact
    ArtifactMessageImages.tsx # conversation.message.images replacement with star overlay
    ArtifactKindIcon.tsx      # Per-kind icon shown before an artifact name
    StarIcon.tsx              # 16x16 bookmark star icon
    *.module.css              # CSS Modules next to their components
tests/
  plugin.spec.ts              # Host-half integration tests (Cordis Context + mocked RPC)
  ArtifactList.client.spec.tsx
  StarIcon.client.spec.tsx    # Client component tests (jsdom)
docs/best-practices.md        # DSH plugin development best practices (Chinese)
cordis.patch.yml              # Patch layer that registers the plugin into the loader tree
tsdown.config.ts              # Browser-bundle build (lazy-CJS factory for the web shell)
vitest.config.ts              # Test environments and NodeNext import aliasing
biome.json                    # Lint/format rules
.github/workflows/ci.yml      # CI: lint, typecheck, test, build
.github/workflows/release.yml # npm publish on GitHub release (trusted publishing)
lib/                          # Build output (gitignored); do not edit by hand
```

## Build and test commands

```sh
pnpm install           # install dependencies (pnpm 10)
pnpm run typecheck     # tsc --noEmit
pnpm run build         # tsc -b tsconfig.json && tsdown  (two-step, see below)
pnpm run test          # vitest run
pnpm run test:watch    # vitest
pnpm run lint          # biome check .
pnpm run lint:fix      # biome check --write .
pnpm run format        # biome format --write .
```

CI (`.github/workflows/ci.yml`) runs `lint`, `typecheck`, `test`, `build` in
that order on Node 22 with `pnpm install --frozen-lockfile`. Keep all four
green before considering a change done.

### Build pipeline (important)

The build is deliberately two-step:

1. `tsc -b tsconfig.json` compiles `src/` to JS + declarations in `lib/`
   (NodeNext, ES2022). The host entry is `lib/index.js`.
2. `tsdown` rebundles the compiled `lib/client/index.js` into
   `lib/client.js`: a single CJS file wrapped in a
   `window.__ModuleLoader__.load({ id, factory })` banner/footer so the DSH web
   shell can load it. Only specifiers in the web shell's frozen module table
   (`react`, `react-dom`, `@deepseek-ai/cordis`,
   `@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-ui-primitives`,
   `@deepseek-ai/dsh-client-runtime/client`) stay external; **everything else
   is inlined** into the bundle. A custom "purity gate" plugin in
   `tsdown.config.ts` throws at build time if the client bundle value-imports
   any other `@deepseek-ai/*` package (type-only imports are fine — they are
   erased).
3. CSS Modules (`*.module.css`) are handled by a custom tsdown plugin that
   compiles them with lightningcss (`[hash]_[local]` class pattern) and emits a
   style-injection module that appends a plugin-owned `<style>` tag at runtime.
   `tsc` does not copy stylesheets, so the plugin maps emitted `lib/` paths
   back to `src/` when loading CSS.

`package.json` declares the plugin via the `dsh` field: `dsh.bundle.patch`
points at `cordis.patch.yml` (a one-row insert registering the plugin id
`artifact-viewer`), and `dsh.client` declares the `web` platform, injected
runtime, and external packages.

### Release

`.github/workflows/release.yml` publishes to npm on a published GitHub release
using trusted publishing (OIDC, `--provenance`). The release tag (without the
`v` prefix) must equal `package.json`'s `version`; the workflow fails
otherwise. Bump `version` before cutting a release.

**Release trigger rule: whenever `package.json`'s `"version"` is changed — by
the user or by an agent — run the full release sequence below.** The version is
always read from `package.json`, never typed by hand. Pushing a tag alone does
NOT trigger publishing; a GitHub Release object must be created:

```sh
version="$(node -p "require('./package.json').version")"
git commit -am "release: v${version}"
git tag "v${version}"
git push origin main --tags
# creating the Release is what fires the publish workflow:
gh release create "v${version}" --title "v${version}" --notes "<changes>"
# verify:
gh run watch --workflow=Publish
npm view @wangjunjian/dsh-artifact-viewer version
```

Trusted publishing must be registered once on npmjs.com (package Settings →
Trusted Publishers → GitHub Actions: repo `wang-junjian/dsh-artifact-viewer`,
workflow `release.yml`); without it the publish step fails with `ENEEDAUTH`.
See `docs/best-practices.md` §7 for the full write-up and pitfalls.

## Code style guidelines

- **Biome** is the single source of truth: 2-space indent, single quotes,
  trailing commas, 120-column line width (see `biome.json`). Lint preset is
  `recommended`; `noNonNullAssertion` and `noSvgWithoutTitle` are turned off.
- **Imports use `.js` extensions** for local files (NodeNext requirement),
  e.g. `import { ... } from './store.js'`, even though the sources are `.ts`.
  Vitest aliases resolve these back to the `.ts` sources during tests.
- **Strict TypeScript**; avoid `any` (`noImplicitAny`). Type-only imports of
  `@deepseek-ai/*` packages are used liberally in the client half — they are
  erased at compile time and keep the bundle pure.
- **JSDoc comments** in English on exported symbols, with `@module` docblocks
  at the top of entry files. Inline comments and docs are primarily English;
  `docs/best-practices.md` and `README.zh.md` are the Chinese translations.
- UI copy is **bilingual**: add new strings to both `zh` and `en` dictionaries
  in `src/client/locales.ts` under the `artifact-viewer` namespace.
- Plugin shape follows Cordis conventions: export `name`, `inject`, a
  schemastery `Config` schema with defaults, and `apply(ctx, config)`; return
  early from `apply` when `config.enabled` is false. Register disposables
  through `ctx.effect(...)` / slot-registration handles rather than manual
  teardown.
- Make minimal, scoped changes; match the surrounding style.

## Testing instructions

- Run `pnpm run test` (Vitest). Test files live in `tests/` and import the
  sources from `../src/...` with `.js` extensions.
- **Environments** (`vitest.config.ts`): Node environment by default; files
  matching `tests/**/*.client.spec.{ts,tsx}` run in **jsdom**. Name client
  component tests accordingly (`*.client.spec.tsx`).
- Host-half tests (`tests/plugin.spec.ts`) construct a real Cordis `Context`,
  provide a mocked `connection` service capturing RPC handlers, and load the
  plugin with `ctx.plugin(...)`; they use temp directories (`mkdtemp`) for
  filesystem state and always dispose fibers in `afterEach`.
- Client tests use `@testing-library/react`. `globals: false` — import
  `describe`/`it`/`expect`/`vi` from `vitest` explicitly.
- `@deepseek-ai/*` packages are inlined into the Vitest server pipeline
  (`server.deps.inline`), and react/react-dom are aliased to the local
  `node_modules` to avoid duplicate-React issues.

## Runtime architecture

- **Host half** (`src/index.ts`): runs in Node. Injects the `connection`
  service and registers a loopback-only RPC channel `/artifact-viewer` with
  three endpoints:
  - `bookmarks/read` / `bookmarks/write` — read/write the bookmark array for a
    project. Requires a `projectPath` in the payload; the host canonicalizes it
    with `fs.realpath` so symlink differences (e.g. macOS `/var` vs
    `/private/var`) do not split bookmarks across browsers.
  - `file/preview` — returns UTF-8 text content or base64 data (with an
    inferred media type) for files up to 512 KiB.
- **Client half** (`src/client/index.ts`): runs in the browser. Injects
  `slots`, `locale`, `sessions`, `connection`, `workspaces`. Registers three
  surfaces: `sidebar.footer.action` (toggle), `shell.overlay` (panel),
  `conversation.message.images` (replacement renderer with bookmark stars,
  `priority: -1`). Slot components receive their dependencies through an
  `inject()` face rather than importing services directly.
- **Cross-half communication goes only through the RPC channel.** Never call
  Node APIs from the client half.

## Bookmarks storage

Bookmarks live in the DSH home (resolved via `@deepseek-ai/dsh-home-paths`,
honoring `$DSH_HOME`, default `~/.dsh`) at
`storages/artifact-viewer/bookmarks.json`. Format: `{ version: 1, projects: {
"<canonical project path>": BookmarkRecord[] } }`. `BookmarkRecord` is defined
in `src/index.ts` (`id`, `kind`, `name`, optional `path`/`attachmentId`,
`seq`, `sessionId`, `createdAt`). Writes are atomic (write `.tmp` then
`rename`). An older on-disk location (`<project-root>/.dsh/bookmarks.json`) is
no longer read — see the README migration note.

## Security considerations

- The RPC channel is registered with `{ authority: 'loopback' }` — keep it
  loopback-only.
- `file/preview` enforces a 512 KiB size cap, rejects non-regular files, and
  rejects non-UTF-8 content when `encoding` is `utf8` (fatal `TextDecoder`
  check) so binary files are never rendered as garbled text; binary previews
  must request `base64`.
- HTML artifacts are previewed in a **sandboxed iframe**.
- The bookmark store path is derived from the DSH home, never from
  client-supplied input; `projectPath` is only used as a lookup key after
  `realpath` canonicalization.
- Validate all RPC payloads defensively (type checks with `bad-request`
  errors), as done in `src/index.ts`.

## Known limitations (from README)

- The panel floats over the app via `shell.overlay`; no native right-column
  slot exists in DSH yet.
- Bookmarked-image preview is limited because bookmarks store only the
  attachment id, not the full image reference.
- Video files are listed but not previewed inline.
- Bookmarks created before the `sessionId` field existed cannot navigate back
  to their source session.
