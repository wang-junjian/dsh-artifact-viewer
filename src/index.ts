/**
 * `@wang-junjian/dsh-artifact-viewer`: a DeepSeek Harness bundle plugin that
 * adds an artifact sidebar and bookmarking for agent conversations.
 *
 * The plugin registers a loopback RPC channel on the host for persisting
 * bookmarks and previewing files, and a set of client slots that render the
 * artifact panel and intercept message-image rendering.
 *
 * @module @wang-junjian/dsh-artifact-viewer
 */

import { mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Context } from '@deepseek-ai/cordis';
import type { ConnectionRpcHandler, HostConnectionHandle } from '@deepseek-ai/dsh-client-connection';
import { dshHomePath } from '@deepseek-ai/dsh-home-paths';
import z from '@deepseek-ai/schemastery';

/** RPC result shape returned by every artifact-viewer endpoint. */
type RpcResult = Awaited<ReturnType<ConnectionRpcHandler>>;

export const name = 'artifact-viewer';

export const inject = ['connection'];

/** Plugin config accepted from cordis.yml. */
export interface Config {
  /** Whether to register the artifact viewer plugin. Defaults to true. */
  enabled?: boolean;
}

/** Schemastery config schema with defaults. */
export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
});

/** One bookmarked artifact persisted under the DSH home store. */
export interface BookmarkRecord {
  /** Stable artifact identity used for deduplication. */
  id: string;
  /** Display kind; drives preview affordances. */
  kind: 'image' | 'file' | 'json' | 'video' | 'unknown';
  /** Human-readable name. */
  name: string;
  /** Workspace-absolute path when the artifact is a produced file. */
  path?: string;
  /** Durable attachment id when the artifact is a session image. */
  attachmentId?: string;
  /** Session log seq the artifact was produced at. */
  seq: number;
  /** Owning session id. */
  sessionId: string;
  /** Bookmark creation timestamp. */
  createdAt: number;
}

/** On-disk format: bookmarks grouped by canonical project path. */
interface BookmarkStore {
  /** Map from canonical project path to its bookmark list. */
  projects: Record<string, BookmarkRecord[]>;
  /** Schema version for future migrations. */
  version: number;
}

/** Loopback-only RPC endpoints exposed by this plugin. */
const CHANNEL = '/artifact-viewer';
const PREVIEW_MAX_BYTES = 512 * 1024;
const STORE_VERSION = 1;

/**
 * Register the artifact-viewer host services.
 * @param ctx - the Cordis context.
 * @param config - plugin config; schemastery has already applied defaults.
 */
export function apply(ctx: Context, config: Config): void {
  if (!config.enabled) return;

  const connection = ctx.get('connection') as HostConnectionHandle;
  connection.rpc.handle(
    CHANNEL,
    async (endpoint, payload): Promise<RpcResult> => {
      const rawProjectPath = (payload as { projectPath?: unknown }).projectPath;
      if (typeof rawProjectPath !== 'string') {
        return {
          ok: false,
          error: {
            code: 'bad-request',
            message: 'projectPath is required',
            details: { issues: [] },
          },
        };
      }
      const projectPath = await resolveProjectPath(rawProjectPath);

      if (endpoint === 'bookmarks/read') {
        return readBookmarks(projectPath);
      }

      if (endpoint === 'bookmarks/write') {
        const bookmarks = (payload as { bookmarks?: unknown }).bookmarks;
        if (!Array.isArray(bookmarks)) {
          return {
            ok: false,
            error: {
              code: 'bad-request',
              message: 'bookmarks array is required',
              details: { issues: [] },
            },
          };
        }
        return writeBookmarks(projectPath, bookmarks);
      }

      if (endpoint === 'file/preview') {
        const path = (payload as { path?: unknown }).path;
        const encoding = (payload as { encoding?: unknown }).encoding;
        if (typeof path !== 'string') {
          return {
            ok: false,
            error: {
              code: 'bad-request',
              message: 'path is required',
              details: { issues: [] },
            },
          };
        }
        if (encoding !== undefined && encoding !== 'utf8' && encoding !== 'base64') {
          return {
            ok: false,
            error: {
              code: 'bad-request',
              message: 'encoding must be utf8 or base64',
              details: { issues: [] },
            },
          };
        }
        return previewFile(projectPath, path, encoding as 'utf8' | 'base64' | undefined);
      }

      return {
        ok: false,
        error: {
          code: 'bad-request',
          message: `unknown endpoint ${endpoint}`,
          details: { issues: [] },
        },
      };
    },
    { authority: 'loopback' },
  );
}

async function readBookmarks(projectPath: string): Promise<RpcResult> {
  const store = await loadBookmarkStore();
  return { ok: true, value: store.projects[projectPath] ?? [] };
}

async function writeBookmarks(projectPath: string, bookmarks: unknown[]): Promise<RpcResult> {
  const store = await loadBookmarkStore();
  store.projects[projectPath] = bookmarks as BookmarkRecord[];
  const result = await saveBookmarkStore(store);
  if (!result.ok) return result;
  return { ok: true, value: null };
}

async function loadBookmarkStore(): Promise<BookmarkStore> {
  const file = bookmarksStoreFile();
  try {
    const text = await readFile(file, 'utf8');
    const parsed = JSON.parse(text) as unknown;
    if (!isBookmarkStore(parsed)) {
      throw new Error('bookmarks store has invalid shape');
    }
    return parsed;
  } catch (error: unknown) {
    if (isENOENT(error)) {
      return { projects: {}, version: STORE_VERSION };
    }
    throw error;
  }
}

async function saveBookmarkStore(store: BookmarkStore): Promise<RpcResult> {
  const file = bookmarksStoreFile();
  try {
    await mkdir(storagesDir(), { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, `${JSON.stringify(store, null, 2)}\n`);
    await rename(tmp, file);
    return { ok: true, value: null };
  } catch (error: unknown) {
    return {
      ok: false,
      error: {
        code: 'internal',
        message: errorMessage(error),
        details: {},
      },
    };
  }
}

function isBookmarkStore(value: unknown): value is BookmarkStore {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).version === 'number' &&
    typeof (value as Record<string, unknown>).projects === 'object' &&
    (value as Record<string, unknown>).projects !== null &&
    !Array.isArray((value as Record<string, unknown>).projects)
  );
}

async function previewFile(
  _projectPath: string,
  targetPath: string,
  encoding: 'utf8' | 'base64' = 'utf8',
): Promise<RpcResult> {
  const file = targetPath;
  try {
    const { stat } = await import('node:fs/promises');
    const stats = await stat(file);
    if (!stats.isFile()) {
      throw new Error('not a file');
    }
    if (stats.size > PREVIEW_MAX_BYTES) {
      throw new Error(`file exceeds ${PREVIEW_MAX_BYTES} byte preview limit`);
    }
    if (encoding === 'base64') {
      const buffer = await readFile(file);
      return {
        ok: true,
        value: {
          data: buffer.toString('base64'),
          mediaType: inferMediaType(file),
        },
      };
    }
    const buffer = await readFile(file);
    if (!isValidUtf8(buffer)) {
      throw new Error('file is not valid UTF-8; use base64 encoding for binary files');
    }
    return { ok: true, value: { content: buffer.toString('utf8') } };
  } catch (error: unknown) {
    return {
      ok: false,
      error: {
        code: 'internal',
        message: errorMessage(error),
        details: {},
      },
    };
  }
}

function inferMediaType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'text/markdown';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

function storagesDir(): string {
  return dshHomePath('storages', 'artifact-viewer');
}

function bookmarksStoreFile(): string {
  return join(storagesDir(), 'bookmarks.json');
}

function isENOENT(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'ENOENT'
  );
}

function isValidUtf8(buffer: Buffer): boolean {
  try {
    // Buffer.toString('utf8') silently substitutes invalid bytes. Use the
    // TextDecoder fatal mode when available to detect non-UTF-8 input.
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(buffer);
    return true;
  } catch {
    return false;
  }
}

async function resolveProjectPath(raw: string): Promise<string> {
  try {
    return await realpath(raw);
  } catch (error) {
    if (isENOENT(error)) {
      return raw;
    }
    throw error;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
