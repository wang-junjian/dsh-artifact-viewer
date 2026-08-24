/** Sidebar footer toggle that opens/closes the artifact panel. */

import { IconDataOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import css from './ArtifactToggle.module.css';
import type { NS } from './locales.js';
import type { createArtifactViewerStore } from './store.js';

export type ArtifactToggleProps = PropsRuntime<'sidebar.footer.action'> &
  PropsStore<ReturnType<typeof createArtifactViewerStore>> &
  PropsLocale<typeof NS>;

export function ArtifactToggle({ wide, useStore, actions, t }: ArtifactToggleProps) {
  const open = useStore((state) => state.panelOpen);
  return (
    <button
      type="button"
      className={`${css.trigger} ${wide ? '' : css.rail}`}
      onClick={() => actions.togglePanel()}
      aria-pressed={open}
      title={t('toggle.tooltip')}
    >
      {wide ? <IconDataOutline16 size={16} /> : <IconDataOutline16 size={18} />}
      {wide && <span className={css.label}>{t('toggle.label')}</span>}
    </button>
  );
}
