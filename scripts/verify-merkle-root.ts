import { program } from 'commander'
import { ethers } from 'ethers'
import fs from 'fs'
import BalanceTree from '../src/balance-tree'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )
  .requiredOption(
    '-u, --url <url>',
    'Ethereum node URL'
  )
  .requiredOption(
    '-a, --address <address>',
    'Airdrop contract address'
  )

program.parse(process.argv)

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

const ABI = [
    "function merkleRoot() external view returns (bytes32)"
]

;(async () => {
    const provider = new ethers.providers.JsonRpcProvider(program.url)
    const airdrop = new ethers.Contract(program.address, ABI, provider)
    const merkleRootHex = await airdrop.merkleRoot()
    const merkleRoot = Buffer.from(merkleRootHex.slice(2), 'hex')

    for (const address in json.claims)  {
        const claim = json.claims[address]
        if (BalanceTree.verifyProof(
            claim.index,
            address,
            claim.amount,
            claim.proof,
            merkleRoot
        )) {
            console.log("Verified proof for", address)
        } else {
            console.log("Verification for", address, "failed")
        }
    }
    console.log("Done!")
})()
