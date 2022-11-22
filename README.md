# @uniswap/merkle-distributor

[![Tests](https://github.com/Uniswap/merkle-distributor/workflows/Tests/badge.svg)](https://github.com/Uniswap/merkle-distributor/actions?query=workflow%3ATests)
[![Lint](https://github.com/Uniswap/merkle-distributor/workflows/Lint/badge.svg)](https://github.com/Uniswap/merkle-distributor/actions?query=workflow%3ALint)

# Local Development

The following assumes the use of `node@>=10`.

## Install Dependencies

`yarn`

```
npm i
```

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

# To create Markle tree in json file

Added some code to save the generated json file in scripts/myjsonfile.json.

In Airdrop_list.json enter the address that you to whitelist . 

then run

```
ts-node scripts/generate-merkle-root.ts --input scripts/airdrop_list.json
```

After successful Execution the formatted output as mentioned in the (/src/parse-balance-map.ts) will be saved in scripts/myjsonfile.json

# To Run TypeScript file (If Not installed)

Run

1. 
```
npm install -g typescript
```
2. 
```
npm install -g ts-node
```


