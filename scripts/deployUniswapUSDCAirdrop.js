require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
const { ethers } = require('hardhat')

async function main() {
  const UniswapUSDCAirdrop = await ethers.getContractFactory('UniswapUSDCAirdrop')
  const uniswapUSDCAirdrop = await UniswapUSDCAirdrop.deploy(
    // USDC
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    '0xaa4b1e44ad67cb80b72e0564cf81801e74fe81224e830959ee9e60b8429e5436',
    1688493524
  )
  await uniswapUSDCAirdrop.deployed()
  console.log(`uniswapUSDCAirdrop deployed at ${uniswapUSDCAirdrop.address}`)
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  })
