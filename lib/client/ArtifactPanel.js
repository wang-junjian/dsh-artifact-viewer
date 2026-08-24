import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Floating artifact/bookmark panel rendered in shell.overlay. */
import { IconCloseOutline16, IconDataOutline16, IconFullscreenOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArtifactList } from './ArtifactList.js';
import css from './ArtifactPanel.module.css';
import { ArtifactPreview } from './ArtifactPreview.js';
import { collectArtifacts } from './artifacts.js';
import { artifactToDisplay, bookmarkToDisplay, displayItemToBookmark } from './display.js';
import { StarIcon } from './StarIcon.js';
const PUSH_CLASS = 'dsh-artifact-viewer-pushed';
const LAYOUT_STYLE_ID = 'dsh-artifact-viewer-layout';
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
export function ArtifactPanel({ useStore, actions, useCurrentSession, useBookmarks, bookmarks, rpc, onOpenPath, onOpenSession, useSessions, t, }) {
    const panelOpen = useStore((state) => state.panelOpen);
    const expanded = useStore((state) => state.expanded);
    const width = useStore((state) => state.width);
    const activeTab = useStore((state) => state.activeTab);
    const sessionSnapshot = useCurrentSession((snapshot) => snapshot);
    const projectPath = useSessions((state) => {
        const current = state.current;
        return current === undefined ? undefined : state.byId[current]?.cwd;
    });
    const bookmarkState = useBookmarks((state) => state);
    const [previewTabs, setPreviewTabs] = useState([]);
    const [activePreviewId, setActivePreviewId] = useState(undefined);
    const [maxVisible, setMaxVisible] = useState(Infinity);
    const [opaqueBg, setOpaqueBg] = useState(false);
    const tabsRef = useRef(null);
    useEffect(() => {
        if (panelOpen && projectPath !== undefined) {
            void bookmarks.load(projectPath);
        }
    }, [panelOpen, projectPath, bookmarks]);
    useEffect(() => {
        const element = tabsRef.current;
        if (element === null)
            return;
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
        if (sessionSnapshot === undefined)
            return [];
        return collectArtifacts(sessionSnapshot);
    }, [sessionSnapshot]);
    const bookmarkArtifacts = useMemo(() => bookmarkState.bookmarks.map(bookmarkToDisplay), [bookmarkState.bookmarks]);
    const displayedItems = activeTab === 'current' ? currentArtifacts.map(artifactToDisplay) : bookmarkArtifacts;
    const bookmarkIds = useMemo(() => new Set(bookmarkState.bookmarks.map((entry) => entry.id)), [bookmarkState.bookmarks]);
    const activePreviewItem = useMemo(() => previewTabs.find((tab) => tab.id === activePreviewId)?.item, [previewTabs, activePreviewId]);
    const activePreviewBookmarked = activePreviewItem !== undefined && bookmarkIds.has(activePreviewItem.id);
    const handleToggleActiveBookmark = () => {
        if (activePreviewItem === undefined)
            return;
        toggleBookmark(activePreviewItem, sessionSnapshot?.sessionId, projectPath, bookmarks);
    };
    const openPreview = (item) => {
        setPreviewTabs((tabs) => {
            const exists = tabs.some((tab) => tab.id === item.id);
            const next = exists ? tabs : [...tabs, { id: item.id, item }];
            setActivePreviewId(item.id);
            return next;
        });
    };
    const closePreviewTab = (id) => {
        setPreviewTabs((tabs) => {
            const index = tabs.findIndex((tab) => tab.id === id);
            if (index === -1)
                return tabs;
            const next = tabs.slice();
            next.splice(index, 1);
            if (activePreviewId === id) {
                const fallback = next[index] ?? next[index - 1] ?? next[0];
                setActivePreviewId(fallback?.id);
            }
            return next;
        });
    };
    const showCurrentArtifacts = () => {
        setActivePreviewId(undefined);
        actions.setTab('current');
    };
    const showBookmarks = () => {
        setActivePreviewId(undefined);
        actions.setTab('bookmarks');
    };
    const panelRef = useRef(null);
    const resizeStart = useRef(undefined);
    useEffect(() => {
        if (!expanded || typeof document === 'undefined')
            return;
        const body = document.body;
        const computed = getComputedStyle(body);
        const bgBase = computed.getPropertyValue('--dsw-alias-bg-base').trim();
        const bgImage = computed.backgroundImage.trim();
        const isImageOrTransparent = bgBase.includes('url(') || bgBase === 'transparent' || /^rgba?\(.*,\s*0\s*\)/.test(bgBase) || bgImage !== 'none';
        setOpaqueBg(isImageOrTransparent);
    }, [expanded]);
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        let style = document.getElementById(LAYOUT_STYLE_ID);
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
        if (typeof document === 'undefined')
            return;
        const frame = (() => {
            let el = panelRef.current;
            while (el !== null) {
                if (el.hasAttribute('data-shell-overlay')) {
                    return el.parentElement;
                }
                el = el.parentElement;
            }
            return document.querySelector('[data-shell-overlay]')?.parentElement ?? null;
        })();
        if (!(frame instanceof HTMLElement))
            return;
        if (panelOpen && !expanded) {
            frame.classList.add(PUSH_CLASS);
            frame.style.setProperty('--dsh-artifact-viewer-width', `${width}px`);
        }
        else {
            frame.classList.remove(PUSH_CLASS);
            frame.style.removeProperty('--dsh-artifact-viewer-width');
        }
    }, [panelOpen, expanded, width]);
    const onResizeStart = useCallback((event) => {
        resizeStart.current = { x: event.clientX, width };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [width]);
    const onResizeMove = useCallback((event) => {
        if (resizeStart.current === undefined)
            return;
        const dx = resizeStart.current.x - event.clientX;
        const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.current.width + dx));
        actions.setWidth(next);
    }, [actions]);
    const onResizeEnd = useCallback((event) => {
        if (resizeStart.current === undefined)
            return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        resizeStart.current = undefined;
    }, []);
    if (!panelOpen)
        return null;
    return (_jsxs("div", { ref: panelRef, className: `${css.panel} ${expanded ? css.expanded : ''} ${expanded && opaqueBg ? css.opaque : ''}`, style: { width: expanded ? '100vw' : width }, role: "dialog", "aria-label": t('panel.title'), children: [_jsx("div", { className: css.resizeHandle, onPointerDown: onResizeStart, onPointerMove: onResizeMove, onPointerUp: onResizeEnd }), _jsxs("div", { className: css.header, children: [_jsxs("button", { type: "button", className: css.title, "aria-pressed": activeTab === 'current', onClick: showCurrentArtifacts, title: t('tab.current'), children: [_jsx(IconDataOutline16, { size: 16 }), t('panel.title')] }), previewTabs.length > 0 && (_jsx("div", { ref: tabsRef, className: css.previewTabs, children: previewTabs.slice(-maxVisible).map((tab) => (_jsxs("button", { type: "button", className: tab.id === activePreviewId ? css.previewTabActive : css.previewTab, onClick: () => {
                                setActivePreviewId(tab.id);
                            }, children: [_jsx("span", { className: css.previewTabName, children: tab.item.name }), _jsx("button", { type: "button", className: css.previewTabClose, onClick: (event) => {
                                        event.stopPropagation();
                                        closePreviewTab(tab.id);
                                    }, "aria-label": t('tab.close'), children: _jsx(IconCloseOutline16, { size: 12 }) })] }, tab.id))) })), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.bookmarks, "aria-pressed": activeTab === 'bookmarks', title: t('panel.bookmarks'), onClick: showBookmarks, children: _jsx(StarIcon, { size: 16, filled: activeTab === 'bookmarks' }) }), _jsx("button", { type: "button", className: css.expand, "aria-pressed": expanded, title: expanded ? t('panel.shrink') : t('panel.expand'), onClick: () => actions.toggleExpand(), children: _jsx(IconFullscreenOutline16, { size: 16 }) }), _jsx("button", { type: "button", className: css.close, onClick: () => actions.closePanel(), "aria-label": t('panel.close'), children: _jsx(IconCloseOutline16, { size: 16 }) })] })] }), activePreviewItem === undefined ? (_jsx("div", { className: css.body, children: displayedItems.length === 0 ? (_jsx("div", { className: css.empty, children: activeTab === 'current' ? t('empty.current') : t('empty.bookmarks') })) : (_jsx(ArtifactList, { items: displayedItems, bookmarkIds: bookmarkIds, showSessionLink: activeTab === 'bookmarks', onSelect: (id) => {
                        const item = displayedItems.find((entry) => entry.id === id);
                        if (item !== undefined)
                            openPreview(item);
                    }, onToggleBookmark: (item) => toggleBookmark(item, sessionSnapshot?.sessionId, projectPath, bookmarks), onOpenSession: (sessionId) => {
                        onOpenSession(sessionId);
                    }, t: t })) })) : (_jsx("div", { className: css.preview, children: _jsx(ArtifactPreview, { item: activePreviewItem, projectPath: projectPath, rpc: rpc, onOpenPath: onOpenPath, onOpenSession: onOpenSession, isBookmarked: activePreviewBookmarked, onToggleBookmark: handleToggleActiveBookmark, t: t }) }))] }));
}
function toggleBookmark(item, sessionId, projectPath, bookmarks) {
    if (projectPath === undefined)
        return;
    const resolvedSessionId = sessionId ?? item.sessionId;
    if (resolvedSessionId === undefined)
        return;
    void bookmarks.toggle(projectPath, displayItemToBookmark(item, resolvedSessionId));
}
//# sourceMappingURL=ArtifactPanel.js.map