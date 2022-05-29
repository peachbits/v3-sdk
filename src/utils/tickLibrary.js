import JSBI from 'jsbi';
import { ZERO } from '../internalConstants';
const Q256 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(256));
export function subIn256(x, y) {
    const difference = JSBI.subtract(x, y);
    if (JSBI.lessThan(difference, ZERO)) {
        return JSBI.add(Q256, difference);
    }
    else {
        return difference;
    }
}
export class TickLibrary {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static getFeeGrowthInside(feeGrowthOutsideLower, feeGrowthOutsideUpper, tickLower, tickUpper, tickCurrent, feeGrowthGlobal0X128, feeGrowthGlobal1X128) {
        let feeGrowthBelow0X128;
        let feeGrowthBelow1X128;
        if (tickCurrent >= tickLower) {
            feeGrowthBelow0X128 = feeGrowthOutsideLower.feeGrowthOutside0X128;
            feeGrowthBelow1X128 = feeGrowthOutsideLower.feeGrowthOutside1X128;
        }
        else {
            feeGrowthBelow0X128 = subIn256(feeGrowthGlobal0X128, feeGrowthOutsideLower.feeGrowthOutside0X128);
            feeGrowthBelow1X128 = subIn256(feeGrowthGlobal1X128, feeGrowthOutsideLower.feeGrowthOutside1X128);
        }
        let feeGrowthAbove0X128;
        let feeGrowthAbove1X128;
        if (tickCurrent < tickUpper) {
            feeGrowthAbove0X128 = feeGrowthOutsideUpper.feeGrowthOutside0X128;
            feeGrowthAbove1X128 = feeGrowthOutsideUpper.feeGrowthOutside1X128;
        }
        else {
            feeGrowthAbove0X128 = subIn256(feeGrowthGlobal0X128, feeGrowthOutsideUpper.feeGrowthOutside0X128);
            feeGrowthAbove1X128 = subIn256(feeGrowthGlobal1X128, feeGrowthOutsideUpper.feeGrowthOutside1X128);
        }
        return [
            subIn256(subIn256(feeGrowthGlobal0X128, feeGrowthBelow0X128), feeGrowthAbove0X128),
            subIn256(subIn256(feeGrowthGlobal1X128, feeGrowthBelow1X128), feeGrowthAbove1X128)
        ];
    }
}
//# sourceMappingURL=tickLibrary.js.map