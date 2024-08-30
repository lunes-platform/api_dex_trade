import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import setupApi from '../globalSetup';
import { expect } from "chai";
import { addLiquidityAsset, addLiquidityNative, balanceToken, myBalanceLiquidity, priceTokenInt, priceTokenOut, removeLiquidityNative, removeLiquidityToken, reservesLPToken, swapNativeForExactToken, swapTokensForExactTokens } from '../src/UniswapV2';
describe('UniswapV2Pair', () => {
    let api: ApiPromise;
    let wallet: KeyringPair;
    async function setup(): Promise<void> {
        ({ api, wallet } = await setupApi());
    }
    it('can setup', async () => {
        await setup()
    })

    it('can  add liquidity native', async () => {
        await setup()
        const balance_after = await myBalanceLiquidity(api, wallet, 'LUNES', 'UP')
        await addLiquidityNative(api, wallet, 'UP', 1000000000, 0, 1000000000, 0)
        const balance_before = await myBalanceLiquidity(api, wallet, 'LUNES', 'UP')
        expect(balance_before.liquidity).to.not.equal(balance_after.liquidity)
    })
    it('can  add liquidity assets', async () => {
        const balance_after = await myBalanceLiquidity(api, wallet, 'USDT', 'UP')
        await addLiquidityAsset(api, wallet, 'UP', 'USDT', 1000000000, 0, 10000000, 0)
        const balance_before = await myBalanceLiquidity(api, wallet, 'USDT', 'UP')
        expect(balance_before.liquidity).to.not.equal(balance_after.liquidity)
    })
    it('can  get reserves', async () => {
        const reserve_lp1 = await reservesLPToken(api, wallet, 'USDT', 'UP')
        expect(reserve_lp1.supply).to.not.equal(0)
        expect(reserve_lp1.amount1).to.not.equal(0)
        expect(reserve_lp1.amount2).to.not.equal(0)

        const reserve_lp2 = await reservesLPToken(api, wallet, 'LUNES', 'UP')
        expect(reserve_lp2.supply).to.not.equal(0)
        expect(reserve_lp2.amount1).to.not.equal(0)
        expect(reserve_lp2.amount2).to.not.equal(0)
    })
    it('can  get price', async () => {
        let prices = await priceTokenInt(api, wallet, 'LUNES', 'UP', 100000000)
        expect(prices.amount0).to.not.equal(0)
        expect(prices.amount1).to.not.equal(0)
    })
    it('can  swap tokens assets', async () => {
        let prices = await priceTokenOut(api, wallet, 'USDT', 'UP', 100000000)
        expect(prices.amount1).to.not.equal(0)
        const balance_after0 = await balanceToken(api, wallet, 'USDT')
        await swapTokensForExactTokens(api, wallet, 'USDT', 'UP', prices.amount1, 100000000)
        const balance_before0 = await balanceToken(api, wallet, 'USDT')
        expect(balance_before0).to.not.equal(0)
        expect(balance_before0).to.not.equal(balance_after0)
    })

    it('can  swap tokens native', async () => {
        let prices = await priceTokenOut(api, wallet, 'LUNES', 'UP', 100000000)
        expect(prices.amount1).to.not.equal(0)
        const balance_after = await balanceToken(api, wallet, 'UP')
        await swapNativeForExactToken(api, wallet, 'UP', prices.amount1, 100000000)
        const balance_before = await balanceToken(api, wallet, 'UP')
        expect(balance_before).to.not.equal(0)
        expect(balance_before).to.not.equal(balance_after)
    })

    it('can  remove liquidity native', async () => {
        const balance_after = await myBalanceLiquidity(api, wallet, 'LUNES', 'UP')
        expect(balance_after.liquidity).to.not.equal(0)
        await removeLiquidityNative(api, wallet, 'UP', balance_after.liquidity, 0, 0)
        const balance_before = await myBalanceLiquidity(api, wallet, 'LUNES', 'UP')
        expect(balance_before.liquidity).to.not.equal(balance_after.liquidity)
    })

    it('can  remove liquidity assets', async () => {
        const balance_after = await myBalanceLiquidity(api, wallet, 'UP', 'USDT')
        expect(balance_after.liquidity).to.not.equal(0)
        await removeLiquidityToken(api, wallet, 'UP', 'USDT', balance_after.liquidity, 0, 0)
        const balance_before = await myBalanceLiquidity(api, wallet, 'UP', 'USDT')
        expect(balance_before.liquidity).to.not.equal(balance_after.liquidity)
    })
})