// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArtifactPanel, type ArtifactPanelProps } from '../src/client/ArtifactPanel.tsx';
import { zh } from '../src/client/locales.ts';

const t = (key: keyof typeof zh) => zh[key];

afterEach(cleanup);

interface Snapshot {
  sessionId: string;
  nodes: unknown[];
}

/** Minimal conversation snapshot with one produced-file tool result. */
function snapshot(sessionId: string, path: string): Snapshot {
  return {
    sessionId,
    nodes: [
      {
        kind: 'tool-result',
        seq: 1,
        isError: false,
        resultView: { card: 'diff', locations: [{ path }] },
        callView: null,
        content: [],
      },
    ],
  };
}

function makeProps(current: Snapshot): ArtifactPanelProps {
  const storeState = {
    panelOpen: true,
    activeTab: 'current' as const,
    expanded: false,
    width: 420,
    pendingOpenPath: undefined,
  };
  return {
    useStore: ((selector: (state: typeof storeState) => unknown) => selector(storeState)) as never,
    actions: {
      togglePanel: vi.fn(),
      openPanel: vi.fn(),
      closePanel: vi.fn(),
      setTab: vi.fn(),
      toggleExpand: vi.fn(),
      setWidth: vi.fn(),
      openArtifactByPath: vi.fn(),
      clearPendingOpenPath: vi.fn(),
    } as never,
    useCurrentSession: ((selector: (snap: unknown) => unknown) => selector(current)) as never,
    useBookmarks: ((selector: (state: unknown) => unknown) => selector({ bookmarks: [] })) as never,
    bookmarks: { load: vi.fn(), toggle: vi.fn() } as never,
    rpc: { call: vi.fn().mockResolvedValue({ ok: true, value: { content: 'hello' } }) } as never,
    onOpenPath: vi.fn(),
    onOpenSession: vi.fn(),
    useSessions: ((selector: (state: unknown) => unknown) => selector({ current: undefined, byId: {} })) as never,
    t: t as never,
  };
}

describe('ArtifactPanel', () => {
  it('closes open preview tabs when the session changes', () => {
    const { rerender } = render(<ArtifactPanel {...makeProps(snapshot('session-1', '/tmp/a.ts'))} />);

    // Open the artifact document from the current session.
    fireEvent.click(screen.getByText('a.ts'));
    expect(screen.getByRole('button', { name: /a\.ts/ })).not.toBeNull();

    // Switch to another session: the opened document no longer belongs to it.
    rerender(<ArtifactPanel {...makeProps(snapshot('session-2', '/tmp/b.ts'))} />);

    expect(screen.queryByText('a.ts')).toBeNull();
    expect(screen.getByText('b.ts')).not.toBeNull();
  });

  it('keeps preview tabs while the session stays the same', () => {
    const { rerender } = render(<ArtifactPanel {...makeProps(snapshot('session-1', '/tmp/a.ts'))} />);

    fireEvent.click(screen.getByText('a.ts'));
    expect(screen.getByRole('button', { name: /a\.ts/ })).not.toBeNull();

    // A new snapshot of the same session must not close the tabs.
    rerender(<ArtifactPanel {...makeProps(snapshot('session-1', '/tmp/a.ts'))} />);

    expect(screen.getByRole('button', { name: /a\.ts/ })).not.toBeNull();
  });
});
