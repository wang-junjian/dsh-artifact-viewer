/** Artifact detection from a conversation snapshot. */

import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
import type { ContentBlock } from '@deepseek-ai/dsh-client-connection/client';
import type {
  AssistantMessageNode,
  ConversationSnapshot,
  ToolResultNode,
  UserMessageNode,
} from '@deepseek-ai/dsh-client-runtime/client';
import type { Artifact, ArtifactKind } from './types.js';

/** Collect every artifact visible in the current conversation window. */
export function collectArtifacts(snapshot: ConversationSnapshot): Artifact[] {
  const artifacts: Artifact[] = [];
  const seen = new Set<string>();
  const add = (artifact: Artifact): void => {
    if (seen.has(artifact.id)) return;
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

function collectToolArtifacts(node: ToolResultNode, add: (artifact: Artifact) => void): void {
  const views = [node.resultView, node.callView];
  for (const view of views) {
    if (view === null) continue;
    if (view.card === 'diff' || (view.card === 'generic' && view.kind === 'edit')) {
      for (const location of view.locations ?? []) {
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

function collectUserArtifacts(node: UserMessageNode, add: (artifact: Artifact) => void): void {
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

function collectAssistantArtifacts(node: AssistantMessageNode, add: (artifact: Artifact) => void): void {
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

function isImageBlock(block: ContentBlock): block is { type: 'image'; attachment: ImageAttachmentRef } {
  return (block as { type?: string }).type === 'image';
}

function isTextBlock(block: ContentBlock): block is { type: 'text'; text: string } {
  return (block as { type?: string }).type === 'text';
}

function inferFileKind(path: string): ArtifactKind {
  const lower = path.toLowerCase();
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif')
  ) {
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

function basename(path: string): string {
  const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return at === -1 ? path : path.slice(at + 1);
}

function looksLikeJson(text: string): boolean {
  if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) {
    return false;
  }
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function hash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return String(h);
}
