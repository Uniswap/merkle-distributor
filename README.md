
## Install Dependencies

`yarn`

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

## Deploy preparations

1) Fulfill the [distribution.json](scripts/distribution.json) file
2) Generate the merkle root and proofs

```bash
ts-node scripts/generate-merkle-root.ts -i ./scripts/distribution.json > ./scripts/result.json
```
3) Change data in the [deployMerkleDistributor.js](scripts/deployMerkleDistributor.js) file

```ts
  const merkleDistributor = await MerkleDistributor.deploy(
    // Token Address
    '<TOKEN_ADDRESS>',
    // Merkle root
    '<MERKLE_ROOT>'
  )
```
4) Deploy
```bash
npx hardhat run ./scripts/deployMerkleDistributor.js --network <NETWORK>
```

