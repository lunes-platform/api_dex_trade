import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import setupApi from '../globalSetup';
import { addLiquidityAsset, addLiquidityNative, priceTokenOut, swapNativeForExactToken, swapTokensForExactTokens, syncLP } from './UniswapV2';

const COINS = {
    UP: 'UP',
    USDT: 'USDT',
    LUNES: 'LUNES',
};

const SYNC_INTERVAL = 600 * 1000; // 1 hour
let isActive = false;
async function syncLiquidityPools(api: ApiPromise, wallet: KeyringPair) {
    try {
        if (isActive) return;
        isActive = true;
        console.log('Sincronizando LPs');
        //const amount_0 = Math.floor(Math.random() * (9999999999 - 100000000 + 1)) + 100000000;
        //const amount_1 = Math.floor(Math.random() * (9999999999 - 100000000 + 1)) + 100000000;
        //await addLiquidityNative(api, wallet, COINS.UP, amount_0, 0, amount_1, 0)
        // await addLiquidityNative(api, wallet, COINS.USDT, amount_0, 0, amount_1, 0)
        //await addLiquidityAsset(api, wallet, COINS.UP, COINS.USDT, amount_0, 0, amount_1, 0)
        console.log('Syncing LPs');
        await syncLP(api, wallet, COINS.UP, COINS.USDT);
        await syncLP(api, wallet, COINS.UP, COINS.LUNES);
        await syncLP(api, wallet, COINS.USDT, COINS.LUNES);
        console.log('Swapped assets');
        const aux = Math.floor(Math.random() * (9999999999 - 100000000 + 1)) + 100000000;
        const amount = Math.round(100000000 + ((aux * Math.random() * 100) / 100));
        let prices = await priceTokenOut(api, wallet, COINS.USDT, COINS.UP, amount)
        await swapTokensForExactTokens(api, wallet, COINS.USDT, COINS.UP, prices.amount1, amount);
        console.log('Swapped native');
        prices = await priceTokenOut(api, wallet, COINS.LUNES, COINS.UP, amount)
        await swapNativeForExactToken(api, wallet, COINS.UP, prices.amount1, amount);
        prices = await priceTokenOut(api, wallet, COINS.LUNES, COINS.USDT, amount)
        await swapNativeForExactToken(api, wallet, COINS.USDT, prices.amount1, amount);
        console.log('done');
        isActive = false;

    } catch (error) {
        console.error('Erro ao sincronizar LPs:', error);
    }
}

async function main() {
    try {
        const { api, wallet } = await setupApi();
        syncLiquidityPools(api, wallet);
        setInterval(() => syncLiquidityPools(api, wallet), SYNC_INTERVAL);
    } catch (error) {
        console.error('Erro ao inicializar:', error);
    }
}

main();