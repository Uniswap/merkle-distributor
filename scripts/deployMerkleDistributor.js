require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
const { ethers } = require('hardhat')

//  npx hardhat run --network goerli scripts/deployMerkleDistributor.js

const MERKLE_ROOT = '0x5ac4b754720c2f81edfc60d2ad04ed850e21c08519743ff3780cc05a365466c8'
const SARCO_TOKEN_ADDRESS = '0x4633b43990b41B57b3678c6F3Ac35bA75C3D8436'

async function main() {
  const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor')
  const merkleDistributor = await MerkleDistributor.deploy(
    SARCO_TOKEN_ADDRESS,
    MERKLE_ROOT
  )
  await merkleDistributor.deployed()
  console.log(`merkleDistributor deployed at ${merkleDistributor.address}`)
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
