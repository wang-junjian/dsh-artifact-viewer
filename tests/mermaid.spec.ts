import { describe, expect, it } from 'vitest';
import { splitMermaidSegments } from '../src/client/mermaid.js';

describe('splitMermaidSegments', () => {
  it('returns a single markdown segment when no mermaid fence exists', () => {
    expect(splitMermaidSegments('# Title\n\nSome **text**.')).toEqual([
      { type: 'markdown', content: '# Title\n\nSome **text**.' },
    ]);
  });

  it('splits a mermaid fence from surrounding markdown', () => {
    const text = '# Doc\n\n```mermaid\ngraph TD;\n  A-->B;\n```\n\nAfter.';
    expect(splitMermaidSegments(text)).toEqual([
      { type: 'markdown', content: '# Doc\n\n' },
      { type: 'mermaid', content: 'graph TD;\n  A-->B;' },
      { type: 'markdown', content: '\n\nAfter.' },
    ]);
  });

  it('handles multiple mermaid blocks', () => {
    const text = '```mermaid\ngraph TD; A-->B;\n```\nmiddle\n~~~mermaid\nsequenceDiagram\n  A->>B: hi\n~~~\n';
    const segments = splitMermaidSegments(text);
    expect(segments.map((segment) => segment.type)).toEqual(['mermaid', 'markdown', 'mermaid']);
    expect(segments[2].content).toBe('sequenceDiagram\n  A->>B: hi');
  });

  it('leaves unclosed fences as plain markdown', () => {
    const text = '```mermaid\ngraph TD; A-->B;';
    expect(splitMermaidSegments(text)).toEqual([{ type: 'markdown', content: text }]);
  });

  it('drops an empty mermaid block', () => {
    const text = 'before\n```mermaid\n```\nafter';
    const segments = splitMermaidSegments(text);
    expect(segments.every((segment) => segment.type === 'markdown')).toBe(true);
    expect(segments).toHaveLength(2);
  });
});
