/** Observable source that tracks the currently selected session snapshot. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type ConversationSnapshot, type ObservableSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
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
export declare function createCurrentSessionSource(ctx: ClientContext): CurrentSessionSource;
//# sourceMappingURL=current-session.d.ts.map