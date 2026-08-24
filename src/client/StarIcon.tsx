/** 16×16 five-point star bookmark icon matching the harness glyph size. */

import type { SVGProps } from 'react';

interface StarIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number;
  filled?: boolean;
}

const STAR_PATH = 'M8 1L9.76 5.57L14.66 5.84L10.85 8.93L12.11 13.66L8 11L3.89 13.66L5.15 8.93L1.34 5.84L6.24 5.57L8 1Z';

export function StarIcon({ size = 16, filled = false, ...rest }: StarIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <path
        d={STAR_PATH}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
