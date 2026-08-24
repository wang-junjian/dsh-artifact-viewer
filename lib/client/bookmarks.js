/** Browser-side bookmark controller backed by the host RPC channel. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
const CHANNEL = '/artifact-viewer';
export class BookmarkController {
    rpc;
    /** Observable snapshot of the loaded bookmarks. */
    store;
    constructor(rpc) {
        this.rpc = rpc;
        this.store = createSnapshotStore({
            status: 'idle',
            bookmarks: [],
            error: null,
        });
    }
    /** Load bookmarks for the given project directory. */
    async load(projectPath) {
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
            state.bookmarks = value;
        });
    }
    /** Add one bookmark; duplicates replace the previous entry with the same id. */
    async add(projectPath, record) {
        const current = this.store.getSnapshot().bookmarks.slice();
        const index = current.findIndex((entry) => entry.id === record.id);
        if (index >= 0) {
            current[index] = record;
        }
        else {
            current.push(record);
        }
        await this.write(projectPath, current);
    }
    /** Remove a bookmark by id. */
    async remove(projectPath, id) {
        const current = this.store.getSnapshot().bookmarks.filter((entry) => entry.id !== id);
        await this.write(projectPath, current);
    }
    /** Toggle a bookmark: add if absent, remove if present. */
    async toggle(projectPath, record) {
        const exists = this.store.getSnapshot().bookmarks.some((entry) => entry.id === record.id);
        if (exists) {
            await this.remove(projectPath, record.id);
        }
        else {
            await this.add(projectPath, record);
        }
    }
    async write(projectPath, bookmarks) {
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
    fail(message) {
        this.store.update((state) => {
            state.status = 'error';
            state.error = message;
        });
    }
}
//# sourceMappingURL=bookmarks.js.map