/** Display helpers: convert artifacts and bookmarks into a common list item. */
export function artifactToDisplay(artifact) {
    return {
        id: artifact.id,
        kind: artifact.kind,
        name: artifact.name,
        seq: artifact.seq,
        path: artifact.path,
        attachmentId: artifact.attachment?.attachmentId,
    };
}
export function bookmarkToDisplay(record) {
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
export function artifactToBookmark(artifact, sessionId) {
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
export function displayItemToBookmark(item, sessionId) {
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
//# sourceMappingURL=display.js.map