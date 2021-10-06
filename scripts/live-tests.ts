import hre from "hardhat";
import BalanceTree from '../src/balance-tree';

const timelockContract = '0x17eedfb0a6e6e06e95b3a1f928dc4024240bc76b'
const distributorContract = '0x04C89607413713Ec9775E14b954286519d836FEf'
const udtContract = '0x90de74265a416e1393a450752175aed98fe11517'
const unlockMultisig = '0xa39b44c4AFfbb56b76a1BF1d19Eb93a5DfC2EBA9'
const durationInBlocks = 1000000

const final = require("../final.json");
const UDTAbi = require("./udt-abi.json");




const prep = async () => {
  const [signer] = await hre.ethers.getSigners()

  // Send Eth to multisig address
  const tx = await signer.sendTransaction({
    to: unlockMultisig,
    value: hre.ethers.utils.parseEther("1.0")
  });

  // Impersonate multisig
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [unlockMultisig],
  })

  const multiSigSigner = await hre.ethers.provider.getSigner(
    unlockMultisig
    );
    const udt = new hre.ethers.Contract( udtContract , UDTAbi , multiSigSigner );

    console.log('Transfer to distributor')
    console.log('unlockMultisig', await udt.balanceOf(unlockMultisig))
    console.log('distributorContract', await udt.balanceOf(distributorContract))
    // Send tokens
    await udt.transfer(distributorContract, await udt.balanceOf(unlockMultisig))
    console.log('unlockMultisig', await udt.balanceOf(unlockMultisig))
    console.log('distributorContract', await udt.balanceOf(distributorContract))

  }

  const claim = async (udt: any, merkleDistributor: any, tree: any, idx: number, claimer: any) => {

    // THIS WORKS!
    // const cproof = tree.getProof(idx, claimer.account, hre.ethers.BigNumber.from(claimer.amount))
    // await merkleDistributor.claim(idx, claimer.account, claimer.amount, cproof)

    console.log("Claimer:", claimer.account)
    const claimerSigner = await hre.ethers.provider.getSigner(
      claimer.account
      );
      console.log("signer")

      console.log("udt")

      // Check balances + delegation
      console.log('Balance before:', await udt.balanceOf(claimer.account))
      console.log('Delegate before:', await udt.delegates(claimer.account))

      // delegateToClaim
      const proof = tree.getProof(idx, claimer.account, hre.ethers.BigNumber.from(claimer.amount))
      const version = '1';

      // Prep sign
      const delegatee = claimer.account
      const nonce = 0
      const expiry = Math.floor(new Date().getTime()/1000) + 60 * 60 // 1 hour from now!
      // const { chainId } = await provider.getNetwork()
      const chainId = 1 // Ganache thinks its #1. 🤦‍♂️
      const domain = {
        name: await udt.name(),
        version,
        chainId,
        verifyingContract: udt.address,
      }

      const types = {
        'Delegation': [
          { name: 'delegatee', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'expiry', type: 'uint256' },
        ]
      }

      const value = {
        delegatee,
        nonce,
        expiry,
      }

      const ethersSignature = await claimerSigner._signTypedData(domain, types, value)
      const { v, r, s } = hre.ethers.utils.splitSignature(ethersSignature)
      console.log('still here?')
      try {
        await merkleDistributor.delegateToClaim(delegatee, nonce, expiry, v, r, s, idx, claimer.account, claimer.amount, proof)
      } catch (e) {
        console.error('there was an error. it is ok')
        console.error(e)
      }

      console.log('Balance after: ', await udt.balanceOf(claimer.account))
      console.log('Delegate after:', await udt.delegates(claimer.account))
      return true
    }


    async function main() {
      // Prep
      await prep()

      // Get Distributor contract
      const MerkleDistributor = await hre.ethers.getContractFactory("MerkleDistributor");
      const merkleDistributor = MerkleDistributor.attach(distributorContract)

      const udt = new hre.ethers.Contract(udtContract, UDTAbi, (await hre.ethers.getSigners())[0]);

      const signers = (await hre.ethers.getSigners()).map(s => s.address)

      // Goal add signers to the final array so we can claim for them to test everything out!
      signers.forEach((s) => {
        final.push({ account: s, amount: 1 })
      })
      const [signer] = signers
      const tree = new BalanceTree(final)


      const claimNext = async (nextClaims: any): Promise<any> => {
        const idx = nextClaims.pop()
        if (idx) {
          await claim(udt, merkleDistributor, tree, idx, final[idx])
          try {
            return claimNext(nextClaims)
          } catch (error) {
            console.log('was there an error???')
            console.error(error)
          }
        } else {
          return false
        }
      }


      const nextClaims: any = []
      let i = 0
      for (let i = 0; i < signers.length; i++) {

        // let's find them in final?
        final.forEach((item: any, idx: number) => {
          if (item.account === signers[i]) {
            nextClaims.push(idx)
          }
        })
      }
      let x = await claimNext(nextClaims)
      console.log('DONE!')
      console.log(x)



      // Check balances + delegation again!

      // Try to sweep
      // Claim as someone who does not have tokens
      // Try to sweep again
      // Accelerate in time

    }

    main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });