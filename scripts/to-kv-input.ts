import { program } from 'commander'
import fs from 'fs'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

console.log(
  JSON.stringify(
    Object.keys(json.claims).map((account) => {
      const claim = json.claims[account]
      return {
        key: account,
        value: JSON.stringify(claim),
      }
    })
  )
)
