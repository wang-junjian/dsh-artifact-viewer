/** Replacement for the default message-image renderer that adds bookmark stars. */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { MessageImagesFace } from './index.js';
import type { NS } from './locales.js';
export type ArtifactMessageImagesProps = PropsRuntime<'conversation.message.images'> & InjectFace<MessageImagesFace> & PropsLocale<typeof NS>;
export declare function ArtifactMessageImages({ images, loadImage, align, sessionId, useSessions, useBookmarks, bookmarks, t, }: ArtifactMessageImagesProps): import("react").JSX.Element | null;
//# sourceMappingURL=ArtifactMessageImages.d.ts.map