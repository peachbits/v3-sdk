import JSBI from 'jsbi';
/**
 * Converts a big int to a hex string
 * @param bigintIsh
 * @returns The hex encoded calldata
 */
export function toHex(bigintIsh) {
    const bigInt = JSBI.BigInt(bigintIsh);
    let hex = bigInt.toString(16);
    if (hex.length % 2 !== 0) {
        hex = `0${hex}`;
    }
    return `0x${hex}`;
}
//# sourceMappingURL=calldata.js.map