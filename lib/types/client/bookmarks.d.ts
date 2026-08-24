/** Browser-side bookmark controller backed by the host RPC channel. */
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { BookmarkRecord } from '../index.js';
export interface BookmarkState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    bookmarks: readonly BookmarkRecord[];
    error: string | null;
}
export declare class BookmarkController {
    private readonly rpc;
    /** Observable snapshot of the loaded bookmarks. */
    readonly store: SnapshotStore<BookmarkState>;
    constructor(rpc: ClientConnectionRpc);
    /** Load bookmarks for the given project directory. */
    load(projectPath: string): Promise<void>;
    /** Add one bookmark; duplicates replace the previous entry with the same id. */
    add(projectPath: string, record: BookmarkRecord): Promise<void>;
    /** Remove a bookmark by id. */
    remove(projectPath: string, id: string): Promise<void>;
    /** Toggle a bookmark: add if absent, remove if present. */
    toggle(projectPath: string, record: BookmarkRecord): Promise<void>;
    private write;
    private fail;
}
//# sourceMappingURL=bookmarks.d.ts.map