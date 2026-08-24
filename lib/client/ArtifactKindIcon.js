import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Small kind icon shown before an artifact name in the list. */
import { IconCodeOutline16, IconDataOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import { codeLanguage } from './ArtifactPreview.js';
export function ArtifactKindIcon({ item, size = 14 }) {
    const common = { size, className: undefined };
    switch (item.kind) {
        case 'image':
            return _jsx(ImageIcon, { ...common });
        case 'video':
            return _jsx(VideoIcon, { ...common });
        case 'json':
            return _jsx(IconDataOutline16, { ...common });
        case 'file':
            if (item.name.toLowerCase().endsWith('.txt') ||
                item.name.toLowerCase().endsWith('.md') ||
                item.name.toLowerCase().endsWith('.log')) {
                return _jsx(TextIcon, { ...common });
            }
            if (codeLanguage(item.name) !== undefined) {
                return _jsx(IconCodeOutline16, { ...common });
            }
            return _jsx(FileIcon, { ...common });
        default:
            return _jsx(FileIcon, { ...common });
    }
}
function FileIcon({ size = 14 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round", children: [_jsx("path", { d: "M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" }), _jsx("path", { d: "M9 2v4h4" })] }));
}
function ImageIcon({ size = 14 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round", children: [_jsx("rect", { x: "2", y: "3", width: "12", height: "10", rx: "1" }), _jsx("path", { d: "M3 12l3-3 2 2 3-3 2 2" }), _jsx("circle", { cx: "11.5", cy: "6.5", r: "1.5" })] }));
}
function VideoIcon({ size = 14 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round", children: [_jsx("rect", { x: "2", y: "4", width: "12", height: "8", rx: "1" }), _jsx("path", { d: "M7 6.5l4 1.5-4 1.5z" })] }));
}
function TextIcon({ size = 14 }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round", children: _jsx("path", { d: "M3 5h10M3 8h10M3 11h6" }) }));
}
//# sourceMappingURL=ArtifactKindIcon.js.map