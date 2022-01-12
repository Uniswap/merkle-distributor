# @decentraland/content-hash-merkle-distributor

## Forked from @uniswap/merkle-distributor

## Local Development

The following assumes the use of `node@>=10`.

### Install Dependencies

`npm ci`

### Generate a tree with ~10k content hashes

`npm run generate-merkle-root:data`

Time to completion 1.049s. Json size: 18mb

This will generate a `proofs.json` file in the root of the project.

### Verify a single proof of a tree with ~10k leafs

`npm run verify-merkle-root:proof`

Time to completion 9.294ms. Json size: 4kb
