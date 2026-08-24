/** Floating artifact/bookmark panel rendered in shell.overlay. */
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { ArtifactPanelFace } from './index.js';
import type { NS } from './locales.js';
import type { createArtifactViewerStore } from './store.js';
export type ArtifactPanelProps = PropsRuntime<'shell.overlay'> & PropsStore<ReturnType<typeof createArtifactViewerStore>> & InjectFace<ArtifactPanelFace> & PropsLocale<typeof NS>;
export declare function ArtifactPanel({ useStore, actions, useCurrentSession, useBookmarks, bookmarks, rpc, onOpenPath, onOpenSession, useSessions, t, }: ArtifactPanelProps): import("react").JSX.Element | null;
//# sourceMappingURL=ArtifactPanel.d.ts.map