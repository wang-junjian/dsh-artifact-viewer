/** Observable source that tracks the currently selected session snapshot. */
import { createSnapshotStore, } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Build a source that always reflects the current session's conversation snapshot.
 * The source is intended for a root-scope component that does not receive `useSession`.
 * @param ctx - client root context.
 * @returns observable source and its disposal.
 */
export function createCurrentSessionSource(ctx) {
    const store = createSnapshotStore(undefined, { flush: 'sync' });
    let unsubscribeSession;
    const sync = () => {
        unsubscribeSession?.();
        unsubscribeSession = undefined;
        const currentId = ctx.sessions.list.getSnapshot().current;
        if (currentId === undefined) {
            store.set(undefined);
            return;
        }
        const binding = ctx.sessions.binding(currentId);
        if (binding === undefined) {
            store.set(undefined);
            return;
        }
        const session = binding.session;
        store.set(session.getSnapshot());
        unsubscribeSession = session.subscribe(() => {
            store.set(session.getSnapshot());
        });
    };
    const unsubscribeList = ctx.sessions.list.subscribe(sync);
    sync();
    return {
        getSnapshot: () => store.getSnapshot(),
        subscribe: (listener) => store.subscribe(listener),
        dispose: () => {
            unsubscribeList();
            unsubscribeSession?.();
        },
    };
}
//# sourceMappingURL=current-session.js.map