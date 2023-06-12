/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config()
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 5000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      settings: {
        debug: {
          revertStrings: 'debug',
        },
      },
    },
    goerli: {
      chainId: 5,
      url: process.env.GOERLI_PROVIDER,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.MAINNET_PROVIDER,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
}
