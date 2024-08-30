import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
require('dotenv').config()
const WSS_NETWORK = process.env.WSS_NETWORK || 'ws://127.0.0.1:9944';
const SEED = process.env.SEED || '//Alice';
// Create a new instance of contract
const wsProvider = new WsProvider(WSS_NETWORK);
// Create a keyring instance
const keyring = new Keyring({ type: 'sr25519' });
export default async function setupApi(): Promise<{ api: ApiPromise, wallet: KeyringPair }> {
    const api = await ApiPromise.create({ provider: wsProvider });
    const wallet = keyring.addFromUri(SEED);
    return { api, wallet };
}