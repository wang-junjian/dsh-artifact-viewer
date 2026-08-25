/** Shared UI-state store for the artifact viewer panel. */
export interface ArtifactViewerState {
    /** Whether the floating panel is open. */
    panelOpen: boolean;
    /** Active tab inside the panel. */
    activeTab: 'current' | 'bookmarks';
    /** Whether the panel is expanded to fill the window. */
    expanded: boolean;
    /** Current panel width in pixels. */
    width: number;
    /** Relative or absolute path queued for opening from a conversation link. */
    pendingOpenPath?: string;
}
export declare const createArtifactViewerStore: () => import("@deepseek-ai/dsh-client-runtime/client").EngineStoreHandle<ArtifactViewerState, {
    togglePanel: (draft: ArtifactViewerState) => void;
    openPanel: (draft: ArtifactViewerState) => void;
    closePanel: (draft: ArtifactViewerState) => void;
    setTab: (draft: ArtifactViewerState, tab: "current" | "bookmarks") => void;
    toggleExpand: (draft: ArtifactViewerState) => void;
    setWidth: (draft: ArtifactViewerState, width: number) => void;
    openArtifactByPath: (draft: ArtifactViewerState, path: string) => void;
    clearPendingOpenPath: (draft: ArtifactViewerState) => void;
}>;
//# sourceMappingURL=store.d.ts.map