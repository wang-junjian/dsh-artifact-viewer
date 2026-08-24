/** Scrollable list of artifacts inside the panel. */
import type { DisplayItem } from './display.js';
import type { ArtifactViewerKey } from './locales.js';
interface ArtifactListProps {
    items: readonly DisplayItem[];
    bookmarkIds: ReadonlySet<string>;
    showSessionLink?: boolean;
    onSelect: (id: string) => void;
    onToggleBookmark: (item: DisplayItem) => void;
    onOpenSession?: (sessionId: string) => void;
    t: (key: ArtifactViewerKey) => string;
}
export declare function ArtifactList({ items, bookmarkIds, showSessionLink, onSelect, onToggleBookmark, onOpenSession, t, }: ArtifactListProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ArtifactList.d.ts.map