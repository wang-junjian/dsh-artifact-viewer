import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Sidebar footer toggle that opens/closes the artifact panel. */
import { IconDataOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './ArtifactToggle.module.css';
export function ArtifactToggle({ wide, useStore, actions, t }) {
    const open = useStore((state) => state.panelOpen);
    return (_jsxs("button", { type: "button", className: `${css.trigger} ${wide ? '' : css.rail}`, onClick: () => actions.togglePanel(), "aria-pressed": open, title: t('toggle.tooltip'), children: [wide ? _jsx(IconDataOutline16, { size: 16 }) : _jsx(IconDataOutline16, { size: 18 }), wide && _jsx("span", { className: css.label, children: t('toggle.label') })] }));
}
//# sourceMappingURL=ArtifactToggle.js.map