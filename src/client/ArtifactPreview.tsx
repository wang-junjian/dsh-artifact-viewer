/** Preview pane for the selected artifact. */

import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
import {
  CodeBlock,
  IconCopyOutline16,
  IconFolderClose16,
  IconFolderOpenOutline16,
  IconNewChatOutline16,
  MarkdownText,
  Tooltip,
  writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives';
import { useEffect, useMemo, useState } from 'react';
import css from './ArtifactPreview.module.css';
import { dirname } from './artifacts.js';
import type { DisplayItem } from './display.js';
import type { ArtifactViewerKey } from './locales.js';
import { MermaidDiagram } from './MermaidDiagram.js';
import { splitMermaidSegments } from './mermaid.js';
import { StarIcon } from './StarIcon.js';

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

type PreviewMode = 'plain' | 'code' | 'markdown' | 'html' | 'svg' | 'image' | 'unknown';

interface PlainPreview {
  mode: 'plain';
  content: string;
}

interface CodePreview {
  mode: 'code';
  content: string;
  lang: string;
}

interface MarkdownPreview {
  mode: 'markdown';
  content: string;
}

interface HtmlPreview {
  mode: 'html';
  content: string;
}

interface SvgPreview {
  mode: 'svg';
  content: string;
}

interface ImagePreview {
  mode: 'image';
  src: string;
}

interface UnknownPreview {
  mode: 'unknown';
}

type Preview = PlainPreview | CodePreview | MarkdownPreview | HtmlPreview | SvgPreview | ImagePreview | UnknownPreview;

export function ArtifactPreview({
  item,
  projectPath,
  rpc,
  onOpenPath,
  onOpenSession,
  isBookmarked,
  onToggleBookmark,
  t,
}: ArtifactPreviewProps) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inferred = useMemo(() => inferMode(item), [item]);

  useEffect(() => {
    setPreview(null);
    setError(null);
    setCopied(false);
    if (projectPath === undefined) return;
    if (inferred.mode === 'image') {
      if (item.path === undefined) return;
      loadImagePreview(projectPath, item.path, rpc, setPreview, setError);
      return;
    }
    if (item.path === undefined) return;
    let live = true;
    void rpc
      .call('/artifact-viewer', 'file/preview', { projectPath, path: item.path, encoding: 'utf8' })
      .then((result) => {
        if (!live) return;
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        const value = result.value as { content: string };
        setPreview(parseTextPreview(inferred, value.content));
      })
      .catch((e: unknown) => {
        if (live) setError(errorMessage(e));
      });
    return () => {
      live = false;
    };
  }, [item, projectPath, rpc, inferred]);

  const copyText = useMemo(() => (preview === null ? undefined : copyableText(preview)), [preview]);

  const handleCopy = async (): Promise<void> => {
    if (copyText === undefined) return;
    const ok = await writeClipboard(copyText);
    if (ok) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    }
  };

  return (
    <div className={css.preview}>
      <div className={css.header}>
        <span className={css.name}>{item.name}</span>
        <div className={css.actions}>
          <Tooltip label={isBookmarked ? t('artifact.remove') : t('artifact.bookmark')} side="bottom" delayMs={500}>
            <button
              type="button"
              className={css.bookmark}
              aria-pressed={isBookmarked}
              aria-label={isBookmarked ? t('artifact.bookmarked') : t('artifact.bookmark')}
              onClick={() => {
                onToggleBookmark();
              }}
            >
              <StarIcon size={16} filled={isBookmarked} />
            </button>
          </Tooltip>
          {copyText !== undefined && (
            <Tooltip label={copied ? t('artifact.copied') : t('artifact.copy')} side="bottom" delayMs={500}>
              <button
                type="button"
                className={css.copy}
                onClick={() => {
                  void handleCopy();
                }}
                aria-label={t('artifact.copy')}
              >
                <IconCopyOutline16 size={14} />
              </button>
            </Tooltip>
          )}
          {item.sessionId !== undefined && onOpenSession !== undefined && (
            <Tooltip label={t('artifact.session')} side="bottom" delayMs={500}>
              <button
                type="button"
                className={css.session}
                onClick={() => {
                  onOpenSession(item.sessionId!);
                }}
                aria-label={t('artifact.session')}
              >
                <IconNewChatOutline16 size={14} />
              </button>
            </Tooltip>
          )}
          {item.path !== undefined && (
            <Tooltip label={t('artifact.open')} side="bottom" delayMs={500}>
              <button
                type="button"
                className={css.open}
                onClick={() => {
                  void onOpenPath(item.path!);
                }}
                aria-label={t('artifact.open')}
              >
                <IconFolderOpenOutline16 size={14} />
              </button>
            </Tooltip>
          )}
          {item.path !== undefined && (
            <Tooltip label={t('artifact.openFolder')} side="bottom" delayMs={500}>
              <button
                type="button"
                className={css.openFolder}
                onClick={() => {
                  void onOpenPath(dirname(item.path!));
                }}
                aria-label={t('artifact.openFolder')}
              >
                <IconFolderClose16 size={14} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      <div className={css.content}>
        {error !== null && (
          <div className={css.error}>
            {t('preview.error')}: {error}
          </div>
        )}
        {preview !== null && renderPreview(preview, t)}
      </div>
    </div>
  );
}

function loadImagePreview(
  projectPath: string,
  path: string,
  rpc: ConnectionHandle['rpc'],
  setPreview: (preview: Preview) => void,
  setError: (message: string) => void,
): void {
  void rpc
    .call('/artifact-viewer', 'file/preview', { projectPath, path, encoding: 'base64' })
    .then((result) => {
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      const value = result.value as { data: string; mediaType: string };
      setPreview({ mode: 'image', src: `data:${value.mediaType};base64,${value.data}` });
    })
    .catch((e: unknown) => {
      setError(errorMessage(e));
    });
}

interface InferredMode {
  mode: PreviewMode;
  lang?: string;
}

function inferMode(item: DisplayItem): InferredMode {
  const lower = item.name.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return { mode: 'html' };
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return { mode: 'markdown' };
  if (lower.endsWith('.svg')) return { mode: 'svg' };
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif')
  ) {
    return { mode: 'image' };
  }

  const codeLang = codeLanguage(lower);
  if (codeLang !== undefined) return { mode: 'code', lang: codeLang };

  if (item.kind === 'image') return { mode: 'image' };
  return { mode: 'plain' };
}

export function codeLanguage(name: string): string | undefined {
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.js')) return 'javascript';
  if (name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.jsx')) return 'jsx';
  if (name.endsWith('.tsx')) return 'tsx';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.scss')) return 'scss';
  if (name.endsWith('.less')) return 'less';
  if (name.endsWith('.rs')) return 'rust';
  if (name.endsWith('.go')) return 'go';
  if (name.endsWith('.c')) return 'c';
  if (name.endsWith('.cpp') || name.endsWith('.cc')) return 'cpp';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.kt')) return 'kotlin';
  if (name.endsWith('.swift')) return 'swift';
  if (name.endsWith('.rb')) return 'ruby';
  if (name.endsWith('.php')) return 'php';
  if (name.endsWith('.sh')) return 'bash';
  if (name.endsWith('.sql')) return 'sql';
  if (name.endsWith('.xml')) return 'xml';
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'yaml';
  if (name.endsWith('.toml')) return 'toml';
  if (name.endsWith('.dockerfile')) return 'dockerfile';
  if (name.endsWith('.json')) return 'json';
  return undefined;
}

function parseTextPreview(inferred: InferredMode, content: string): Preview {
  const { mode, lang } = inferred;
  if (mode === 'code' && lang !== undefined) {
    return { mode: 'code', content, lang };
  }
  if (mode === 'markdown') return { mode: 'markdown', content };
  if (mode === 'html') return { mode: 'html', content };
  if (mode === 'svg') return { mode: 'svg', content };
  if (mode === 'plain') return { mode: 'plain', content };
  return { mode: 'unknown' };
}

function copyableText(preview: Preview): string | undefined {
  switch (preview.mode) {
    case 'plain':
    case 'code':
    case 'markdown':
    case 'html':
    case 'svg':
      return preview.content;
    default:
      return undefined;
  }
}

function renderPreview(preview: Preview, t: (key: ArtifactViewerKey) => string): React.ReactNode {
  switch (preview.mode) {
    case 'image':
      return <img src={preview.src} alt="" className={css.image} />;
    case 'html':
      return <iframe className={css.frame} sandbox="" srcDoc={preview.content} title={t('artifact.preview')} />;
    case 'svg':
      return (
        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(preview.content)}`} alt="" className={css.image} />
      );
    case 'markdown':
      return <MarkdownPreview content={preview.content} />;
    case 'code':
      return (
        <CodeBlock
          code={preview.content}
          lang={preview.lang}
          className={css.code}
          copyLabel={t('artifact.copy')}
          copiedLabel={t('artifact.copied')}
        />
      );
    case 'plain':
      return <pre className={css.plain}>{preview.content}</pre>;
    default:
      return <div className={css.placeholder}>{t('artifact.kind.unknown')}</div>;
  }
}

function MarkdownPreview({ content }: { content: string }): React.ReactNode {
  const segments = splitMermaidSegments(content);
  if (segments.every((segment) => segment.type === 'markdown')) {
    return <MarkdownText text={content} />;
  }
  return (
    <>
      {segments.map((segment) =>
        segment.type === 'markdown' ? (
          <MarkdownText key={`markdown:${segment.content}`} text={segment.content} />
        ) : (
          <MermaidDiagram
            key={`mermaid:${segment.content}`}
            source={segment.content}
            fallback={<MarkdownText text={`\`\`\`mermaid\n${segment.content}\n\`\`\``} />}
          />
        ),
      )}
    </>
  );
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
