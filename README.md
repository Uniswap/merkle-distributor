# Installation
1. `yarn install`
2. `cp .env.example .env`

Manually create Tenderly fork and paste fork-id in .env for testing.

# Commands

| Command                           | Option                                                       | Required | Description          | Result                              |
|-----------------------------------|--------------------------------------------------------------|----------|----------------------|-------------------------------------|
| generate-merkle-root              | -i, --input path to JSON file in format `{address: balance}` | Yes      | Generate Merkle tree | Outputs balanceMapTree.json in root |

