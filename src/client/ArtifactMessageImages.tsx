/** Replacement for the default message-image renderer that adds bookmark stars. */

import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { useEffect, useMemo, useState } from 'react';
import css from './ArtifactMessageImages.module.css';
import { artifactToBookmark } from './display.js';
import type { MessageImagesFace } from './index.js';
import type { ArtifactViewerKey, NS } from './locales.js';
import { StarIcon } from './StarIcon.js';
import type { Artifact } from './types.js';

export type ArtifactMessageImagesProps = PropsRuntime<'conversation.message.images'> &
  InjectFace<MessageImagesFace> &
  PropsLocale<typeof NS>;

export function ArtifactMessageImages({
  images,
  loadImage,
  align,
  sessionId,
  useSessions,
  useBookmarks,
  bookmarks,
  t,
}: ArtifactMessageImagesProps) {
  const projectPath = useSessions((state) => (sessionId === undefined ? undefined : state.byId[sessionId]?.cwd));
  const bookmarkIds = useBookmarks((state) => new Set(state.bookmarks.map((entry) => entry.id)));

  useEffect(() => {
    if (projectPath !== undefined) {
      void bookmarks.load(projectPath);
    }
  }, [projectPath, bookmarks]);

  const variants = useMemo(
    () =>
      images.map((image, index) => ({
        attachment: image.attachment,
        key: `${image.attachment.attachmentId}:${index}`,
        artifact: imageToArtifact(image.attachment, index),
      })),
    [images],
  );

  if (images.length === 0) return null;
  return (
    <div className={css.gallery} data-align={align}>
      {variants.map(({ attachment, key, artifact }) => (
        <ImageWithBookmark
          key={key}
          attachment={attachment}
          artifact={artifact}
          load={loadImage}
          bookmarked={bookmarkIds.has(artifact.id)}
          onToggle={() => {
            if (projectPath === undefined || sessionId === undefined) return;
            void bookmarks.toggle(projectPath, artifactToBookmark(artifact, sessionId));
          }}
          t={t}
        />
      ))}
    </div>
  );
}

interface ImageWithBookmarkProps {
  attachment: ImageAttachmentRef;
  artifact: Artifact;
  load: (attachment: ImageAttachmentRef) => Promise<string>;
  bookmarked: boolean;
  onToggle: () => void;
  t: (key: ArtifactViewerKey) => string;
}

function ImageWithBookmark({ attachment, load, bookmarked, onToggle, t }: ImageWithBookmarkProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setSrc(null);
    void load(attachment).then((url) => {
      if (live) setSrc(url);
    });
    return () => {
      live = false;
    };
  }, [attachment, load]);

  return (
    <div className={css.frame}>
      {src === null ? (
        <span className={css.loading}>{t('artifact.kind.image')}</span>
      ) : (
        <img src={src} alt={attachment.name ?? ''} className={css.img} />
      )}
      <Tooltip label={bookmarked ? t('artifact.remove') : t('artifact.bookmark')} side="bottom" delayMs={500}>
        <button
          type="button"
          className={css.star}
          onClick={onToggle}
          aria-label={bookmarked ? t('artifact.bookmarked') : t('artifact.bookmark')}
        >
          <StarIcon size={14} filled={bookmarked} />
        </button>
      </Tooltip>
    </div>
  );
}

function imageToArtifact(attachment: ImageAttachmentRef, seq: number): Artifact {
  return {
    id: `img:${attachment.attachmentId}`,
    kind: 'image',
    name: attachment.name ?? `Image ${String(attachment.attachmentId).slice(0, 8)}`,
    source: 'message',
    seq,
    attachment,
  };
}
