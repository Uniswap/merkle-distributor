# @uniswap/merkle-distributor

[![Tests](https://github.com/Uniswap/merkle-distributor/workflows/Tests/badge.svg)](https://github.com/Uniswap/merkle-distributor/actions?query=workflow%3ATests)
[![Lint](https://github.com/Uniswap/merkle-distributor/workflows/Lint/badge.svg)](https://github.com/Uniswap/merkle-distributor/actions?query=workflow%3ALint)

# Local Development

The following assumes the use of `node@>=10`.

## Install Dependencies

`yarn`

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

## To Deploy Merkle Distributor
Ensure .env variables are set. 

Update `CLAIM_TOKEN_ADDRESS` in `scripts/deployMerkleDistributor.js` for the token address you wish to Airdrop / allow Users to claim. 

Update scripts/claimData.json for { receipient_address:claimable_token_amount } entries.

{{ claimable_token_amount }} should be listed in the token’s native big number format—for example, if the token has 18 decimals (like ETH), then 1 ETH should be written as 1000000000000000000; if the token has 8 decimals (like BTC), then 1 BTC should be 100000000.

You can use the unit converter here: https://etherscan.io/unitconverter

Run `yarn generate-merkle-root:claim` to generate merkle root, outputted in scripts/result.json.

Run `yarn deploy-merkle-distributor:claim` to deploy the merkle distributor contract on Sepolia.
