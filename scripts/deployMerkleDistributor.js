require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
const { ethers } = require('hardhat')

async function main() {
  const GOLDEN_TOKEN_ADDRESS = ''
  const MERKLE_ROOT = ''

  if (GOLDEN_TOKEN_ADDRESS.length === 0 || MERKLE_ROOT.length === 0) {
    throw new Error(`Missing golden token address or merkle root`)
  }

  const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor')
  const merkleDistributor = await MerkleDistributor.deploy(GOLDEN_TOKEN_ADDRESS, MERKLE_ROOT)
  await merkleDistributor.deployed()
  console.log(`merkleDistributor deployed at ${merkleDistributor.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
