/** Floating artifact/bookmark panel rendered in shell.overlay. */

import { IconCloseOutline16, IconDataOutline16, IconFullscreenOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArtifactList } from './ArtifactList.js';
import css from './ArtifactPanel.module.css';
import { ArtifactPreview } from './ArtifactPreview.js';
import { collectArtifacts } from './artifacts.js';
import type { BookmarkController } from './bookmarks.js';
import {
  artifactToDisplay,
  bookmarkToDisplay,
  createDisplayItemFromPath,
  type DisplayItem,
  displayItemToBookmark,
} from './display.js';
import type { ArtifactPanelFace } from './index.js';
import type { NS } from './locales.js';
import { StarIcon } from './StarIcon.js';
import type { createArtifactViewerStore } from './store.js';

export type ArtifactPanelProps = PropsRuntime<'shell.overlay'> &
  PropsStore<ReturnType<typeof createArtifactViewerStore>> &
  InjectFace<ArtifactPanelFace> &
  PropsLocale<typeof NS>;

const PUSH_CLASS = 'dsh-artifact-viewer-pushed';
const LAYOUT_STYLE_ID = 'dsh-artifact-viewer-layout';
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;

interface PreviewTab {
  /** Stable tab id; reuses the artifact/bookmark id. */
  id: string;
  /** Display item rendered in this tab. */
  item: DisplayItem;
}

export function ArtifactPanel({
  useStore,
  actions,
  useCurrentSession,
  useBookmarks,
  bookmarks,
  rpc,
  onOpenPath,
  onOpenSession,
  useSessions,
  t,
}: ArtifactPanelProps) {
  const panelOpen = useStore((state) => state.panelOpen);
  const expanded = useStore((state) => state.expanded);
  const width = useStore((state) => state.width);
  const activeTab = useStore((state) => state.activeTab);
  const pendingOpenPath = useStore((state) => state.pendingOpenPath);
  const sessionSnapshot = useCurrentSession((snapshot) => snapshot);
  const projectPath = useSessions((state) => {
    const current = state.current;
    return current === undefined ? undefined : state.byId[current]?.cwd;
  });
  const bookmarkState = useBookmarks((state) => state);

  const [previewTabs, setPreviewTabs] = useState<PreviewTab[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | undefined>(undefined);
  const [maxVisible, setMaxVisible] = useState<number>(Infinity);
  const [opaqueBg, setOpaqueBg] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const sessionId = sessionSnapshot?.sessionId;
  const lastSessionIdRef = useRef(sessionId);

  useEffect(() => {
    if (lastSessionIdRef.current === sessionId) return;
    lastSessionIdRef.current = sessionId;
    // Opened preview documents belong to the session they came from; switching
    // sessions invalidates them, so close every preview tab.
    setPreviewTabs([]);
    setActivePreviewId(undefined);
  }, [sessionId]);

  useEffect(() => {
    if (panelOpen && projectPath !== undefined) {
      void bookmarks.load(projectPath);
    }
  }, [panelOpen, projectPath, bookmarks]);

  useEffect(() => {
    const element = tabsRef.current;
    if (element === null) return;

    const MIN_TAB_WIDTH = 60;
    const update = () => {
      const width = element.clientWidth;
      const minTotal = previewTabs.length * MIN_TAB_WIDTH;
      setMaxVisible(minTotal <= width ? Infinity : Math.max(1, Math.floor(width / MIN_TAB_WIDTH)));
    };
    update();

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
    };
  }, [previewTabs.length]);

  const currentArtifacts = useMemo(() => {
    if (sessionSnapshot === undefined) return [];
    return collectArtifacts(sessionSnapshot);
  }, [sessionSnapshot]);

  const bookmarkArtifacts = useMemo(() => bookmarkState.bookmarks.map(bookmarkToDisplay), [bookmarkState.bookmarks]);

  const displayedItems = activeTab === 'current' ? currentArtifacts.map(artifactToDisplay) : bookmarkArtifacts;

  const bookmarkIds = useMemo(
    () => new Set(bookmarkState.bookmarks.map((entry) => entry.id)),
    [bookmarkState.bookmarks],
  );

  const activePreviewItem = useMemo(
    () => previewTabs.find((tab) => tab.id === activePreviewId)?.item,
    [previewTabs, activePreviewId],
  );

  const activePreviewBookmarked = activePreviewItem !== undefined && bookmarkIds.has(activePreviewItem.id);

  const handleToggleActiveBookmark = (): void => {
    if (activePreviewItem === undefined) return;
    toggleBookmark(activePreviewItem, sessionSnapshot?.sessionId, projectPath, bookmarks);
  };

  const openPreview = useCallback((item: DisplayItem): void => {
    setPreviewTabs((tabs) => {
      const exists = tabs.some((tab) => tab.id === item.id);
      const next = exists ? tabs : [...tabs, { id: item.id, item }];
      setActivePreviewId(item.id);
      return next;
    });
  }, []);

  const closePreviewTab = (id: string): void => {
    setPreviewTabs((tabs) => {
      const index = tabs.findIndex((tab) => tab.id === id);
      if (index === -1) return tabs;
      const next = tabs.slice();
      next.splice(index, 1);
      if (activePreviewId === id) {
        const fallback = next[index] ?? next[index - 1] ?? next[0];
        setActivePreviewId(fallback?.id);
      }
      return next;
    });
  };

  const showCurrentArtifacts = (): void => {
    setActivePreviewId(undefined);
    actions.setTab('current');
  };

  const showBookmarks = (): void => {
    setActivePreviewId(undefined);
    actions.setTab('bookmarks');
  };

  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStart = useRef<{ x: number; width: number } | undefined>(undefined);

  useEffect(() => {
    if (!expanded || typeof document === 'undefined') return;
    const body = document.body;
    const computed = getComputedStyle(body);
    const bgBase = computed.getPropertyValue('--dsw-alias-bg-base').trim();
    const bgImage = computed.backgroundImage.trim();
    const isImageOrTransparent =
      bgBase.includes('url(') || bgBase === 'transparent' || /^rgba?\(.*,\s*0\s*\)/.test(bgBase) || bgImage !== 'none';
    setOpaqueBg(isImageOrTransparent);
  }, [expanded]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const FILE_LINK_SELECTOR = '[class*="fileLink"]';
    const FILE_MENTION_SELECTOR = '[class*="fileMention"]';

    const onClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const fileLink = target.closest(FILE_LINK_SELECTOR);
      if (fileLink instanceof HTMLElement) {
        const path = fileLink.textContent?.trim();
        if (path !== undefined && path !== '') {
          event.preventDefault();
          event.stopPropagation();
          actions.openArtifactByPath(path);
          return;
        }
      }

      // Intercept the ui-deliverables turn-tail produced-files chips.
      const producedRow = target.closest('[data-produced-files-row]');
      if (producedRow instanceof HTMLElement) {
        const chip = target.closest('button');
        if (chip instanceof HTMLButtonElement) {
          const path = chip.title.trim();
          if (path !== '') {
            event.preventDefault();
            event.stopPropagation();
            actions.openArtifactByPath(path);
            return;
          }
        }
      }

      // Intercept inline-code file mentions rendered by ui-deliverables.
      const fileMention = target.closest(FILE_MENTION_SELECTOR);
      if (fileMention instanceof HTMLElement) {
        const path = fileMention.title.trim();
        if (path !== '') {
          event.preventDefault();
          event.stopPropagation();
          actions.openArtifactByPath(path);
          return;
        }
      }

      // Intercept markdown links whose href points to a local file, e.g.
      // [sample.html](/Users/.../sample.html).
      const anchor = target.closest('a');
      if (anchor instanceof HTMLAnchorElement) {
        const rawHref = anchor.getAttribute('href')?.trim();
        if (rawHref !== undefined && rawHref !== '' && !isExternalUrl(rawHref)) {
          const path = stripFileProtocol(rawHref);
          if (looksLikeFilePath(path)) {
            event.preventDefault();
            event.stopPropagation();
            actions.openArtifactByPath(path);
            return;
          }
        }
      }

      // Also intercept inline <code> elements that contain what looks like an
      // absolute file path, e.g. `/Users/.../cat.svg` in a generated message.
      const code = target.closest('code');
      if (code instanceof HTMLElement && code.closest('pre') === null) {
        const path = code.textContent?.trim();
        if (path !== undefined && looksLikeAbsolutePath(path)) {
          event.preventDefault();
          event.stopPropagation();
          actions.openArtifactByPath(path);
        }
      }
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
    };
  }, [actions]);

  useEffect(() => {
    if (pendingOpenPath === undefined || projectPath === undefined) return;

    const normalizedPath = stripFileProtocol(pendingOpenPath);
    const absolutePath = normalizedPath.startsWith('/')
      ? normalizedPath
      : `${projectPath}/${normalizedPath.replace(/^\.\//, '')}`;

    const existing = currentArtifacts.find((artifact) => artifact.path === absolutePath);
    if (existing !== undefined) {
      openPreview(artifactToDisplay(existing));
    } else {
      openPreview(createDisplayItemFromPath(absolutePath));
    }

    actions.clearPendingOpenPath();
  }, [pendingOpenPath, projectPath, currentArtifacts, actions, openPreview]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let style = document.getElementById(LAYOUT_STYLE_ID) as HTMLStyleElement | null;
    if (style === null) {
      style = document.createElement('style');
      style.id = LAYOUT_STYLE_ID;
      style.textContent = `
        .${PUSH_CLASS} > div:nth-child(2),
        .${PUSH_CLASS} > div:nth-child(3) {
          margin-right: var(--dsh-artifact-viewer-width, 0px) !important;
          transition: margin-right var(--ds-transition-duration-slow, 0.2s) var(--ds-ease-in-out, ease);
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      style?.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const frame = ((): HTMLElement | null => {
      let el: HTMLElement | null = panelRef.current;
      while (el !== null) {
        if (el.hasAttribute('data-shell-overlay')) {
          return el.parentElement;
        }
        el = el.parentElement;
      }
      return document.querySelector('[data-shell-overlay]')?.parentElement ?? null;
    })();
    if (!(frame instanceof HTMLElement)) return;
    if (panelOpen && !expanded) {
      frame.classList.add(PUSH_CLASS);
      frame.style.setProperty('--dsh-artifact-viewer-width', `${width}px`);
    } else {
      frame.classList.remove(PUSH_CLASS);
      frame.style.removeProperty('--dsh-artifact-viewer-width');
    }
  }, [panelOpen, expanded, width]);

  const onResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      resizeStart.current = { x: event.clientX, width };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [width],
  );

  const onResizeMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (resizeStart.current === undefined) return;
      const dx = resizeStart.current.x - event.clientX;
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.current.width + dx));
      actions.setWidth(next);
    },
    [actions],
  );

  const onResizeEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeStart.current === undefined) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    resizeStart.current = undefined;
  }, []);

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`${css.panel} ${expanded ? css.expanded : ''} ${expanded && opaqueBg ? css.opaque : ''}`}
      style={{ width: expanded ? '100vw' : width }}
      role="dialog"
      aria-label={t('panel.title')}
    >
      <div
        className={css.resizeHandle}
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
      />
      <div className={css.header}>
        <button
          type="button"
          className={css.title}
          aria-pressed={activeTab === 'current'}
          onClick={showCurrentArtifacts}
          title={t('tab.current')}
        >
          <IconDataOutline16 size={16} />
          {t('panel.title')}
        </button>
        {previewTabs.length > 0 && (
          <div ref={tabsRef} className={css.previewTabs}>
            {previewTabs.slice(-maxVisible).map((tab) => (
              <div key={tab.id} className={tab.id === activePreviewId ? css.previewTabActive : css.previewTab}>
                <button
                  type="button"
                  className={css.previewTabName}
                  onClick={() => {
                    setActivePreviewId(tab.id);
                  }}
                >
                  {tab.item.name}
                </button>
                <button
                  type="button"
                  className={css.previewTabClose}
                  onClick={(event) => {
                    event.stopPropagation();
                    closePreviewTab(tab.id);
                  }}
                  aria-label={t('tab.close')}
                >
                  <IconCloseOutline16 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={css.actions}>
          <button
            type="button"
            className={css.bookmarks}
            aria-pressed={activeTab === 'bookmarks'}
            title={t('panel.bookmarks')}
            onClick={showBookmarks}
          >
            <StarIcon size={16} filled={activeTab === 'bookmarks'} />
          </button>
          <button
            type="button"
            className={css.expand}
            aria-pressed={expanded}
            title={expanded ? t('panel.shrink') : t('panel.expand')}
            onClick={() => actions.toggleExpand()}
          >
            <IconFullscreenOutline16 size={16} />
          </button>
          <button
            type="button"
            className={css.close}
            onClick={() => actions.closePanel()}
            aria-label={t('panel.close')}
          >
            <IconCloseOutline16 size={16} />
          </button>
        </div>
      </div>
      {activePreviewItem === undefined ? (
        <div className={css.body}>
          {displayedItems.length === 0 ? (
            <div className={css.empty}>{activeTab === 'current' ? t('empty.current') : t('empty.bookmarks')}</div>
          ) : (
            <ArtifactList
              items={displayedItems}
              bookmarkIds={bookmarkIds}
              showSessionLink={activeTab === 'bookmarks'}
              onSelect={(id) => {
                const item = displayedItems.find((entry) => entry.id === id);
                if (item !== undefined) openPreview(item);
              }}
              onToggleBookmark={(item) => toggleBookmark(item, sessionSnapshot?.sessionId, projectPath, bookmarks)}
              onOpenSession={(sessionId) => {
                onOpenSession(sessionId);
              }}
              t={t}
            />
          )}
        </div>
      ) : (
        <div className={css.preview}>
          <ArtifactPreview
            item={activePreviewItem}
            projectPath={projectPath}
            rpc={rpc}
            onOpenPath={onOpenPath}
            onOpenSession={onOpenSession}
            isBookmarked={activePreviewBookmarked}
            onToggleBookmark={handleToggleActiveBookmark}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

function toggleBookmark(
  item: DisplayItem,
  sessionId: string | undefined,
  projectPath: string | undefined,
  bookmarks: BookmarkController,
): void {
  if (projectPath === undefined) return;
  const resolvedSessionId = sessionId ?? item.sessionId;
  if (resolvedSessionId === undefined) return;
  void bookmarks.toggle(projectPath, displayItemToBookmark(item, resolvedSessionId));
}

function looksLikeAbsolutePath(text: string): boolean {
  if (text.length < 2) return false;
  if (text.startsWith('/')) return true;
  if (/^[A-Za-z]:[\\/]/.test(text)) return true;
  return false;
}

function looksLikeFilePath(text: string): boolean {
  if (text.length < 2) return false;
  if (text.startsWith('/')) return true;
  if (/^[A-Za-z]:[\\/]/.test(text)) return true;
  if (text.startsWith('./') || text.startsWith('../')) return true;
  // A bare filename with an extension, e.g. "sample.html".
  if (/^[^/]+\.[^./]+$/.test(text)) return true;
  return false;
}

function isExternalUrl(href: string): boolean {
  return /^(https?|ftp|mailto|data|blob):/i.test(href);
}

function stripFileProtocol(href: string): string {
  if (href.startsWith('file://')) {
    return href.slice('file://'.length);
  }
  return href;
}
