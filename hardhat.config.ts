import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// @ts-expect-error
task("accounts", "Prints the list of accounts", async (_, hre: any) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  chainId: 1,
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/",
      }
    },
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/",
    },
    mainnet: {
      url: "https://eth-mainnet.alchemyapi.io/v2/",
    }
  },
  etherscan: {
    apiKey: ""
  }
};
