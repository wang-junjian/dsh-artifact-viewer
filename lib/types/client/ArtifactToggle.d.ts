/** Sidebar footer toggle that opens/closes the artifact panel. */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { NS } from './locales.js';
import type { createArtifactViewerStore } from './store.js';
export type ArtifactToggleProps = PropsRuntime<'sidebar.footer.action'> & PropsStore<ReturnType<typeof createArtifactViewerStore>> & PropsLocale<typeof NS>;
export declare function ArtifactToggle({ wide, useStore, actions, t }: ArtifactToggleProps): import("react").JSX.Element;
//# sourceMappingURL=ArtifactToggle.d.ts.map