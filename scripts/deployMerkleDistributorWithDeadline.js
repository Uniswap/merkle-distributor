require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
const { ethers } = require('hardhat')

//  npx hardhat run --network goerli scripts/deployMerkleDistributorWithDeadline.js

const MERKLE_ROOT = '0xa106777ce21246bc8d8b5389a36243ea5584429313ea07e6592c3173c5e226d7'
const SARCO_TOKEN_ADDRESS = '0x4633b43990b41B57b3678c6F3Ac35bA75C3D8436'
async function main() {
  const MerkleDistributorWithDeadline = await ethers.getContractFactory('MerkleDistributorWithDeadline')
  const merkleDistributorWithDeadline = await MerkleDistributorWithDeadline.deploy(
    SARCO_TOKEN_ADDRESS,
    MERKLE_ROOT,
    1686247988 // June 8th
  )
  await merkleDistributorWithDeadline.deployed()
  console.log(`merkleDistributorWithDeadline deployed at ${merkleDistributorWithDeadline.address}`)
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
