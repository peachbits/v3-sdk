import { Interface } from '@ethersproject/abi';
import IPeripheryPaymentsWithFee from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IPeripheryPaymentsWithFee.sol/IPeripheryPaymentsWithFee.json';
import { validateAndParseAddress } from '@uniswap/sdk-core';
import { toHex } from './utils/calldata';
export class Payments {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static encodeFeeBips(fee) {
        return toHex(fee.multiply(10000).quotient);
    }
    static encodeUnwrapWETH9(amountMinimum, recipient, feeOptions) {
        recipient = validateAndParseAddress(recipient);
        if (!!feeOptions) {
            const feeBips = this.encodeFeeBips(feeOptions.fee);
            const feeRecipient = validateAndParseAddress(feeOptions.recipient);
            return Payments.INTERFACE.encodeFunctionData('unwrapWETH9WithFee', [
                toHex(amountMinimum),
                recipient,
                feeBips,
                feeRecipient
            ]);
        }
        else {
            return Payments.INTERFACE.encodeFunctionData('unwrapWETH9', [toHex(amountMinimum), recipient]);
        }
    }
    static encodeSweepToken(token, amountMinimum, recipient, feeOptions) {
        recipient = validateAndParseAddress(recipient);
        if (!!feeOptions) {
            const feeBips = this.encodeFeeBips(feeOptions.fee);
            const feeRecipient = validateAndParseAddress(feeOptions.recipient);
            return Payments.INTERFACE.encodeFunctionData('sweepTokenWithFee', [
                token.address,
                toHex(amountMinimum),
                recipient,
                feeBips,
                feeRecipient
            ]);
        }
        else {
            return Payments.INTERFACE.encodeFunctionData('sweepToken', [token.address, toHex(amountMinimum), recipient]);
        }
    }
    static encodeRefundETH() {
        return Payments.INTERFACE.encodeFunctionData('refundETH');
    }
}
Payments.INTERFACE = new Interface(IPeripheryPaymentsWithFee.abi);
//# sourceMappingURL=payments.js.map