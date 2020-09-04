import { program } from 'commander'
import { ethers } from 'ethers'
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'

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
    const map = parseBalanceMap(json)
    const provider = new ethers.providers.JsonRpcProvider(program.url)
    const airdrop = new ethers.Contract(program.address, ABI, provider)

    const merkleRoot = await airdrop.merkleRoot()

    if (merkleRoot === map.merkleRoot) {
        console.log("Success! Merkle roots match")
    } else {
        console.log("ALERT! Merkle roots do not match. DO NOT USE THE AIRDROP!")
    }
})()
