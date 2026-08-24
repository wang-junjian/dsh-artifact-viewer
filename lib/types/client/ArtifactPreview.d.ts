/** Preview pane for the selected artifact. */
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
import type { DisplayItem } from './display.js';
import type { ArtifactViewerKey } from './locales.js';
interface ArtifactPreviewProps {
    item: DisplayItem;
    projectPath: string | undefined;
    rpc: ConnectionHandle['rpc'];
    onOpenPath: (path: string) => Promise<void>;
    onOpenSession?: (sessionId: string) => void;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
    t: (key: ArtifactViewerKey) => string;
}
export declare function ArtifactPreview({ item, projectPath, rpc, onOpenPath, onOpenSession, isBookmarked, onToggleBookmark, t, }: ArtifactPreviewProps): import("react").JSX.Element;
export declare function codeLanguage(name: string): string | undefined;
export {};
//# sourceMappingURL=ArtifactPreview.d.ts.map