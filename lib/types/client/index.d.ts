/**
 * Browser half of the artifact-viewer plugin.
 *
 * Registers a sidebar footer toggle, a right-hand overlay panel, and an
 * intercepted message-image renderer that adds bookmark stars.
 *
 * @module @wang-junjian/dsh-artifact-viewer/client
 */
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { BookmarkController } from './bookmarks.js';
import { type CurrentSessionSource } from './current-session.js';
import { type ArtifactViewerKey } from './locales.js';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'artifact-viewer': ArtifactViewerKey;
    }
}
/** Services required by the browser half. */
export declare const inject: string[];
/** Injected business face for the floating artifact panel. */
export interface ArtifactPanelFace {
    hooks: {
        /** Snapshot source tracking the currently selected session. */
        currentSession: CurrentSessionSource;
        /** Bookmark controller state. */
        bookmarks: BookmarkController['store'];
    };
    /** Bookmark controller for mutations. */
    bookmarks: BookmarkController;
    /** Generic Connection RPC caller for file previews. */
    rpc: ConnectionHandle['rpc'];
    /** Open an absolute path with the host default application. */
    onOpenPath: (path: string) => Promise<void>;
    /** Switch the current session to the artifact's source conversation. */
    onOpenSession: (sessionId: string) => void;
}
/** Injected business face for the intercepted message-image renderer. */
export interface MessageImagesFace {
    hooks: {
        /** Bookmark controller state. */
        bookmarks: BookmarkController['store'];
    };
    /** Bookmark controller for mutations. */
    bookmarks: BookmarkController;
}
/**
 * Register the artifact viewer surfaces.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map