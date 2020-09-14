import { program } from 'commander'
import fs from 'fs'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )
  .requiredOption('-c, --chain-id <number>', 'chain ID of the merkle kv root')

program.parse(process.argv)

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

console.log(
  JSON.stringify(
    Object.keys(json.claims).map((account) => {
      const claim = json.claims[account]
      return {
        key: `${program.chainId}:${account}`,
        value: JSON.stringify(claim),
      }
    })
  )
)
