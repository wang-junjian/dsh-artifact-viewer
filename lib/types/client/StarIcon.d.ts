/** 16×16 five-point star bookmark icon matching the harness glyph size. */
import type { SVGProps } from 'react';
interface StarIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    size?: number;
    filled?: boolean;
}
export declare function StarIcon({ size, filled, ...rest }: StarIconProps): React.ReactElement;
export {};
//# sourceMappingURL=StarIcon.d.ts.map