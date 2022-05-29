import { Interface } from '@ethersproject/abi';
import { TradeType } from '@uniswap/sdk-core';
import { encodeRouteToPath } from './utils';
import { toHex } from './utils/calldata';
import IQuoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import invariant from 'tiny-invariant';
/**
 * Represents the Uniswap V3 QuoterV1 contract with a method for returning the formatted
 * calldata needed to call the quoter contract.
 */
export class SwapQuoter {
    /**
     * Produces the on-chain method name of the appropriate function within QuoterV2,
     * and the relevant hex encoded parameters.
     * @template TInput The input token, either Ether or an ERC-20
     * @template TOutput The output token, either Ether or an ERC-20
     * @param route The swap route, a list of pools through which a swap can occur
     * @param amount The amount of the quote, either an amount in, or an amount out
     * @param tradeType The trade type, either exact input or exact output
     * @returns The formatted calldata
     */
    static quoteCallParameters(route, amount, tradeType, options = {}) {
        var _a, _b;
        const singleHop = route.pools.length === 1;
        const quoteAmount = toHex(amount.quotient);
        let calldata;
        if (singleHop) {
            if (tradeType === TradeType.EXACT_INPUT) {
                calldata = SwapQuoter.INTERFACE.encodeFunctionData(`quoteExactInputSingle`, [
                    route.tokenPath[0].address,
                    route.tokenPath[1].address,
                    route.pools[0].fee,
                    quoteAmount,
                    toHex((_a = options === null || options === void 0 ? void 0 : options.sqrtPriceLimitX96) !== null && _a !== void 0 ? _a : 0)
                ]);
            }
            else {
                calldata = SwapQuoter.INTERFACE.encodeFunctionData(`quoteExactOutputSingle`, [
                    route.tokenPath[0].address,
                    route.tokenPath[1].address,
                    route.pools[0].fee,
                    quoteAmount,
                    toHex((_b = options === null || options === void 0 ? void 0 : options.sqrtPriceLimitX96) !== null && _b !== void 0 ? _b : 0)
                ]);
            }
        }
        else {
            invariant((options === null || options === void 0 ? void 0 : options.sqrtPriceLimitX96) === undefined, 'MULTIHOP_PRICE_LIMIT');
            const path = encodeRouteToPath(route, tradeType === TradeType.EXACT_OUTPUT);
            if (tradeType === TradeType.EXACT_INPUT) {
                calldata = SwapQuoter.INTERFACE.encodeFunctionData('quoteExactInput', [path, quoteAmount]);
            }
            else {
                calldata = SwapQuoter.INTERFACE.encodeFunctionData('quoteExactOutput', [path, quoteAmount]);
            }
        }
        return {
            calldata,
            value: toHex(0)
        };
    }
}
SwapQuoter.INTERFACE = new Interface(IQuoter.abi);
//# sourceMappingURL=quoter.js.map