/** Artifact detection from a conversation snapshot. */
/** Collect every artifact visible in the current conversation window. */
export function collectArtifacts(snapshot) {
    const artifacts = [];
    const seen = new Set();
    const add = (artifact) => {
        if (seen.has(artifact.id))
            return;
        seen.add(artifact.id);
        artifacts.push(artifact);
    };
    for (const node of snapshot.nodes) {
        if (node.kind === 'tool-result' && !node.isError) {
            collectToolArtifacts(node, add);
        }
        if (node.kind === 'user') {
            collectUserArtifacts(node, add);
        }
        if (node.kind === 'assistant') {
            collectAssistantArtifacts(node, add);
        }
    }
    return artifacts;
}
function collectToolArtifacts(node, add) {
    const views = [node.resultView, node.callView];
    for (const view of views) {
        if (view === null)
            continue;
        // The published DSH types do not yet expose kind/locations on result views,
        // but the runtime (local harness) does. Cast through unknown to compile
        // against npm while preserving runtime behavior.
        const fileView = view;
        if (fileView.card === 'diff' || (fileView.card === 'generic' && fileView.kind === 'edit')) {
            for (const location of fileView.locations ?? []) {
                const path = location.path;
                add({
                    id: `file:${path}:${node.seq}`,
                    kind: inferFileKind(path),
                    name: basename(path),
                    source: 'tool',
                    seq: node.seq,
                    path,
                });
            }
        }
    }
    for (const block of node.content) {
        if (isTextBlock(block)) {
            const text = block.text.trim();
            if (looksLikeJson(text)) {
                add({
                    id: `json:${node.seq}:${hash(text)}`,
                    kind: 'json',
                    name: `Result ${node.seq}`,
                    source: 'tool',
                    seq: node.seq,
                });
            }
        }
    }
}
function collectUserArtifacts(node, add) {
    for (const block of node.content) {
        if (isImageBlock(block)) {
            add({
                id: `img:${block.attachment.attachmentId}`,
                kind: 'image',
                name: block.attachment.name ?? `Image ${String(block.attachment.attachmentId).slice(0, 8)}`,
                source: 'message',
                seq: node.seq,
                attachment: block.attachment,
            });
        }
    }
}
function collectAssistantArtifacts(node, add) {
    for (const block of node.blocks) {
        if (block.kind === 'image') {
            add({
                id: `img:${block.attachment.attachmentId}`,
                kind: 'image',
                name: block.attachment.name ?? `Image ${String(block.attachment.attachmentId).slice(0, 8)}`,
                source: 'message',
                seq: node.seq,
                attachment: block.attachment,
            });
        }
    }
}
function isImageBlock(block) {
    return block.type === 'image';
}
function isTextBlock(block) {
    return block.type === 'text';
}
export function inferFileKind(path) {
    const lower = path.toLowerCase();
    if (lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif')) {
        return 'image';
    }
    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) {
        return 'video';
    }
    if (lower.endsWith('.json')) {
        return 'json';
    }
    return 'file';
}
export function basename(path) {
    const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return at === -1 ? path : path.slice(at + 1);
}
function looksLikeJson(text) {
    if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) {
        return false;
    }
    try {
        JSON.parse(text);
        return true;
    }
    catch {
        return false;
    }
}
function hash(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++) {
        h = (h * 31 + text.charCodeAt(i)) | 0;
    }
    return String(h);
}
//# sourceMappingURL=artifacts.js.map