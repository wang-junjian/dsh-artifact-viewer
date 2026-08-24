/** Observable source that tracks the currently selected session snapshot. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import {
  type ConversationSnapshot,
  createSnapshotStore,
  type ObservableSnapshot,
} from '@deepseek-ai/dsh-client-runtime/client';

export interface CurrentSessionSource extends ObservableSnapshot<ConversationSnapshot | undefined> {
  /** Stop following session selection. */
  dispose(): void;
}

/**
 * Build a source that always reflects the current session's conversation snapshot.
 * The source is intended for a root-scope component that does not receive `useSession`.
 * @param ctx - client root context.
 * @returns observable source and its disposal.
 */
export function createCurrentSessionSource(ctx: ClientContext): CurrentSessionSource {
  const store = createSnapshotStore<ConversationSnapshot | undefined>(undefined, { flush: 'sync' });
  let unsubscribeSession: (() => void) | undefined;

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
