import hre from "hardhat";
import BalanceTree from '../src/balance-tree';

const timelockContract = '0x17eedfb0a6e6e06e95b3a1f928dc4024240bc76b'
const udtContract = '0x90de74265a416e1393a450752175aed98fe11517'
const durationInBlocks = 1000000

const final = require("../final.json");


async function main() {
  // Let's add some of the local accounts to the final object!
  const tree = new BalanceTree(final)

  // We get the contract to deploy
  const MerkleDistributor = await hre.ethers.getContractFactory("MerkleDistributor");
  console.log(udtContract, tree.getHexRoot(), durationInBlocks, timelockContract)
  // const merkleDistributor = await MerkleDistributor.deploy(udtContract, tree.getHexRoot(), durationInBlocks, timelockContract);

  // console.log(`MerkleDistributor ${tree.getHexRoot()} deployed to:`, merkleDistributor.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });