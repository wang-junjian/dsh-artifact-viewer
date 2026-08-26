/** Splitting of Markdown source into plain-Markdown and Mermaid diagram segments. */

export interface MarkdownSegment {
  /** Segment kind: plain Markdown or a Mermaid diagram source. */
  type: 'markdown' | 'mermaid';
  /** Segment source text (fences stripped for Mermaid segments). */
  content: string;
}

const MERMAID_FENCE = /^(?:```|~~~)mermaid[ \t]*\n([\s\S]*?)\n?(?:```|~~~)[ \t]*$/gm;

/**
 * Split a Markdown document so fenced ```mermaid blocks become diagram
 * segments and everything else stays Markdown. Fences must start and end at
 * line boundaries; unclosed fences are left as plain Markdown.
 * @param text - full Markdown source.
 * @returns ordered segments; empty Markdown segments are dropped.
 */
export function splitMermaidSegments(text: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(MERMAID_FENCE)) {
    const before = text.slice(lastIndex, match.index);
    if (before.trim() !== '') {
      segments.push({ type: 'markdown', content: before });
    }
    const diagram = match[1].trim();
    if (diagram !== '') {
      segments.push({ type: 'mermaid', content: diagram });
    }
    lastIndex = match.index + match[0].length;
  }
  const rest = text.slice(lastIndex);
  if (rest.trim() !== '') {
    segments.push({ type: 'markdown', content: rest });
  }
  return segments;
}
