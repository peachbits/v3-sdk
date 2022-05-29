import { Interface } from '@ethersproject/abi';
import IMulticall from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IMulticall.sol/IMulticall.json';
export class Multicall {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static encodeMulticall(calldatas) {
        if (!Array.isArray(calldatas)) {
            calldatas = [calldatas];
        }
        return calldatas.length === 1 ? calldatas[0] : Multicall.INTERFACE.encodeFunctionData('multicall', [calldatas]);
    }
}
Multicall.INTERFACE = new Interface(IMulticall.abi);
//# sourceMappingURL=multicall.js.map