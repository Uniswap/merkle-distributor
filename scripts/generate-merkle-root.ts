import fs from 'fs'
import { program } from 'commander'
import { utils, BigNumber } from 'ethers'
const { isAddress, getAddress } = utils
import BalanceTree from '../test/balance-tree'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

const mapped = Object.keys(json).reduce<{ [address: string]: BigNumber }>((memo, account) => {
  if (!isAddress(account)) {
    throw new Error(`Found invalid address: ${account}`)
  }
  const parsed = getAddress(account)
  if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
  const parsedNum = BigNumber.from(json[account])
  if (parsedNum.lte(0)) throw new Error(`Invalid amount for account: ${account}`)
  memo[parsed] = parsedNum
  return memo
}, {})

const tree = new BalanceTree(json)

const proofs = Object.keys(mapped).reduce<{ [address: string]: { amount: string; proof: string[] } }>(
  (memo, account) => {
    memo[account] = { amount: mapped[account].toHexString(), proof: tree.getProof(account, mapped[account]) }
    return memo
  },
  {}
)

const total: BigNumber = Object.keys(mapped).reduce<BigNumber>((memo, key) => memo.add(mapped[key]), BigNumber.from(0))

// this is the blob we should distribute, which shows all balances, the total airdrop amount, and hex proofs for each account so the client does not need
// to compute them
console.log(JSON.stringify({ merkleRoot: tree.getHexRoot(), total: total.toHexString(), proofs }))
