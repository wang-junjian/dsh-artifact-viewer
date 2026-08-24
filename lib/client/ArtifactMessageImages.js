import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { useEffect, useMemo, useState } from 'react';
import css from './ArtifactMessageImages.module.css';
import { artifactToBookmark } from './display.js';
import { StarIcon } from './StarIcon.js';
export function ArtifactMessageImages({ images, loadImage, align, sessionId, useSessions, useBookmarks, bookmarks, t, }) {
    const projectPath = useSessions((state) => (sessionId === undefined ? undefined : state.byId[sessionId]?.cwd));
    const bookmarkIds = useBookmarks((state) => new Set(state.bookmarks.map((entry) => entry.id)));
    useEffect(() => {
        if (projectPath !== undefined) {
            void bookmarks.load(projectPath);
        }
    }, [projectPath, bookmarks]);
    const variants = useMemo(() => images.map((image, index) => ({
        attachment: image.attachment,
        key: `${image.attachment.attachmentId}:${index}`,
        artifact: imageToArtifact(image.attachment, index),
    })), [images]);
    if (images.length === 0)
        return null;
    return (_jsx("div", { className: css.gallery, "data-align": align, children: variants.map(({ attachment, key, artifact }) => (_jsx(ImageWithBookmark, { attachment: attachment, artifact: artifact, load: loadImage, bookmarked: bookmarkIds.has(artifact.id), onToggle: () => {
                if (projectPath === undefined || sessionId === undefined)
                    return;
                void bookmarks.toggle(projectPath, artifactToBookmark(artifact, sessionId));
            }, t: t }, key))) }));
}
function ImageWithBookmark({ attachment, load, bookmarked, onToggle, t }) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let live = true;
        setSrc(null);
        void load(attachment).then((url) => {
            if (live)
                setSrc(url);
        });
        return () => {
            live = false;
        };
    }, [attachment, load]);
    return (_jsxs("div", { className: css.frame, children: [src === null ? (_jsx("span", { className: css.loading, children: t('artifact.kind.image') })) : (_jsx("img", { src: src, alt: attachment.name ?? '', className: css.img })), _jsx(Tooltip, { label: bookmarked ? t('artifact.remove') : t('artifact.bookmark'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.star, onClick: onToggle, "aria-label": bookmarked ? t('artifact.bookmarked') : t('artifact.bookmark'), children: _jsx(StarIcon, { size: 14, filled: bookmarked }) }) })] }));
}
function imageToArtifact(attachment, seq) {
    return {
        id: `img:${attachment.attachmentId}`,
        kind: 'image',
        name: attachment.name ?? `Image ${String(attachment.attachmentId).slice(0, 8)}`,
        source: 'message',
        seq,
        attachment,
    };
}
//# sourceMappingURL=ArtifactMessageImages.js.map