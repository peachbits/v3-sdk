import { validateAndParseAddress } from '@uniswap/sdk-core';
import { toHex } from './utils/calldata';
import { defaultAbiCoder, Interface } from '@ethersproject/abi';
import IUniswapV3Staker from '@uniswap/v3-staker/artifacts/contracts/UniswapV3Staker.sol/UniswapV3Staker.json';
import { Pool } from './entities';
import { Multicall } from './multicall';
export class Staker {
    constructor() { }
    /**
     *  To claim rewards, must unstake and then claim.
     * @param incentiveKey The unique identifier of a staking program.
     * @param options Options for producing the calldata to claim. Can't claim unless you unstake.
     * @returns The calldatas for 'unstakeToken' and 'claimReward'.
     */
    static encodeClaim(incentiveKey, options) {
        var _a;
        const calldatas = [];
        calldatas.push(Staker.INTERFACE.encodeFunctionData('unstakeToken', [
            this._encodeIncentiveKey(incentiveKey),
            toHex(options.tokenId)
        ]));
        const recipient = validateAndParseAddress(options.recipient);
        const amount = (_a = options.amount) !== null && _a !== void 0 ? _a : 0;
        calldatas.push(Staker.INTERFACE.encodeFunctionData('claimReward', [incentiveKey.rewardToken.address, recipient, toHex(amount)]));
        return calldatas;
    }
    /**
     *
     * Note:  A `tokenId` can be staked in many programs but to claim rewards and continue the program you must unstake, claim, and then restake.
     * @param incentiveKeys An IncentiveKey or array of IncentiveKeys that `tokenId` is staked in.
     * Input an array of IncentiveKeys to claim rewards for each program.
     * @param options ClaimOptions to specify tokenId, recipient, and amount wanting to collect.
     * Note that you can only specify one amount and one recipient across the various programs if you are collecting from multiple programs at once.
     * @returns
     */
    static collectRewards(incentiveKeys, options) {
        incentiveKeys = Array.isArray(incentiveKeys) ? incentiveKeys : [incentiveKeys];
        let calldatas = [];
        for (let i = 0; i < incentiveKeys.length; i++) {
            // the unique program tokenId is staked in
            const incentiveKey = incentiveKeys[i];
            // unstakes and claims for the unique program
            calldatas = calldatas.concat(this.encodeClaim(incentiveKey, options));
            // re-stakes the position for the unique program
            calldatas.push(Staker.INTERFACE.encodeFunctionData('stakeToken', [
                this._encodeIncentiveKey(incentiveKey),
                toHex(options.tokenId)
            ]));
        }
        return {
            calldata: Multicall.encodeMulticall(calldatas),
            value: toHex(0)
        };
    }
    /**
     *
     * @param incentiveKeys A list of incentiveKeys to unstake from. Should include all incentiveKeys (unique staking programs) that `options.tokenId` is staked in.
     * @param withdrawOptions Options for producing claim calldata and withdraw calldata. Can't withdraw without unstaking all programs for `tokenId`.
     * @returns Calldata for unstaking, claiming, and withdrawing.
     */
    static withdrawToken(incentiveKeys, withdrawOptions) {
        let calldatas = [];
        incentiveKeys = Array.isArray(incentiveKeys) ? incentiveKeys : [incentiveKeys];
        const claimOptions = {
            tokenId: withdrawOptions.tokenId,
            recipient: withdrawOptions.recipient,
            amount: withdrawOptions.amount
        };
        for (let i = 0; i < incentiveKeys.length; i++) {
            const incentiveKey = incentiveKeys[i];
            calldatas = calldatas.concat(this.encodeClaim(incentiveKey, claimOptions));
        }
        const owner = validateAndParseAddress(withdrawOptions.owner);
        calldatas.push(Staker.INTERFACE.encodeFunctionData('withdrawToken', [
            toHex(withdrawOptions.tokenId),
            owner,
            withdrawOptions.data ? withdrawOptions.data : toHex(0)
        ]));
        return {
            calldata: Multicall.encodeMulticall(calldatas),
            value: toHex(0)
        };
    }
    /**
     *
     * @param incentiveKeys A single IncentiveKey or array of IncentiveKeys to be encoded and used in the data parameter in `safeTransferFrom`
     * @returns An IncentiveKey as a string
     */
    static encodeDeposit(incentiveKeys) {
        incentiveKeys = Array.isArray(incentiveKeys) ? incentiveKeys : [incentiveKeys];
        let data;
        if (incentiveKeys.length > 1) {
            const keys = [];
            for (let i = 0; i < incentiveKeys.length; i++) {
                const incentiveKey = incentiveKeys[i];
                keys.push(this._encodeIncentiveKey(incentiveKey));
            }
            data = defaultAbiCoder.encode([`${Staker.INCENTIVE_KEY_ABI}[]`], [keys]);
        }
        else {
            data = defaultAbiCoder.encode([Staker.INCENTIVE_KEY_ABI], [this._encodeIncentiveKey(incentiveKeys[0])]);
        }
        return data;
    }
    /**
     *
     * @param incentiveKey An `IncentiveKey` which represents a unique staking program.
     * @returns An encoded IncentiveKey to be read by ethers
     */
    static _encodeIncentiveKey(incentiveKey) {
        const { token0, token1, fee } = incentiveKey.pool;
        const refundee = validateAndParseAddress(incentiveKey.refundee);
        return {
            rewardToken: incentiveKey.rewardToken.address,
            pool: Pool.getAddress(token0, token1, fee),
            startTime: toHex(incentiveKey.startTime),
            endTime: toHex(incentiveKey.endTime),
            refundee
        };
    }
}
Staker.INTERFACE = new Interface(IUniswapV3Staker.abi);
Staker.INCENTIVE_KEY_ABI = 'tuple(address rewardToken, address pool, uint256 startTime, uint256 endTime, address refundee)';
//# sourceMappingURL=staker.js.map