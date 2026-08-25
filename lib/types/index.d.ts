/**
 * `@wang-junjian/dsh-artifact-viewer`: a DeepSeek Harness bundle plugin that
 * adds an artifact sidebar and bookmarking for agent conversations.
 *
 * The plugin registers a loopback RPC channel on the host for persisting
 * bookmarks and previewing files, and a set of client slots that render the
 * artifact panel and intercept message-image rendering.
 *
 * @module @wang-junjian/dsh-artifact-viewer
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "artifact-viewer";
export declare const inject: string[];
/** Plugin config accepted from cordis.yml. */
export interface Config {
    /** Whether to register the artifact viewer plugin. Defaults to true. */
    enabled?: boolean;
}
/** Schemastery config schema with defaults. */
export declare const Config: z<Config>;
/** One bookmarked artifact persisted under the DSH home store. */
export interface BookmarkRecord {
    /** Stable artifact identity used for deduplication. */
    id: string;
    /** Display kind; drives preview affordances. */
    kind: 'image' | 'file' | 'json' | 'video' | 'unknown';
    /** Human-readable name. */
    name: string;
    /** Workspace-absolute path when the artifact is a produced file. */
    path?: string;
    /** Durable attachment id when the artifact is a session image. */
    attachmentId?: string;
    /** Session log seq the artifact was produced at. */
    seq: number;
    /** Owning session id. */
    sessionId: string;
    /** Bookmark creation timestamp. */
    createdAt: number;
}
/**
 * Register the artifact-viewer host services.
 * @param ctx - the Cordis context.
 * @param config - plugin config; schemastery has already applied defaults.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map