/** Artifact detection from a conversation snapshot. */
import type { ConversationSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { Artifact, ArtifactKind } from './types.js';
/** Collect every artifact visible in the current conversation window. */
export declare function collectArtifacts(snapshot: ConversationSnapshot): Artifact[];
export declare function inferFileKind(path: string): ArtifactKind;
export declare function basename(path: string): string;
//# sourceMappingURL=artifacts.d.ts.map