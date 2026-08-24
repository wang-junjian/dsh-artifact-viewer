/**
 * Browser half of the artifact-viewer plugin.
 *
 * Registers a sidebar footer toggle, a right-hand overlay panel, and an
 * intercepted message-image renderer that adds bookmark stars.
 *
 * @module @wang-junjian/dsh-artifact-viewer/client
 */

import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
import type {} from '@deepseek-ai/dsh-client-locale/client';
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-client-ui-layout/client';
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client';
import { ArtifactMessageImages } from './ArtifactMessageImages.js';
import { ArtifactPanel } from './ArtifactPanel.js';
import { ArtifactToggle } from './ArtifactToggle.js';
import { BookmarkController } from './bookmarks.js';
import { type CurrentSessionSource, createCurrentSessionSource } from './current-session.js';
import { type ArtifactViewerKey, en, NS, zh } from './locales.js';
import { createArtifactViewerStore } from './store.js';

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'artifact-viewer': ArtifactViewerKey;
  }
}

/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'sessions', 'connection', 'workspaces'];

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
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'artifact-viewer: dictionaries');

  const rpc = (ctx.get('connection') as unknown as ConnectionHandle).rpc;
  const bookmarks = new BookmarkController(rpc);
  const viewerStore = createArtifactViewerStore();
  const currentSession = createCurrentSessionSource(ctx);

  ctx.effect(() => currentSession.dispose, 'artifact-viewer: current-session source');

  ctx.slots.inject('sidebar.footer.action', () =>
    ctx.slots.register(
      {
        name: 'sidebar.footer.action',
        id: 'artifact-viewer-toggle',
        order: 50,
        locale: NS,
        store: viewerStore,
      },
      ArtifactToggle,
    ),
  );

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'artifact-viewer-panel',
        order: 50,
        locale: NS,
        store: viewerStore,
        inject: (): ArtifactPanelFace => ({
          hooks: {
            currentSession,
            bookmarks: bookmarks.store,
          },
          bookmarks,
          rpc,
          onOpenPath: (path) => ctx.workspaces.openPath(path),
          onOpenSession: (sessionId) => ctx.sessions.open(sessionId),
        }),
      },
      ArtifactPanel,
    ),
  );

  ctx.slots.inject('conversation.message.images', () =>
    ctx.slots.register(
      {
        name: 'conversation.message.images',
        locale: NS,
        priority: -1,
        inject: (): MessageImagesFace => ({
          hooks: { bookmarks: bookmarks.store },
          bookmarks,
        }),
      },
      ArtifactMessageImages,
    ),
  );
}
