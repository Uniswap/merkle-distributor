import { program } from 'commander'
import fs from 'fs'
import { generateTree } from '../src/index'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

console.time("generate-tree")
const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

const tree = generateTree(json)
console.timeEnd("generate-tree")
fs.writeFile('proofs.json', JSON.stringify(tree), (err) => {
  if (err) {
    throw err
  }
  console.log('Data written to file')
})
