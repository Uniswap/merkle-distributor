require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
const { ethers } = require('hardhat')
async function main() {
  const MerkleCoordinatorFactory = await ethers.getContractFactory('MerkleCoordinator')
  const MerkleCoordinator = await MerkleCoordinatorFactory.deploy()
  await MerkleCoordinator.deployed()
  console.log(`MerkleCoordinator deployed at ${MerkleCoordinator.address}`)
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
