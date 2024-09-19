import { BigNumber, utils } from 'ethers'
import BalanceTree from './balance-tree'

const { isAddress, getAddress } = utils

// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
export interface MerkleDistributorInfo {
  merkleRoot: string
  tokenTotal: string
  claims: Array<{
    index: number
    address: string
    amount: string
    proof: string[]
    flags?: {
      [flag: string]: boolean
    }
  }>
}

type OldFormat = { [account: string]: number | string }
type NewFormat = { address: string; earnings: string; reasons: string }
type CSVFormat = Array<[string, string]>

function formatBalances(balances: OldFormat | NewFormat[] | CSVFormat): NewFormat[] {
  if (Array.isArray(balances) && !Array.isArray(balances[0])) {
    // Should be NewFormat
    return balances as NewFormat[]
  } else if (Array.isArray(balances)) {
    // Should be CSV Format
    return (balances as CSVFormat).map(([address, amount]) => ({
      address: address,
      earnings: `0x${BigInt(amount).toString(16)}`,
      reasons: ''
    }))
  } else if (typeof balances == 'object') {
    // Should be OldFormat
    return Object.keys(balances).map(
      (account): NewFormat => ({
        address: account,
        earnings: `0x${balances[account].toString(16)}`,
        reasons: '',
      }))
  } else {
    console.error("Unexpected `balances` format doesn't match any expectation.")
    process.exit(1)
  }
}

export function parseBalances(balances: OldFormat | NewFormat[] | CSVFormat): MerkleDistributorInfo {
  // if balances are in an old format, process them
  const balancesInNewFormat = formatBalances(balances);
  const dataByAddress = balancesInNewFormat.reduce<{
    [address: string]: { amount: BigNumber; flags?: { [flag: string]: boolean } }
  }>((memo, { address: account, earnings, reasons }, index) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`)
    }
    const parsed = getAddress(account)
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
    const parsedNum = BigNumber.from(earnings)
    if (parsedNum.lte(0)) throw new Error(`Invalid amount for account: ${account}`)

    const flags = {
      isSOCKS: reasons.includes('socks'),
      isLP: reasons.includes('lp'),
      isUser: reasons.includes('user'),
    }

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Processing: ${index + 1}/${balancesInNewFormat.length} entries`)

    memo[parsed] = { amount: parsedNum, ...(reasons === '' ? {} : { flags }) }
    return memo
  }, {})
  console.log("\n")

  const sortedAddresses = Object.keys(dataByAddress).sort()

  console.log("Constructing tree")
  // construct a tree
  const tree = new BalanceTree(
    sortedAddresses.map((address) => ({ account: address, amount: dataByAddress[address].amount }))
  )

  console.log("Generating Claims")
  // generate claims
  const claims = sortedAddresses.map((address, index) => {
    const { amount, flags } = dataByAddress[address]
    const claim = {
      index,
      amount: amount.toHexString(),
      address: address,
      proof: tree.getProof(index, address, amount),
      ...(flags ? { flags } : {}),
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Generated Claims: ${index + 1}/${sortedAddresses.length} entries`)
    return claim
  })
  console.log("\n")

  const tokenTotal: BigNumber = sortedAddresses.reduce<BigNumber>(
    (memo, key) => memo.add(dataByAddress[key].amount),
    BigNumber.from(0)
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tokenTotal: tokenTotal.toHexString(),
    claims,
  }
}
