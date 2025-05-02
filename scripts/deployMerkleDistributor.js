require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@nomicfoundation/hardhat-verify')
const { ethers, run } = require('hardhat')
const fs = require('fs')
const path = require('path')

const CLAIM_TOKEN_ADDRESS = '0x17D5bdEe340519E28d1AD7062D74273ece62FAFb'

async function main() {
  // Claim token
  const resultPath = path.join(__dirname, 'result.json')
  const { merkleRoot } = JSON.parse(fs.readFileSync(resultPath, 'utf8'))

  console.log('Deploying MerkleDistributor...')
  const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor')
  const merkleDistributor = await MerkleDistributor.deploy(CLAIM_TOKEN_ADDRESS, merkleRoot)
  await merkleDistributor.deployed()

  console.log(`MerkleDistributor deployed at ${merkleDistributor.address}`)

  // Wait for a few blocks before verifying
  console.log('Waiting for contract to be indexed...')
  await merkleDistributor.deployTransaction.wait(6)

  // Verify on Etherscan
  try {
    console.log('Verifying contract on Etherscan...')
    await run('verify:verify', {
      address: merkleDistributor.address,
      constructorArguments: [CLAIM_TOKEN_ADDRESS, merkleRoot],
    })
    console.log('Contract verified successfully!')
  } catch (error) {
    console.error('Verification failed:', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
