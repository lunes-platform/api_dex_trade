# DEX Trade API - Lunes

## Description

This project is an API for trading on the Lunes DEX using the Uniswap V2 protocol. The API is built with TypeScript and uses the Polkadot.js library for interacting with smart contracts on the blockchain.

## Features

The API provides the following features:

### Adding Liquidity

- **`addLiquidityNative`**: Adds liquidity using the native token of the blockchain.
- **`addLiquidityAsset`**: Adds liquidity using specific tokens.

### Removing Liquidity

- **`removeLiquidityNative`**: Removes liquidity and retrieves the native token.
- **`removeLiquidityToken`**: Removes liquidity and retrieves specific tokens.

### Reserves Queries

- **`reservesLPToken`**: Queries the liquidity reserves for a specific token pair.

### Price Queries

- **`priceTokenInt`**: Gets the price of one token in terms of another within the liquidity pair.
- **`priceTokenOut`**: Calculates the amount of tokens received after a swap.

### Token Swaps

- **`swapTokensForExactTokens`**: Executes a swap between specific tokens.
- **`swapNativeForExactToken`**: Executes a swap using the native token of the blockchain.

### Balance Queries

- **`balanceToken`**: Retrieves the balance of a specific token in the wallet.
- **`myBalanceLiquidity`**: Retrieves the liquidity balance for a specific token pair.

## Dependencies

- **`@polkadot/api`**: Polkadot.js library for blockchain interactions.
- **`chai`**: Assertion library for testing.
- **`typescript`**: Superset of JavaScript that adds static types.

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/seu-usuario/dex-trade-api.git
   ```

2. **Install dependencies:**:
   ```bash
   yarn
   ```
3. **Compile TypeScript:**:
   ```bash
   yarn run build
   ```
