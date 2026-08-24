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

export function artifactToDisplay(artifact: Artifact): DisplayItem {
  return {
    id: artifact.id,
    kind: artifact.kind,
    name: artifact.name,
    seq: artifact.seq,
    path: artifact.path,
    attachmentId: artifact.attachment?.attachmentId,
  };
}

export function bookmarkToDisplay(record: BookmarkRecord): DisplayItem {
  return {
    id: record.id,
    kind: record.kind,
    name: record.name,
    seq: record.seq,
    path: record.path,
    attachmentId: record.attachmentId,
    sessionId: record.sessionId,
  };
}

export function artifactToBookmark(artifact: Artifact, sessionId: string): BookmarkRecord {
  return {
    id: artifact.id,
    kind: artifact.kind,
    name: artifact.name,
    path: artifact.path,
    attachmentId: artifact.attachment?.attachmentId,
    seq: artifact.seq,
    sessionId,
    createdAt: Date.now(),
  };
}

export function displayItemToBookmark(item: DisplayItem, sessionId: string | undefined): BookmarkRecord {
  return {
    id: item.id,
    kind: item.kind,
    name: item.name,
    path: item.path,
    attachmentId: item.attachmentId,
    seq: item.seq,
    sessionId: sessionId ?? item.sessionId ?? '',
    createdAt: Date.now(),
  };
}
