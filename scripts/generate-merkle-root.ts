import { program } from 'commander'
import { utils } from 'ethers'
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'

const { isAddress, getAddress } = utils

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

// this is the blob we should distribute, which shows all balances, the total airdrop amount, and hex proofs for each account so the client does not need
// to compute them
console.log(JSON.stringify(parseBalanceMap(json)))
