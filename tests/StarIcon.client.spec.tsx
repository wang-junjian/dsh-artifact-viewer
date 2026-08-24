// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StarIcon } from '../src/client/StarIcon.tsx';

afterEach(cleanup);

describe('StarIcon', () => {
  it('renders an outlined star by default', () => {
    const view = render(<StarIcon />);
    const path = view.container.querySelector('path')!;
    expect(path.getAttribute('fill')).toBe('none');
  });

  it('fills the star when filled is true', () => {
    const view = render(<StarIcon filled />);
    const path = view.container.querySelector('path')!;
    expect(path.getAttribute('fill')).toBe('currentColor');
  });
});
