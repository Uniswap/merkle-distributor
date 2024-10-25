require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
const { ethers } = require('hardhat')

async function main() {
  const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor')
  const merkleDistributor = await MerkleDistributor.deploy(
    // Coordinator
    '0x0000000000000000000000000000000000000000',
    // TRUST token
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    // Merkle root
    '0x525df38ec587d18df62b7e004e44c6cb4c3af6981d1d3f156e73eeafb1a128a5',
    // Deadline
    1688493524
  )
  await merkleDistributor.deployed()
  console.log(`merkleDistributor deployed at ${merkleDistributor.address}`)

  const merkleCoordinator = await ethers.getContractAt('MerkleCoordinator', '0x0000000000000000000000000000000000000000')
  await merkleCoordinator.setLatestMerkleDistributor(merkleDistributor.address)
  console.log(`MerkleCoordinator updated to ${merkleDistributor.address}`)
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
