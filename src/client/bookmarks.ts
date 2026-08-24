/** Browser-side bookmark controller backed by the host RPC channel. */

import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client';
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { BookmarkRecord } from '../index.js';

export interface BookmarkState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  bookmarks: readonly BookmarkRecord[];
  error: string | null;
}

const CHANNEL = '/artifact-viewer';

export class BookmarkController {
  /** Observable snapshot of the loaded bookmarks. */
  readonly store: SnapshotStore<BookmarkState>;

  constructor(private readonly rpc: ClientConnectionRpc) {
    this.store = createSnapshotStore<BookmarkState>({
      status: 'idle',
      bookmarks: [],
      error: null,
    });
  }

  /** Load bookmarks for the given project directory. */
  async load(projectPath: string): Promise<void> {
    this.store.update((state) => {
      state.status = 'loading';
      state.error = null;
    });
    const result = await this.rpc.call(CHANNEL, 'bookmarks/read', { projectPath });
    if (!result.ok) {
      this.fail(result.error.message);
      return;
    }
    const value = result.value;
    if (!Array.isArray(value)) {
      this.fail('bookmarks file is not an array');
      return;
    }
    this.store.update((state) => {
      state.status = 'ready';
      state.bookmarks = value as BookmarkRecord[];
    });
  }

  /** Add one bookmark; duplicates replace the previous entry with the same id. */
  async add(projectPath: string, record: BookmarkRecord): Promise<void> {
    const current = this.store.getSnapshot().bookmarks.slice();
    const index = current.findIndex((entry) => entry.id === record.id);
    if (index >= 0) {
      current[index] = record;
    } else {
      current.push(record);
    }
    await this.write(projectPath, current);
  }

  /** Remove a bookmark by id. */
  async remove(projectPath: string, id: string): Promise<void> {
    const current = this.store.getSnapshot().bookmarks.filter((entry) => entry.id !== id);
    await this.write(projectPath, current);
  }

  /** Toggle a bookmark: add if absent, remove if present. */
  async toggle(projectPath: string, record: BookmarkRecord): Promise<void> {
    const exists = this.store.getSnapshot().bookmarks.some((entry) => entry.id === record.id);
    if (exists) {
      await this.remove(projectPath, record.id);
    } else {
      await this.add(projectPath, record);
    }
  }

  private async write(projectPath: string, bookmarks: BookmarkRecord[]): Promise<void> {
    const result = await this.rpc.call(CHANNEL, 'bookmarks/write', { projectPath, bookmarks });
    if (!result.ok) {
      this.fail(result.error.message);
      return;
    }
    this.store.update((state) => {
      state.status = 'ready';
      state.bookmarks = bookmarks;
    });
  }

  private fail(message: string): void {
    this.store.update((state) => {
      state.status = 'error';
      state.error = message;
    });
  }
}
