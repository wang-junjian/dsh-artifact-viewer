/** Mermaid diagram renderer for Markdown previews. */

import mermaid from 'mermaid';
import { useEffect, useState } from 'react';
import css from './MermaidDiagram.module.css';

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });

let diagramSeq = 0;

export interface MermaidDiagramProps {
  /** Mermaid diagram source (fences already stripped). */
  source: string;
  /** Fallback rendered when the diagram fails to parse, e.g. the raw fence as a code block. */
  fallback: React.ReactNode;
}

/**
 * Render one Mermaid diagram to inline SVG. Rendering is async; failures fall
 * back to the caller-provided raw-source representation instead of breaking
 * the surrounding Markdown preview.
 */
export function MermaidDiagram({ source, fallback }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(undefined);
    setFailed(false);
    const id = `artifact-viewer-mermaid-${diagramSeq++}`;
    mermaid.render(id, source).then(
      ({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (failed) return <>{fallback}</>;
  if (svg === undefined) return null;
  // Mermaid emits sanitized SVG (securityLevel: 'strict'); there is no React
  // element path for externally generated SVG markup.
  // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid strict-mode SVG output
  return <div className={css.diagram} dangerouslySetInnerHTML={{ __html: svg }} />;
}
