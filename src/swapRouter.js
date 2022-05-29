import { Interface } from '@ethersproject/abi';
import { CurrencyAmount, TradeType, validateAndParseAddress } from '@uniswap/sdk-core';
import invariant from 'tiny-invariant';
import { ADDRESS_ZERO } from './constants';
import { SelfPermit } from './selfPermit';
import { encodeRouteToPath } from './utils';
import { toHex } from './utils/calldata';
import ISwapRouter from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';
import { Multicall } from './multicall';
import { Payments } from './payments';
/**
 * Represents the Uniswap V3 SwapRouter, and has static methods for helping execute trades.
 */
export class SwapRouter {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    /**
     * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
     * @param trade to produce call parameters for
     * @param options options for the call parameters
     */
    static swapCallParameters(trades, options) {
        var _a, _b;
        if (!Array.isArray(trades)) {
            trades = [trades];
        }
        const sampleTrade = trades[0];
        const tokenIn = sampleTrade.inputAmount.currency.wrapped;
        const tokenOut = sampleTrade.outputAmount.currency.wrapped;
        // All trades should have the same starting and ending token.
        invariant(trades.every(trade => trade.inputAmount.currency.wrapped.equals(tokenIn)), 'TOKEN_IN_DIFF');
        invariant(trades.every(trade => trade.outputAmount.currency.wrapped.equals(tokenOut)), 'TOKEN_OUT_DIFF');
        const calldatas = [];
        const ZERO_IN = CurrencyAmount.fromRawAmount(trades[0].inputAmount.currency, 0);
        const ZERO_OUT = CurrencyAmount.fromRawAmount(trades[0].outputAmount.currency, 0);
        const totalAmountOut = trades.reduce((sum, trade) => sum.add(trade.minimumAmountOut(options.slippageTolerance)), ZERO_OUT);
        // flag for whether a refund needs to happen
        const mustRefund = sampleTrade.inputAmount.currency.isNative && sampleTrade.tradeType === TradeType.EXACT_OUTPUT;
        const inputIsNative = sampleTrade.inputAmount.currency.isNative;
        // flags for whether funds should be send first to the router
        const outputIsNative = sampleTrade.outputAmount.currency.isNative;
        const routerMustCustody = outputIsNative || !!options.fee;
        const totalValue = inputIsNative
            ? trades.reduce((sum, trade) => sum.add(trade.maximumAmountIn(options.slippageTolerance)), ZERO_IN)
            : ZERO_IN;
        // encode permit if necessary
        if (options.inputTokenPermit) {
            invariant(sampleTrade.inputAmount.currency.isToken, 'NON_TOKEN_PERMIT');
            calldatas.push(SelfPermit.encodePermit(sampleTrade.inputAmount.currency, options.inputTokenPermit));
        }
        const recipient = validateAndParseAddress(options.recipient);
        const deadline = toHex(options.deadline);
        for (const trade of trades) {
            for (const { route, inputAmount, outputAmount } of trade.swaps) {
                const amountIn = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient);
                const amountOut = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient);
                // flag for whether the trade is single hop or not
                const singleHop = route.pools.length === 1;
                if (singleHop) {
                    if (trade.tradeType === TradeType.EXACT_INPUT) {
                        const exactInputSingleParams = {
                            tokenIn: route.tokenPath[0].address,
                            tokenOut: route.tokenPath[1].address,
                            fee: route.pools[0].fee,
                            recipient: routerMustCustody ? ADDRESS_ZERO : recipient,
                            deadline,
                            amountIn,
                            amountOutMinimum: amountOut,
                            sqrtPriceLimitX96: toHex((_a = options.sqrtPriceLimitX96) !== null && _a !== void 0 ? _a : 0)
                        };
                        calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactInputSingle', [exactInputSingleParams]));
                    }
                    else {
                        const exactOutputSingleParams = {
                            tokenIn: route.tokenPath[0].address,
                            tokenOut: route.tokenPath[1].address,
                            fee: route.pools[0].fee,
                            recipient: routerMustCustody ? ADDRESS_ZERO : recipient,
                            deadline,
                            amountOut,
                            amountInMaximum: amountIn,
                            sqrtPriceLimitX96: toHex((_b = options.sqrtPriceLimitX96) !== null && _b !== void 0 ? _b : 0)
                        };
                        calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactOutputSingle', [exactOutputSingleParams]));
                    }
                }
                else {
                    invariant(options.sqrtPriceLimitX96 === undefined, 'MULTIHOP_PRICE_LIMIT');
                    const path = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT);
                    if (trade.tradeType === TradeType.EXACT_INPUT) {
                        const exactInputParams = {
                            path,
                            recipient: routerMustCustody ? ADDRESS_ZERO : recipient,
                            deadline,
                            amountIn,
                            amountOutMinimum: amountOut
                        };
                        calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactInput', [exactInputParams]));
                    }
                    else {
                        const exactOutputParams = {
                            path,
                            recipient: routerMustCustody ? ADDRESS_ZERO : recipient,
                            deadline,
                            amountOut,
                            amountInMaximum: amountIn
                        };
                        calldatas.push(SwapRouter.INTERFACE.encodeFunctionData('exactOutput', [exactOutputParams]));
                    }
                }
            }
        }
        // unwrap
        if (routerMustCustody) {
            if (!!options.fee) {
                if (outputIsNative) {
                    calldatas.push(Payments.encodeUnwrapWETH9(totalAmountOut.quotient, recipient, options.fee));
                }
                else {
                    calldatas.push(Payments.encodeSweepToken(sampleTrade.outputAmount.currency.wrapped, totalAmountOut.quotient, recipient, options.fee));
                }
            }
            else {
                calldatas.push(Payments.encodeUnwrapWETH9(totalAmountOut.quotient, recipient));
            }
        }
        // refund
        if (mustRefund) {
            calldatas.push(Payments.encodeRefundETH());
        }
        return {
            calldata: Multicall.encodeMulticall(calldatas),
            value: toHex(totalValue.quotient)
        };
    }
}
SwapRouter.INTERFACE = new Interface(ISwapRouter.abi);
//# sourceMappingURL=swapRouter.js.map