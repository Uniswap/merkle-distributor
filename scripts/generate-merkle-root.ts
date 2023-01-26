import { program } from 'commander'
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

const parsed = parseBalanceMap(json);
let claims: {address: string, index: number, amount: string, proof: string}[] = [];

for (let address in parsed.claims) {
  let proofString = '[';

  for (let i of parsed.claims[address].proof) {
    proofString = proofString.concat(i)
    if (i !== parsed.claims[address].proof[parsed.claims[address].proof.length - 1]) {
      proofString = proofString.concat(';')
    } else {
      proofString = proofString.concat(']')
    }
  }

  claims.push ({
    address,
    index: parsed.claims[address].index,
    amount: parsed.claims[address].amount,
    proof: proofString
  })
}

fs.writeFileSync('scripts/complete_result.json', JSON.stringify(parsed, null, 4));
fs.writeFileSync('scripts/claims.json', JSON.stringify(claims, null, 4));
