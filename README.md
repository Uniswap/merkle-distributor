
## Install Dependencies

`yarn`

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

## Deploy steps

1) Create _.env_ file using [.env.example](.env.example) as example
2) Fill the [distribution.json](scripts/distribution.json) file with data
3) Change the names of generated files in [generate-merkle-root.ts](scripts/generate-merkle-root.ts)

```typescript
fs.writeFileSync('scripts/<NAME>.front.json', JSON.stringify(parsed, null, 4));
fs.writeFileSync('scripts/<NAME>.qa.json', JSON.stringify(claims, null, 4));
```

4) Generate the merkle root and proofs

```bash
yarn generate-merkle-root
```
5) Change data in the [deployMerkleDistributor.js](scripts/deployMerkleDistributor.js) file

```ts
  const merkleDistributor = await MerkleDistributor.deploy(
    // Token Address
    '<TOKEN_ADDRESS>',
    // Merkle root
    '<MERKLE_ROOT>'
  )
```
6) Deploy
```bash
yarn deploy --network <NETWORK>
```

