import { describe, expect, it } from 'vitest';
import { basename, dirname } from '../src/client/artifacts.js';

describe('basename', () => {
  it('extracts the file name from POSIX and Windows paths', () => {
    expect(basename('/tmp/a/b.ts')).toBe('b.ts');
    expect(basename('C:\\work\\b.ts')).toBe('b.ts');
    expect(basename('b.ts')).toBe('b.ts');
  });
});

describe('dirname', () => {
  it('extracts the parent directory from POSIX and Windows paths', () => {
    expect(dirname('/tmp/a/b.ts')).toBe('/tmp/a');
    expect(dirname('C:\\work\\b.ts')).toBe('C:\\work');
  });

  it('keeps the root for top-level files', () => {
    expect(dirname('/b.ts')).toBe('/');
  });

  it('returns the input when there is no separator', () => {
    expect(dirname('b.ts')).toBe('b.ts');
  });
});
