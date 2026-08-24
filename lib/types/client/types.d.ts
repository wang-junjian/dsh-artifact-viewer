/** Artifact types shared between detection, bookmarking, and UI components. */
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
/** Display/preview category of an artifact. */
export type ArtifactKind = 'image' | 'file' | 'json' | 'video' | 'unknown';
/** One artifact discovered from the current conversation. */
export interface Artifact {
    /** Stable identity; used as selection and bookmark key. */
    id: string;
    /** Display kind. */
    kind: ArtifactKind;
    /** Display name. */
    name: string;
    /** Where the artifact came from in the conversation. */
    source: 'message' | 'tool';
    /** Session log seq at which the artifact was produced. */
    seq: number;
    /** Durable image reference when the artifact is a session image. */
    attachment?: ImageAttachmentRef;
    /** Filesystem path when the artifact is a produced file. */
    path?: string;
}
//# sourceMappingURL=types.d.ts.map