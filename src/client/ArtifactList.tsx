/** Scrollable list of artifacts inside the panel. */

import { IconNewChatOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { ArtifactKindIcon } from './ArtifactKindIcon.js';
import css from './ArtifactList.module.css';
import type { DisplayItem } from './display.js';
import type { ArtifactViewerKey } from './locales.js';
import { StarIcon } from './StarIcon.js';

interface ArtifactListProps {
  items: readonly DisplayItem[];
  bookmarkIds: ReadonlySet<string>;
  showSessionLink?: boolean;
  onSelect: (id: string) => void;
  onToggleBookmark: (item: DisplayItem) => void;
  onOpenSession?: (sessionId: string) => void;
  t: (key: ArtifactViewerKey) => string;
}

export function ArtifactList({
  items,
  bookmarkIds,
  showSessionLink,
  onSelect,
  onToggleBookmark,
  onOpenSession,
  t,
}: ArtifactListProps) {
  return (
    <ul className={css.list}>
      {items.map((item) => (
        <li key={item.id} className={css.row}>
          <button type="button" className={css.select} onClick={() => onSelect(item.id)}>
            <span className={css.kind}>
              <ArtifactKindIcon item={item} size={14} />
            </span>
            <span className={css.name}>{item.name}</span>
          </button>
          {showSessionLink && item.sessionId !== undefined && onOpenSession !== undefined && (
            <Tooltip label={t('artifact.session')} side="bottom" delayMs={500}>
              <button
                type="button"
                className={css.session}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenSession(item.sessionId!);
                }}
                aria-label={t('artifact.session')}
              >
                <IconNewChatOutline16 size={14} />
              </button>
            </Tooltip>
          )}
          {showSessionLink ? (
            <Tooltip
              label={bookmarkIds.has(item.id) ? t('artifact.remove') : t('artifact.bookmark')}
              side="bottom"
              delayMs={500}
            >
              <button
                type="button"
                className={css.star}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleBookmark(item);
                }}
                aria-label={bookmarkIds.has(item.id) ? t('artifact.bookmarked') : t('artifact.bookmark')}
              >
                <StarIcon size={16} filled={bookmarkIds.has(item.id)} />
              </button>
            </Tooltip>
          ) : (
            // Current-session rows: bookmarking happens in the preview header;
            // the star here only marks already-bookmarked items.
            bookmarkIds.has(item.id) && (
              <span className={css.starIndicator} title={t('artifact.bookmarked')}>
                <StarIcon size={16} filled />
              </span>
            )
          )}
        </li>
      ))}
    </ul>
  );
}
