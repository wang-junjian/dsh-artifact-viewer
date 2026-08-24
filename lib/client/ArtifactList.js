import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Scrollable list of artifacts inside the panel. */
import { IconNewChatOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { ArtifactKindIcon } from './ArtifactKindIcon.js';
import css from './ArtifactList.module.css';
import { StarIcon } from './StarIcon.js';
export function ArtifactList({ items, bookmarkIds, showSessionLink, onSelect, onToggleBookmark, onOpenSession, t, }) {
    return (_jsx("ul", { className: css.list, children: items.map((item) => (_jsxs("li", { className: css.row, children: [_jsxs("button", { type: "button", className: css.select, onClick: () => onSelect(item.id), children: [_jsx("span", { className: css.kind, children: _jsx(ArtifactKindIcon, { item: item, size: 14 }) }), _jsx("span", { className: css.name, children: item.name })] }), showSessionLink && item.sessionId !== undefined && onOpenSession !== undefined && (_jsx(Tooltip, { label: t('artifact.session'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.session, onClick: (event) => {
                            event.stopPropagation();
                            onOpenSession(item.sessionId);
                        }, "aria-label": t('artifact.session'), children: _jsx(IconNewChatOutline16, { size: 14 }) }) })), _jsx(Tooltip, { label: bookmarkIds.has(item.id) ? t('artifact.remove') : t('artifact.bookmark'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.star, onClick: (event) => {
                            event.stopPropagation();
                            onToggleBookmark(item);
                        }, "aria-label": bookmarkIds.has(item.id) ? t('artifact.bookmarked') : t('artifact.bookmark'), children: _jsx(StarIcon, { size: 16, filled: bookmarkIds.has(item.id) }) }) })] }, item.id))) }));
}
//# sourceMappingURL=ArtifactList.js.map