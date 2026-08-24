import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CodeBlock, IconCopyOutline16, IconFolderOpenOutline16, IconNewChatOutline16, MarkdownText, Tooltip, writeClipboard, } from '@deepseek-ai/dsh-client-ui-primitives';
import { useEffect, useMemo, useState } from 'react';
import css from './ArtifactPreview.module.css';
import { StarIcon } from './StarIcon.js';
export function ArtifactPreview({ item, projectPath, rpc, onOpenPath, onOpenSession, isBookmarked, onToggleBookmark, t, }) {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const inferred = useMemo(() => inferMode(item), [item]);
    useEffect(() => {
        setPreview(null);
        setError(null);
        setCopied(false);
        if (projectPath === undefined)
            return;
        if (inferred.mode === 'image') {
            if (item.path === undefined)
                return;
            loadImagePreview(projectPath, item.path, rpc, setPreview, setError);
            return;
        }
        if (item.path === undefined)
            return;
        let live = true;
        void rpc
            .call('/artifact-viewer', 'file/preview', { projectPath, path: item.path, encoding: 'utf8' })
            .then((result) => {
            if (!live)
                return;
            if (!result.ok) {
                setError(result.error.message);
                return;
            }
            const value = result.value;
            setPreview(parseTextPreview(inferred, value.content));
        })
            .catch((e) => {
            if (live)
                setError(errorMessage(e));
        });
        return () => {
            live = false;
        };
    }, [item, projectPath, rpc, inferred]);
    const copyText = useMemo(() => (preview === null ? undefined : copyableText(preview)), [preview]);
    const handleCopy = async () => {
        if (copyText === undefined)
            return;
        const ok = await writeClipboard(copyText);
        if (ok) {
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 1500);
        }
    };
    return (_jsxs("div", { className: css.preview, children: [_jsxs("div", { className: css.header, children: [_jsx("span", { className: css.name, children: item.name }), _jsxs("div", { className: css.actions, children: [_jsx(Tooltip, { label: isBookmarked ? t('artifact.remove') : t('artifact.bookmark'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.bookmark, "aria-pressed": isBookmarked, "aria-label": isBookmarked ? t('artifact.bookmarked') : t('artifact.bookmark'), onClick: () => {
                                        onToggleBookmark();
                                    }, children: _jsx(StarIcon, { size: 16, filled: isBookmarked }) }) }), copyText !== undefined && (_jsx(Tooltip, { label: copied ? t('artifact.copied') : t('artifact.copy'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.copy, onClick: () => {
                                        void handleCopy();
                                    }, "aria-label": t('artifact.copy'), children: _jsx(IconCopyOutline16, { size: 14 }) }) })), item.sessionId !== undefined && onOpenSession !== undefined && (_jsx(Tooltip, { label: t('artifact.session'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.session, onClick: () => {
                                        onOpenSession(item.sessionId);
                                    }, "aria-label": t('artifact.session'), children: _jsx(IconNewChatOutline16, { size: 14 }) }) })), item.path !== undefined && (_jsx(Tooltip, { label: t('artifact.open'), side: "bottom", delayMs: 500, children: _jsx("button", { type: "button", className: css.open, onClick: () => {
                                        void onOpenPath(item.path);
                                    }, "aria-label": t('artifact.open'), children: _jsx(IconFolderOpenOutline16, { size: 14 }) }) }))] })] }), _jsxs("div", { className: css.content, children: [error !== null && (_jsxs("div", { className: css.error, children: [t('preview.error'), ": ", error] })), preview !== null && renderPreview(preview, t)] })] }));
}
function loadImagePreview(projectPath, path, rpc, setPreview, setError) {
    void rpc
        .call('/artifact-viewer', 'file/preview', { projectPath, path, encoding: 'base64' })
        .then((result) => {
        if (!result.ok) {
            setError(result.error.message);
            return;
        }
        const value = result.value;
        setPreview({ mode: 'image', src: `data:${value.mediaType};base64,${value.data}` });
    })
        .catch((e) => {
        setError(errorMessage(e));
    });
}
function inferMode(item) {
    const lower = item.name.toLowerCase();
    if (lower.endsWith('.html') || lower.endsWith('.htm'))
        return { mode: 'html' };
    if (lower.endsWith('.md') || lower.endsWith('.markdown'))
        return { mode: 'markdown' };
    if (lower.endsWith('.svg'))
        return { mode: 'svg' };
    if (lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif')) {
        return { mode: 'image' };
    }
    const codeLang = codeLanguage(lower);
    if (codeLang !== undefined)
        return { mode: 'code', lang: codeLang };
    if (item.kind === 'image')
        return { mode: 'image' };
    return { mode: 'plain' };
}
export function codeLanguage(name) {
    if (name.endsWith('.py'))
        return 'python';
    if (name.endsWith('.js'))
        return 'javascript';
    if (name.endsWith('.ts'))
        return 'typescript';
    if (name.endsWith('.jsx'))
        return 'jsx';
    if (name.endsWith('.tsx'))
        return 'tsx';
    if (name.endsWith('.css'))
        return 'css';
    if (name.endsWith('.scss'))
        return 'scss';
    if (name.endsWith('.less'))
        return 'less';
    if (name.endsWith('.rs'))
        return 'rust';
    if (name.endsWith('.go'))
        return 'go';
    if (name.endsWith('.c'))
        return 'c';
    if (name.endsWith('.cpp') || name.endsWith('.cc'))
        return 'cpp';
    if (name.endsWith('.java'))
        return 'java';
    if (name.endsWith('.kt'))
        return 'kotlin';
    if (name.endsWith('.swift'))
        return 'swift';
    if (name.endsWith('.rb'))
        return 'ruby';
    if (name.endsWith('.php'))
        return 'php';
    if (name.endsWith('.sh'))
        return 'bash';
    if (name.endsWith('.sql'))
        return 'sql';
    if (name.endsWith('.xml'))
        return 'xml';
    if (name.endsWith('.yaml') || name.endsWith('.yml'))
        return 'yaml';
    if (name.endsWith('.toml'))
        return 'toml';
    if (name.endsWith('.dockerfile'))
        return 'dockerfile';
    if (name.endsWith('.json'))
        return 'json';
    return undefined;
}
function parseTextPreview(inferred, content) {
    const { mode, lang } = inferred;
    if (mode === 'code' && lang !== undefined) {
        return { mode: 'code', content, lang };
    }
    if (mode === 'markdown')
        return { mode: 'markdown', content };
    if (mode === 'html')
        return { mode: 'html', content };
    if (mode === 'svg')
        return { mode: 'svg', content };
    if (mode === 'plain')
        return { mode: 'plain', content };
    return { mode: 'unknown' };
}
function copyableText(preview) {
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
function renderPreview(preview, t) {
    switch (preview.mode) {
        case 'image':
            return _jsx("img", { src: preview.src, alt: "", className: css.image });
        case 'html':
            return _jsx("iframe", { className: css.frame, sandbox: "", srcDoc: preview.content, title: t('artifact.preview') });
        case 'svg':
            return (_jsx("img", { src: `data:image/svg+xml;utf8,${encodeURIComponent(preview.content)}`, alt: "", className: css.image }));
        case 'markdown':
            return _jsx(MarkdownText, { text: preview.content });
        case 'code':
            return (_jsx(CodeBlock, { code: preview.content, lang: preview.lang, className: css.code, copyLabel: t('artifact.copy'), copiedLabel: t('artifact.copied') }));
        case 'plain':
            return _jsx("pre", { className: css.plain, children: preview.content });
        default:
            return _jsx("div", { className: css.placeholder, children: t('artifact.kind.unknown') });
    }
}
function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
//# sourceMappingURL=ArtifactPreview.js.map