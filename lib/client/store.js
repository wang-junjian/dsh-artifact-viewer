/** Shared UI-state store for the artifact viewer panel. */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
export const createArtifactViewerStore = () => defineStore({
    init: () => ({
        panelOpen: false,
        activeTab: 'current',
        expanded: false,
        width: 420,
    }),
    actions: {
        togglePanel: (draft) => {
            draft.panelOpen = !draft.panelOpen;
        },
        openPanel: (draft) => {
            draft.panelOpen = true;
        },
        closePanel: (draft) => {
            draft.panelOpen = false;
        },
        setTab: (draft, tab) => {
            draft.activeTab = tab;
        },
        toggleExpand: (draft) => {
            draft.expanded = !draft.expanded;
        },
        setWidth: (draft, width) => {
            draft.width = width;
        },
    },
});
//# sourceMappingURL=store.js.map