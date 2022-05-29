import { Interface } from '@ethersproject/abi';
import ISelfPermit from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISelfPermit.sol/ISelfPermit.json';
import { toHex } from './utils';
function isAllowedPermit(permitOptions) {
    return 'nonce' in permitOptions;
}
export class SelfPermit {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static encodePermit(token, options) {
        return isAllowedPermit(options)
            ? SelfPermit.INTERFACE.encodeFunctionData('selfPermitAllowed', [
                token.address,
                toHex(options.nonce),
                toHex(options.expiry),
                options.v,
                options.r,
                options.s
            ])
            : SelfPermit.INTERFACE.encodeFunctionData('selfPermit', [
                token.address,
                toHex(options.amount),
                toHex(options.deadline),
                options.v,
                options.r,
                options.s
            ]);
    }
}
SelfPermit.INTERFACE = new Interface(ISelfPermit.abi);
//# sourceMappingURL=selfPermit.js.map