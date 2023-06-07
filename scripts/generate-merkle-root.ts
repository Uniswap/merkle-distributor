import { program } from 'commander'
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'
import { parse } from 'json2csv';

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

const merkleData = parseBalanceMap(json)

const csv = parse(Object.entries(merkleData.claims));
fs.writeFile('proofs.csv', csv, (err) => {
  if (err) throw err;
  console.log('file saved');
});

console.log(JSON.stringify(parseBalanceMap(json)))
