
## Install Dependencies

`yarn`

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

## Deploy preparations

1) Create .env file and insert the MNEMONIC there as it presented in the .env.example (other params are unnecessary)
2) Fulfill the [distribution.json](scripts/distribution.json) file
3) Generate the merkle root and proofs

```bash
ts-node scripts/generate-merkle-root.ts -i ./scripts/distribution.json > ./scripts/result.json
```
4) Change data in the [deployMerkleDistributor.js](scripts/deployMerkleDistributor.js) file

```ts
  const merkleDistributor = await MerkleDistributor.deploy(
    // Token Address
    '<TOKEN_ADDRESS>',
    // Merkle root
    '<MERKLE_ROOT>'
  )
```
5) Deploy
```bash
npx hardhat run ./scripts/deployMerkleDistributor.js --network <NETWORK>
```

