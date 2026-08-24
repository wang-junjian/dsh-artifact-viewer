/**
 * Integration tests for the artifact-viewer Cordis plugin registration.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as ArtifactViewerPlugin from '../src/index.js';

describe('artifact-viewer plugin', () => {
  let ctx: Context;
  let fiber: Awaited<ReturnType<Context['plugin']>>;
  let tmpDir: string;
  let rpcHandlers: Map<string, (endpoint: string, payload: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dsh-artifact-viewer-'));
    rpcHandlers = new Map();

    ctx = new Context();
    ctx.provide('connection', {
      rpc: {
        handle: vi.fn((channel: string, handler: (endpoint: string, payload: unknown) => Promise<unknown>) => {
          rpcHandlers.set(channel, handler);
          return () => {
            rpcHandlers.delete(channel);
          };
        }),
      },
    } as never);

    fiber = await ctx.plugin(ArtifactViewerPlugin, {});
  });

  afterEach(async () => {
    await fiber.dispose();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('registers the /artifact-viewer RPC channel', () => {
    expect(rpcHandlers.has('/artifact-viewer')).toBe(true);
  });

  it('does not register when disabled', async () => {
    await fiber.dispose();
    const disabledCtx = new Context();
    disabledCtx.provide('connection', {
      rpc: {
        handle: vi.fn(() => () => {}),
      },
    } as never);
    const disabledFiber = await disabledCtx.plugin(ArtifactViewerPlugin, { enabled: false });
    try {
      expect(disabledCtx.get('connection').rpc.handle).not.toHaveBeenCalled();
    } finally {
      await disabledFiber.dispose();
    }
  });

  it('reads and writes bookmarks through the RPC channel', async () => {
    const handler = rpcHandlers.get('/artifact-viewer')!;

    const readEmpty = await handler('bookmarks/read', { projectPath: tmpDir });
    expect(readEmpty).toEqual({ ok: true, value: [] });

    const bookmark = {
      id: 'file:/workspace/foo.ts:42',
      kind: 'file' as const,
      name: 'foo.ts',
      path: '/workspace/foo.ts',
      seq: 42,
      sessionId: 'session-1',
      createdAt: 1234567890,
    };
    const writeResult = await handler('bookmarks/write', { projectPath: tmpDir, bookmarks: [bookmark] });
    expect(writeResult).toEqual({ ok: true, value: null });

    const readResult = await handler('bookmarks/read', { projectPath: tmpDir });
    expect(readResult).toEqual({ ok: true, value: [bookmark] });
  });

  it('previews a small text file through the RPC channel', async () => {
    const handler = rpcHandlers.get('/artifact-viewer')!;
    const filePath = join(tmpDir, 'sample.json');
    await writeFile(filePath, '{"hello":"world"}');

    const result = await handler('file/preview', { projectPath: tmpDir, path: filePath });
    expect(result).toEqual({ ok: true, value: { content: '{"hello":"world"}' } });
  });

  it('previews an image file as base64 through the RPC channel', async () => {
    const handler = rpcHandlers.get('/artifact-viewer')!;
    const filePath = join(tmpDir, 'pixel.png');
    await writeFile(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const result = await handler('file/preview', { projectPath: tmpDir, path: filePath, encoding: 'base64' });
    expect(result).toMatchObject({
      ok: true,
      value: {
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64'),
        mediaType: 'image/png',
      },
    });
  });

  it('rejects unknown endpoints', async () => {
    const handler = rpcHandlers.get('/artifact-viewer')!;
    const result = await handler('unknown/endpoint', { projectPath: tmpDir });
    expect(result).toMatchObject({ ok: false, error: { code: 'bad-request' } });
  });
});
