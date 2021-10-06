import hre from "hardhat";
import BalanceTree from '../src/balance-tree';

const timelockContract = '0x17eedfb0a6e6e06e95b3a1f928dc4024240bc76b'
const udtContract = '0x90de74265a416e1393a450752175aed98fe11517'
const durationInBlocks = 1000000

const final = require("../final.json");

const proofs: any = {}

async function main() {
  // Let's add some of the local accounts to the final object!
  const tree = new BalanceTree(final)
  final.forEach((claim: any, idx: number) => {
    proofs[claim.account] = tree.getProof(idx, claim.account, hre.ethers.BigNumber.from(claim.amount))
  })

  // We get the contract to deploy
  console.log(JSON.stringify(proofs))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });