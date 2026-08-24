/** Display helpers: convert artifacts and bookmarks into a common list item. */
import type { BookmarkRecord } from '../index.js';
import type { Artifact } from './types.js';
export interface DisplayItem {
    id: string;
    kind: Artifact['kind'];
    name: string;
    seq: number;
    path?: string;
    attachmentId?: string;
    /** Original session id; set for bookmarks so removal works without a current session. */
    sessionId?: string;
}
export declare function artifactToDisplay(artifact: Artifact): DisplayItem;
export declare function bookmarkToDisplay(record: BookmarkRecord): DisplayItem;
export declare function artifactToBookmark(artifact: Artifact, sessionId: string): BookmarkRecord;
export declare function displayItemToBookmark(item: DisplayItem, sessionId: string | undefined): BookmarkRecord;
//# sourceMappingURL=display.d.ts.map