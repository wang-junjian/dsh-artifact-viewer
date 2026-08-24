import { jsx as _jsx } from "react/jsx-runtime";
const STAR_PATH = 'M8 1L9.76 5.57L14.66 5.84L10.85 8.93L12.11 13.66L8 11L3.89 13.66L5.15 8.93L1.34 5.84L6.24 5.57L8 1Z';
export function StarIcon({ size = 16, filled = false, ...rest }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", ...rest, children: _jsx("path", { d: STAR_PATH, fill: filled ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round", strokeLinecap: "round" }) }));
}
//# sourceMappingURL=StarIcon.js.map