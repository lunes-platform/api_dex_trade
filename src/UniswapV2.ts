import type { WeightV2 } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types';
import Router from '../types/contracts/router_contract';
import Token from '../types/contracts/psp22_token';
import Pair from '../types/contracts/pair_contract';
import Factory from '../types/contracts/factory_contract';
import { ContractPromise } from '@polkadot/api-contract'
import ABI_router from '../artifacts/router_contract.json'
import ABI_pair from '../artifacts/pair_contract.json'
import Assets from '../token_testnet.json';
require('dotenv').config()
const CONTRACT_ROUTE = process.env.CONTRACT_ROUTE || '0x0000000000000000000000000000000000000000';
const CONTRACT_FACTORY = process.env.CONTRACT_FACTORY || '0x0000000000000000000000000000000000000000';
const deadline = '9999999999999999999';
let gasRequired: WeightV2;
const getGasLimit = (api: any) =>
    api.registry.createType(
        'WeightV2',
        api.consts.system.blockWeights['maxBlock']
    )
/**
 * Add liquidity to a given pair, using native tokens.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to add liquidity to.
 * @param amount0 Amount of token0 to add.
 * @param amount0_min Minimum amount of token0 to add.
 * @param amount1 Amount of token1 to add.
 * @param amount1_min Minimum amount of token1 to add.
 */
export const addLiquidityNative = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    amount0: number,
    amount0_min: number,
    amount1: number = 0,
    amount1_min: number = 0) => {

    const asset = Assets.find((asset) => asset.symbol === token0);
    if (!asset) {
        throw new Error(`Unsupported token ${token0}`);
    }
    const router = new Router(CONTRACT_ROUTE, signer, api);
    const token = new Token(asset.address, signer, api);
    ({ gasRequired } = await token.query.approve(router.address, amount0));
    await token.tx.approve(router.address, amount0, {
        gasLimit: gasRequired,
    });

    ({ gasRequired } = await router.query.addLiquidityNative
        (asset.address,
            amount0,
            amount0_min,
            amount1_min,
            signer.address,
            deadline,
            {
                value: amount1,
            },
        ));

    await router.tx.addLiquidityNative
        (asset.address,
            amount0,
            amount0_min,
            amount1_min,
            signer.address,
            deadline,
            {
                value: amount1,
                gasLimit: gasRequired,
            },
        );
}
/**
 * Add liquidity to a given pair, using assets.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to add liquidity to.
 * @param token1 Symbol of token to add liquidity to.
 * @param amount0 Amount of token0 to add.
 * @param amount0_min Minimum amount of token0 to add.
 * @param amount1 Amount of token1 to add.
 * @param amount1_min Minimum amount of token1 to add.
 */
export const addLiquidityAsset = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string,
    amount0: number,
    amount0_min: number = 0,
    amount1: number,
    amount1_min: number = 0
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    if (!asset_0 || asset_0.isNative) {
        throw new Error(`Unsupported token ${token0}`);
    }
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_1 || asset_1.isNative) {
        throw new Error(`Unsupported token ${token1}`);
    }
    const router = new Router(CONTRACT_ROUTE, signer, api);
    const token_0 = new Token(asset_0.address, signer, api);
    const token_1 = new Token(asset_1.address, signer, api);

    ({ gasRequired } = await token_0.query.approve(router.address, amount0));
    await token_0.tx.approve(router.address, amount0, {
        gasLimit: gasRequired,
    });
    ({ gasRequired } = await token_1.query.approve(router.address, amount1));
    await token_1.tx.approve(router.address, amount1, {
        gasLimit: gasRequired,
    });
    ({ gasRequired } = await router.query.addLiquidity(
        asset_0.address,
        asset_1.address,
        amount0,
        amount1,
        amount0_min,
        amount1_min,
        signer.address,
        deadline
    ));

    await router.tx.addLiquidity(
        asset_0.address,
        asset_1.address,
        amount0,
        amount1,
        amount0_min,
        amount1_min,
        signer.address,
        deadline,
        {
            gasLimit: gasRequired
        }
    );
}
/**
 * Swaps quantity exact of native tokens for a given token.
 * @param api Api promise
 * @param signer Keyring pair
 * @param token Symbol of token to swap for.
 * @param amount_token Amount of token to swap.
 * @param amount_swap Amount of native token to swap.
 */
export const swapExactNativeForToken = async (
    api: ApiPromise,
    signer: KeyringPair,
    token: string,
    amount_token: number,
    amount_swap: number
) => {
    const asset = Assets.find((asset) => asset.symbol === token);
    if (!asset || asset.isNative) {
        throw new Error(`Unsupported token ${token}`);
    }
    const native_token = Assets.find((asset) => asset.isNative);
    if (!native_token) {
        throw new Error(`Unsupported token Native`);
    }
    const contract = new ContractPromise(api, ABI_router, CONTRACT_ROUTE);

    const { gasRequired, result } = await contract.query['router::swapExactNativeForTokens'](
        signer.address,
        {
            gasLimit: getGasLimit(api),
            value: amount_swap
        },
        amount_token,
        [native_token.address, asset.address],
        signer.address,
        deadline,
    );
    if (result.isOk) {
        const flags = result.asOk.flags.toHuman()
        if (flags.includes('Revert')) {
            throw new Error('Revert');
        }
    }
    await new Promise<string>((resolve, reject) => {
        contract.tx['router::swapExactNativeForTokens']({
            gasLimit: gasRequired,
            value: amount_swap
        },
            amount_token,
            [native_token.address, asset.address],
            signer.address,
            deadline,
        ).signAndSend(signer, async (result) => {
            if (result.status.isInBlock) {
                console.log(`Completed at blockHash ${result.status.asInBlock}`);
            }
            if (result.status.isFinalized) {
                console.log(`Finalized at blockHash ${result.status.asFinalized}`);
                resolve(result.status.asFinalized.toString());
            }
            if (result.isError) {
                console.log(`Error at blockHash ${result.isError}`);
                reject("Error at blockHash");
            }
        }).catch(reject);
    });
}
/**
 * Swaps  native tokens for a given quantity exact of token.
 * @param api Api promise
 * @param signer Keyring pair
 * @param token Symbol of token to swap for.
 * @param amount_token Amount of token to swap.
 * @param amount_swap Amount of native token to swap.
 */
export const swapNativeForExactToken = async (
    api: ApiPromise,
    signer: KeyringPair,
    token: string,
    amount_token: number,
    amount_swap: number
) => {
    const asset = Assets.find((asset) => asset.symbol === token);
    if (!asset || asset.isNative) {
        throw new Error(`Unsupported token ${token}`);
    }
    const native_token = Assets.find((asset) => asset.isNative);
    if (!native_token) {
        throw new Error(`Unsupported token Native`);
    }
    const contract = new ContractPromise(api, ABI_router, CONTRACT_ROUTE);

    const { gasRequired, result } = await contract.query['router::swapNativeForExactTokens'](
        signer.address,
        {
            gasLimit: getGasLimit(api),
            value: amount_swap
        },
        amount_token,
        [native_token.address, asset.address],
        signer.address,
        deadline,
    );
    if (result.isOk) {
        const flags = result.asOk.flags.toHuman()
        if (flags.includes('Revert')) {
            throw new Error('Revert');
        }
    }

    await new Promise<string>((resolve, reject) => {
        contract.tx['router::swapNativeForExactTokens']({
            gasLimit: gasRequired,
            value: amount_swap
        },
            amount_token,
            [native_token.address, asset.address],
            signer.address,
            deadline,
        ).signAndSend(signer, async (result) => {
            if (result.status.isInBlock) {
                console.log(`Completed at blockHash ${result.status.asInBlock}`);
            }
            if (result.status.isFinalized) {
                console.log(`Finalized at blockHash ${result.status.asFinalized}`);
                resolve(result.status.asFinalized.toString());
            }
            if (result.isError) {
                console.log(`Error at blockHash ${result.isError}`);
                reject("Error at blockHash");
            }
        }).catch(reject);
    });

}
/**
 * Swaps exact tokens for tokens.
 * @param api Api promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to swap.
 * @param token1 Symbol of token to swap for.
 * @param amount_token Amount of token to swap.
 * @param amount_swap Amount of token to swap for.
 */
export const swapExactTokenForToken = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string,
    amount_token: number,
    amount_swap: number
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1 || asset_0.isNative || asset_1.isNative) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const contract = new ContractPromise(api, ABI_router, CONTRACT_ROUTE);
    const { gasRequired, result, output } = await contract.query['router::swapExactTokensForTokens'](
        signer.address,
        {
            gasLimit: getGasLimit(api),
            value: amount_swap
        },
        amount_token,
        amount_swap,
        [asset_0.address, asset_1.address],
        signer.address,
        deadline
    );
    if (result.isOk) {
        const flags = result.asOk.flags.toHuman()
        if (flags.includes('Revert')) {
            throw new Error(output?.toHuman()?.toString() || 'Revert');
        }
    }

    await new Promise<string>((resolve, reject) => {
        contract.tx['router::swapExactTokensForTokens']({
            gasLimit: gasRequired
        },
            amount_token,
            amount_swap,
            [asset_0.address, asset_1.address],
            signer.address,
            deadline
        ).signAndSend(signer, async (result) => {
            if (result.status.isInBlock) {
                console.log(`Completed at blockHash ${result.status.asInBlock}`);
            }
            if (result.status.isFinalized) {
                console.log(`Finalized at blockHash ${result.status.asFinalized}`);
                resolve(result.status.asFinalized.toString());
            }
            if (result.isError) {
                console.log(`Error at blockHash ${result.isError}`);
                reject("Error at blockHash");
            }
        }).catch(reject);
    });

}

/**
 * Swaps tokens for a given quantity exact of token.
 * @param api Api promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to swap.
 * @param token1 Symbol of token to swap for.
 * @param amount_token Amount of token to swap.
 * @param amount_swap Amount of token to swap for.
 */
export const swapTokensForExactTokens = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string,
    amount_token: number,
    amount_swap: number
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1 || asset_0.isNative || asset_1.isNative) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const contract = new ContractPromise(api, ABI_router, CONTRACT_ROUTE);

    const { gasRequired, result, output } = await contract.query['router::swapTokensForExactTokens'](
        signer.address,
        {
            gasLimit: getGasLimit(api),
            storageDepositLimit: null,
        },
        amount_token,
        amount_swap,
        [asset_0.address, asset_1.address],
        signer.address,
        deadline
    );
    if (result.isOk) {
        const flags = result.asOk.flags.toHuman()
        if (flags.includes('Revert')) {
            throw new Error(output?.toHuman()?.toString() || 'Revert');
        }
    }
    await new Promise<string>((resolve, reject) => {
        contract.tx['router::swapTokensForExactTokens']({
            gasLimit: gasRequired,
            storageDepositLimit: null,
        },
            amount_token,
            amount_swap,
            [asset_0.address, asset_1.address],
            signer.address,
            deadline
        ).signAndSend(signer, async (result) => {
            if (result.status.isInBlock) {
                console.log(`Completed at blockHash ${result.status.asInBlock}`);
            }
            if (result.status.isFinalized) {
                console.log(`Finalized at blockHash ${result.status.asFinalized}`);
                resolve(result.status.asFinalized.toString());
            }
            if (result.isError) {
                console.log(`Error at blockHash ${result.isError}`);
                reject("Error at blockHash");
            }
        }).catch(reject);
    });
}
/**
 * Removes liquidity from a given pair, using native tokens.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to remove liquidity from.
 * @param liquidity Amount of liquidity to remove.
 * @param amountNative Amount of native token to receive.
 * @param amountToken Amount of token to receive.
 */
export const removeLiquidityNative = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    liquidity: number,
    amountNative: number = 0,
    amountToken: number = 0
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const native = Assets.find((asset) => asset.isNative);
    if (!asset_0 || !native || asset_0.isNative) {
        throw new Error(`Unsupported token ${token0}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api);
    const lp = await factory.query.getPair(native.address, asset_0.address);

    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }
    await lpToken.tx.approve(CONTRACT_ROUTE, liquidity, {
        gasLimit: gasRequired,
    });
    const contract = new ContractPromise(api, ABI_router, CONTRACT_ROUTE);
    let result: any;
    let output: any;
    ({ gasRequired, result, output } = await contract.query['router::removeLiquidityNative'](
        signer.address,
        {
            gasLimit: getGasLimit(api),
            storageDepositLimit: null
        },
        asset_0.address,
        liquidity,
        amountToken,
        amountNative,
        signer.address,
        deadline
    ));
    if (result.isOk) {
        const flags = result.asOk.flags.toHuman()
        if (flags.includes('Revert')) {
            console.log(output?.toHuman())
            throw new Error(output?.toHuman()?.toString() || 'Revert');
        }
    }
    console.log('out', output?.toHuman())
    await new Promise<string>((resolve, reject) => {
        contract.tx['router::removeLiquidityNative']({
            gasLimit: gasRequired,
        },
            asset_0.address,
            liquidity,
            amountToken,
            amountNative,
            signer.address,
            deadline
        ).signAndSend(signer, async (result) => {
            if (result.status.isInBlock) {
                console.log(`Completed at blockHash ${result.status.asInBlock}`);
            }
            if (result.status.isFinalized) {
                console.log(`Finalized at blockHash ${result.status.asFinalized}`);
                resolve(result.status.asFinalized.toString());
            }
            if (result.isError) {
                console.log(`Error at blockHash ${result.isError}`);
                reject("Error at blockHash");
            }
        }).catch(reject);
    });


}
/**
 * Removes liquidity from a given pair, using tokens.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to remove liquidity from.
 * @param token1 Symbol of token to remove liquidity from.
 * @param liquidity Amount of liquidity to remove.
 * @param amountToken0 Amount of token0 to remove.
 * @param amountToken1 Amount of token1 to remove.
 */
export const removeLiquidityToken = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string,
    liquidity: number,
    amountToken0: number = 0,
    amountToken1: number = 0
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1 || asset_0.isNative || asset_1.isNative) {
        throw new Error(`Unsupported token ${token0}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api);
    const lp = await factory.query.getPair(asset_0.address, asset_1.address);

    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }
    await lpToken.tx.approve(CONTRACT_ROUTE, liquidity, {
        gasLimit: gasRequired,
    });
    const contract = new ContractPromise(api, ABI_router, CONTRACT_ROUTE);
    let result: any;
    let output: any;
    ({ gasRequired, result, output } = await contract.query['router::removeLiquidity'](
        signer.address,
        {
            gasLimit: getGasLimit(api),
            storageDepositLimit: null
        },
        asset_0.address,
        asset_1.address,
        liquidity,
        amountToken0,
        amountToken1,
        signer.address,
        deadline
    ));
    if (result.isOk) {
        const flags = result.asOk.flags.toHuman()
        if (flags.includes('Revert')) {
            console.log(output?.toHuman())
            throw new Error(output?.toHuman()?.toString() || 'Revert');
        }
    }

    await new Promise<string>((resolve, reject) => {
        contract.tx['router::removeLiquidity']({
            gasLimit: gasRequired,
        },
            asset_0.address,
            asset_1.address,
            liquidity,
            amountToken0,
            amountToken1,
            signer.address,
            deadline
        ).signAndSend(signer, async (result) => {
            if (result.status.isInBlock) {
                console.log(`Completed at blockHash ${result.status.asInBlock}`);
            }
            if (result.status.isFinalized) {
                console.log(`Finalized at blockHash ${result.status.asFinalized}`);
                resolve(result.status.asFinalized.toString());
            }
            if (result.isError) {
                console.log(`Error at blockHash ${result.isError}`);
                reject("Error at blockHash");
            }
        }).catch(reject);
    });

}

/**
 * Returns the reserves of a given pair, using the LP token.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to get reserves of.
 * @param token1 Symbol of token to get reserves of.
 * @returns An object with the reserves of token0, token1 and supply.
 */
export const reservesLPToken = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api)
    const lp = await factory.query.getPair(asset_0.address, asset_1.address);

    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }
    const supply = await lpToken.query.totalSupply()
    const reserves = await lpToken.query.getReserves()
    return {
        amount1: reserves.value?.ok?.[0].toNumber() || 0,
        amount2: reserves.value?.ok?.[1].toNumber() || 0,
        supply: supply.value?.ok?.toNumber() || 0
    }
}
/**
 * Returns the price of a given pair, using the LP token.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to get price of.
 * @param token1 Symbol of token to get price of.
 * @param amount_swap Amount of token0 to swap.
 * @returns An object with the price and amount of token1.
 */
export const priceTokenOut = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string,
    amount_swap: number
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const router = new Router(CONTRACT_ROUTE, signer, api);
    const prices = await router.query.getAmountsOut(amount_swap, [asset_0.address, asset_1.address]);
    return {
        amount0: Number(prices.value.ok?.ok?.[0]) || 0,
        amount1: Number(prices.value.ok?.ok?.[1]) || 0
    }
}
export const priceTokenInt = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string,
    amount_swap: number
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const router = new Router(CONTRACT_ROUTE, signer, api);
    const prices = await router.query.getAmountsIn(amount_swap, [asset_0.address, asset_1.address]);
    return {
        amount0: Number(prices.value.ok?.ok?.[0]) || 0,
        amount1: Number(prices.value.ok?.ok?.[1]) || 0
    }
}
/**
 * Returns the balance of liquidity token for the given pair.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to get balance for.
 * @param token1 Symbol of token to get balance for.
 * @returns An object with the liquidity token balance.
 */

export const myBalanceLiquidity = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api)
    const lp = await factory.query.getPair(asset_0.address, asset_1.address);

    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }
    const balance = await lpToken.query.balanceOf(signer.address)
    return {
        liquidity: balance.value?.ok?.toNumber() || 0
    }
}
/**
 * Returns an object with an estimation of the tokens that can be recovered after removing the liquidity.
 * @param api API promise
 * @param signer Keyring pair
 * @param token0 Symbol of token to get balance for.
 * @param token1 Symbol of token to get balance for.
 * @returns An object with the estimation of the balance of token0 and token1 that can be recovered.
 */
export const estimativeRemoveToken = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string
) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api)
    const lp = await factory.query.getPair(asset_0.address, asset_1.address);
    const token_0 = new Token(asset_0.address, signer, api);
    const token_1 = new Token(asset_1.address, signer, api);
    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }
    const balance_liquidity = (await lpToken.query.balanceOf(signer.address)).value.ok?.toNumber() || 0
    const supply = (await lpToken.query.totalSupply()).value.ok?.toNumber() || 0
    const balance_0 = (await token_0.query.balanceOf(lpToken.address)).value.ok?.toNumber() || 0
    const balance_1 = (await token_1.query.balanceOf(lpToken.address)).value.ok?.toNumber() || 0

    const estimative_recovery_0 = Math.round(((balance_liquidity * balance_0) / supply))
    const estimative_recovery_1 = Math.round((balance_liquidity * balance_1) / supply)
    const fee_0 = Math.round((estimative_recovery_0 * 0.08) / 100)
    const fee_1 = Math.round((estimative_recovery_1 * 0.08) / 100)
    return {
        balance_recovery_0: estimative_recovery_0 - fee_0,
        balance_recovery_1: estimative_recovery_1 - fee_1
    }
}
/**
 * @description
 * This function estimates the amount of tokens that can be recovered when removing liquidity from a pool.
 * It takes into account the liquidity provided, the balance of the tokens in the pool, and the tax percentage of the DEX.
 * It also takes into account the period of time that the liquidity has been in the pool.
 * @param api The Polkadot API to use.
 * @param signer The keyring pair to use for signing the transaction.
 * @param token0 Symbol of token 0.
 * @param token1 Symbol of token 1.
 * @param amount0 Amount of token 0 to remove.
 * @param amount1 Amount of token 1 to remove.
 * @param tax_percent_dex The percentage of tax that the DEX takes.
 * @param period The period of time that the liquidity has been in the pool.
 * @param volumes_swap The volume of swaps that the DEX does.
 * @returns An object with the estimation of the balance of token0 and token1 that can be recovered.
 */
export const estimativeRecoveryLPSwap = async (
    api: ApiPromise,
    signer: KeyringPair,
    token0: string,
    token1: string,
    amount0: number,
    amount1: number,
    tax_percent_dex: number = 0.3,
    period: number = 60,
    volumes_swap: number = 1000,

) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api)
    const lp = await factory.query.getPair(asset_0.address, asset_1.address);
    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }

    const supply = await lpToken.query.totalSupply()
    const estimative_recovery_liquidity = ((amount0 * amount1) / Number(supply.value.ok) || 0) * (volumes_swap * tax_percent_dex * period)

    const token_0 = new Token(asset_0.address, signer, api);
    const token_1 = new Token(asset_1.address, signer, api);
    const balance_0 = await token_0.query.balanceOf(lpToken.address)
    const balance_1 = await token_1.query.balanceOf(lpToken.address)

    const estimative_recovery_0 = (Number(estimative_recovery_liquidity) || 0 * Number(balance_0.value.ok) || 0) / Number(supply.value.ok || 0)
    const estimative_recovery_1 = (Number(estimative_recovery_liquidity) || 0 * Number(balance_1.value.ok) || 0) / Number(supply.value.ok || 0)

    return {
        balance_recovery_0: estimative_recovery_0,
        balance_recovery_1: estimative_recovery_1
    }
}
/**
 * @description Given two tokens, returns the cumulative price of the pair token.
 * @param api The Polkadot API
 * @param signer The KeyringPair to use for signing
 * @param token0 The address of the first token
 * @param token1 The address of the second token
 * @returns The cumulative price of the pair token
 */
export const priceCumulativeLast = async (api: ApiPromise, signer: KeyringPair, token0: string, token1: string) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api)
    const lp = await factory.query.getPair(asset_0.address, asset_1.address);
    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }
    const prices0_last = Number((await lpToken.query.price0CumulativeLast()).value.ok)
    const prices1_last = Number((await lpToken.query.price1CumulativeLast()).value.ok)
    return prices0_last - prices1_last
}
/**
 * @description Sync the LP token.
 * @param api The Polkadot API
 * @param signer The KeyringPair to use for signing
 * @param token0 The address of the first token
 * @param token1 The address of the second token
 * @returns The LP token contract
 */
export const syncLP = async (api: ApiPromise, signer: KeyringPair, token0: string, token1: string) => {
    const asset_0 = Assets.find((asset) => asset.symbol === token0);
    const asset_1 = Assets.find((asset) => asset.symbol === token1);
    if (!asset_0 || !asset_1) {
        throw new Error(`Unsupported token ${token0} or ${token1}`);
    }
    const factory = new Factory(CONTRACT_FACTORY, signer, api)
    const lp = await factory.query.getPair(asset_0.address, asset_1.address);
    const lpToken = new Pair(
        lp.value.ok?.toString() || "0x0",
        signer,
        api,
    );
    if (!lpToken) {
        throw new Error("LP token not found");
    }

    const contract = new ContractPromise(api, ABI_pair, lpToken.address);

    const { gasRequired, result } = await contract.query['pair::sync'](
        signer.address,
        {
            gasLimit: getGasLimit(api),
        }
    );
    if (result.isOk) {
        const flags = result.asOk.flags.toHuman()
        if (flags.includes('Revert')) {
            throw new Error('Revert');
        }
    }
    const activity = await contract.tx['pair::sync']({
        gasLimit: gasRequired,
    })
    await new Promise<string>((resolve, reject) => {
        activity.signAndSend(signer, async (result) => {
            if (result.status.isInBlock) {
                console.log(`Completed at blockHash ${result.status.asInBlock}`);
            }
            if (result.status.isFinalized) {
                console.log(`Finalized at blockHash ${result.status.asFinalized}`);
                resolve(result.status.asFinalized.toString());
            }
            if (result.isError) {
                console.log(`Error at blockHash ${result.isError}`);
                reject("Error at blockHash");
            }
        }).catch(reject);
    });
}
/**
 * Returns the balance of the given token in the user's account.
 * @param api API promise
 * @param signer Keyring pair
 * @param token Symbol of token to get balance for
 * @returns The balance of the given token in the user's account.
 */
export const balanceToken = async (api: ApiPromise, signer: KeyringPair, token: string) => {
    const asset = Assets.find((asset) => asset.symbol === token);
    if (!asset) {
        throw new Error(`Unsupported token ${token}`);
    }
    const token_ = new Token(asset.address, signer, api);
    return (await token_.query.balanceOf(signer.address)).value.ok?.toNumber() || 0
}
/**
 * Returns the balance of the native token in the user's account.
 * @param api API promise
 * @param signer Keyring pair
 * @returns The balance of the native token in the user's account.
 */
export const balanceNative = async (api: ApiPromise, address: string) => {
    return ((await api.query.system.account(address)) as any).data.free;
}

/**
 * Transfers a given amount of a given token from the signer's account to another account.
 * @param api API promise
 * @param signer Keyring pair
 * @param token Symbol of token to transfer
 * @param to Address to transfer the tokens to
 * @param amount Amount of tokens to transfer
 * @returns The promise of the transfer transaction
 */
export const transferToken = async (api: ApiPromise, signer: KeyringPair, token: string, to: string, amount: number) => {
    const asset = Assets.find((asset) => asset.symbol === token);
    if (!asset) {
        throw new Error(`Unsupported token ${token}`);
    }
    const token_ = new Token(asset.address, signer, api);
    return (await token_.tx.transfer(to, amount))
}

/**
 * Transfers a given amount of the native token from the signer's account to another account.
 * @param api API promise
 * @param signer Keyring pair
 * @param to Address to transfer the tokens to
 * @param amount Amount of tokens to transfer
 * @returns The promise of the transfer transaction
 */
export const transferNative = async (api: ApiPromise, signer: KeyringPair, to: string, amount: number) => {
    return (await api.tx.balances.transfer(to, amount).signAndSend(signer));
}

/**
 * Returns the fee for a given transfer of native tokens
 * @param api API promise
 * @param signer Keyring pair
 * @param to Address to transfer the tokens to
 * @param amount Amount of tokens to transfer
 * @returns The fee for the transfer
 */
export const entitativeFee = async (api: ApiPromise, signer: KeyringPair, to: string, amount: number) => {
    const info = await api.tx.balances
        .transfer(to, Math.round(amount))
        .paymentInfo(signer);

    return info?.partialFee.toBn().toNumber() || 0;
}

/**
 * Transfers a given amount of tokens to multiple accounts at once.
 * @param api API promise
 * @param signer Keyring pair
 * @param accountsAndAmount Array of objects with "to" address and "amount" number
 * @returns The promise of the transfer transaction
 */
export const transferBatch = async (api: ApiPromise, signer: KeyringPair, accountsAndAmount: { to: string, amount: number }[]) => {
    return (await api.tx.utility.batch(accountsAndAmount).signAndSend(signer));
}
/**
 * Returns the fee for a given transfer of tokens to multiple accounts at once.
 * @param api API promise
 * @param signer Keyring pair
 * @param accountsAndAmount Array of objects with "to" address and "amount" number
 * @returns The fee for the transfer
 */
export const transferFeeBatch = async (api: ApiPromise, signer: KeyringPair, accountsAndAmount: { to: string, amount: number }[]) => {
    const info = await api.tx.utility.batch(accountsAndAmount).paymentInfo(signer);
    return info?.partialFee.toBn().toNumber() || 0;
}