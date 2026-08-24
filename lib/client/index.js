/**
 * Browser half of the artifact-viewer plugin.
 *
 * Registers a sidebar footer toggle, a right-hand overlay panel, and an
 * intercepted message-image renderer that adds bookmark stars.
 *
 * @module @wang-junjian/dsh-artifact-viewer/client
 */
import { ArtifactMessageImages } from './ArtifactMessageImages.js';
import { ArtifactPanel } from './ArtifactPanel.js';
import { ArtifactToggle } from './ArtifactToggle.js';
import { BookmarkController } from './bookmarks.js';
import { createCurrentSessionSource } from './current-session.js';
import { en, NS, zh } from './locales.js';
import { createArtifactViewerStore } from './store.js';
/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'sessions', 'connection', 'workspaces'];
/**
 * Register the artifact viewer surfaces.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'artifact-viewer: dictionaries');
    const rpc = ctx.get('connection').rpc;
    const bookmarks = new BookmarkController(rpc);
    const viewerStore = createArtifactViewerStore();
    const currentSession = createCurrentSessionSource(ctx);
    ctx.effect(() => currentSession.dispose, 'artifact-viewer: current-session source');
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'artifact-viewer-toggle',
        order: 50,
        locale: NS,
        store: viewerStore,
    }, ArtifactToggle));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'artifact-viewer-panel',
        order: 50,
        locale: NS,
        store: viewerStore,
        inject: () => ({
            hooks: {
                currentSession,
                bookmarks: bookmarks.store,
            },
            bookmarks,
            rpc,
            onOpenPath: (path) => ctx.workspaces.openPath(path),
            onOpenSession: (sessionId) => ctx.sessions.open(sessionId),
        }),
    }, ArtifactPanel));
    ctx.slots.inject('conversation.message.images', () => ctx.slots.register({
        name: 'conversation.message.images',
        locale: NS,
        priority: -1,
        inject: () => ({
            hooks: { bookmarks: bookmarks.store },
            bookmarks,
        }),
    }, ArtifactMessageImages));
}
//# sourceMappingURL=index.js.map