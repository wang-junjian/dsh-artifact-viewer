// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArtifactList } from '../src/client/ArtifactList.tsx';
import { zh } from '../src/client/locales.ts';

const t = (key: keyof typeof zh) => zh[key];

afterEach(cleanup);

function item(over: Partial<Parameters<typeof ArtifactList>[0]['items'][number]> = {}) {
  return {
    id: 'file:/tmp/foo.ts:1',
    kind: 'file' as const,
    name: 'foo.ts',
    seq: 1,
    sessionId: 'session-1',
    ...over,
  };
}

describe('ArtifactList', () => {
  it('renders items and calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(
      <ArtifactList items={[item()]} bookmarkIds={new Set()} onSelect={onSelect} onToggleBookmark={vi.fn()} t={t} />,
    );
    expect(screen.getByText('foo.ts')).not.toBeNull();
    fireEvent.click(screen.getByText('foo.ts'));
    expect(onSelect).toHaveBeenCalledWith('file:/tmp/foo.ts:1');
  });

  it('toggles bookmark and stops propagation in the bookmarks tab', () => {
    const onToggleBookmark = vi.fn();
    render(
      <ArtifactList
        items={[item()]}
        bookmarkIds={new Set()}
        showSessionLink
        onSelect={vi.fn()}
        onToggleBookmark={onToggleBookmark}
        onOpenSession={vi.fn()}
        t={t}
      />,
    );
    fireEvent.click(screen.getByLabelText(t('artifact.bookmark')));
    expect(onToggleBookmark).toHaveBeenCalledTimes(1);
  });

  it('shows no bookmark button in the current-session list, only an indicator for bookmarked items', () => {
    render(
      <ArtifactList
        items={[item(), item({ id: 'file:/tmp/bar.ts:2', name: 'bar.ts' })]}
        bookmarkIds={new Set(['file:/tmp/bar.ts:2'])}
        onSelect={vi.fn()}
        onToggleBookmark={vi.fn()}
        t={t}
      />,
    );
    expect(screen.queryByLabelText(t('artifact.bookmark'))).toBeNull();
    expect(screen.queryByLabelText(t('artifact.bookmarked'))).toBeNull();
    expect(screen.getByTitle(t('artifact.bookmarked'))).not.toBeNull();
  });

  it('shows session link in bookmarks tab and navigates on click', () => {
    const onOpenSession = vi.fn();
    render(
      <ArtifactList
        items={[item()]}
        bookmarkIds={new Set()}
        showSessionLink
        onSelect={vi.fn()}
        onToggleBookmark={vi.fn()}
        onOpenSession={onOpenSession}
        t={t}
      />,
    );
    const button = screen.getByLabelText(t('artifact.session'));
    expect(button).not.toBeNull();
    fireEvent.click(button);
    expect(onOpenSession).toHaveBeenCalledWith('session-1');
  });

  it('hides session link when sessionId is missing', () => {
    render(
      <ArtifactList
        items={[item({ sessionId: undefined })]}
        bookmarkIds={new Set()}
        showSessionLink
        onSelect={vi.fn()}
        onToggleBookmark={vi.fn()}
        onOpenSession={vi.fn()}
        t={t}
      />,
    );
    expect(screen.queryByLabelText(t('artifact.session'))).toBeNull();
  });
});
