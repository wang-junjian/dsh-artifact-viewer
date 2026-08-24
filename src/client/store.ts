/** Shared UI-state store for the artifact viewer panel. */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';

export interface ArtifactViewerState {
  /** Whether the floating panel is open. */
  panelOpen: boolean;
  /** Active tab inside the panel. */
  activeTab: 'current' | 'bookmarks';
  /** Whether the panel is expanded to fill the window. */
  expanded: boolean;
  /** Current panel width in pixels. */
  width: number;
}

export const createArtifactViewerStore = () =>
  defineStore({
    init: (): ArtifactViewerState => ({
      panelOpen: false,
      activeTab: 'current',
      expanded: false,
      width: 420,
    }),
    actions: {
      togglePanel: (draft: ArtifactViewerState) => {
        draft.panelOpen = !draft.panelOpen;
      },
      openPanel: (draft: ArtifactViewerState) => {
        draft.panelOpen = true;
      },
      closePanel: (draft: ArtifactViewerState) => {
        draft.panelOpen = false;
      },
      setTab: (draft: ArtifactViewerState, tab: 'current' | 'bookmarks') => {
        draft.activeTab = tab;
      },
      toggleExpand: (draft: ArtifactViewerState) => {
        draft.expanded = !draft.expanded;
      },
      setWidth: (draft: ArtifactViewerState, width: number) => {
        draft.width = width;
      },
    },
  });
