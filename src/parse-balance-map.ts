import { BigNumber, utils } from 'ethers'
import BalanceTree from './balance-tree'

const { isAddress, getAddress } = utils

interface AirdropInfo {
  merkleRoot: string
  tokenTotal: string
  numDrops: number
  claims: {
    [account: string]: {
      index: number
      amount: string
      proof: string[]
    }
  }
}

export function parseBalanceMap(balanceMap: { [account: string]: string }): AirdropInfo {
  const mapped = Object.keys(balanceMap).reduce<{ [address: string]: BigNumber }>((memo, account) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`)
    }
    const parsed = getAddress(account)
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
    const parsedNum = BigNumber.from(balanceMap[account])
    if (parsedNum.lte(0)) throw new Error(`Invalid amount for account: ${account}`)
    memo[parsed] = parsedNum
    return memo
  }, {})

  const treeElements = Object.keys(mapped).map((account) => ({ account, amount: mapped[account] }))

  const tree = new BalanceTree(treeElements)

  const proofs = treeElements.reduce<{ [address: string]: { amount: string; index: number; proof: string[] } }>(
    (memo, { account, amount }, index) => {
      memo[account] = {
        index,
        amount: mapped[account].toHexString(),
        proof: tree.getProof(index, account, mapped[account]),
      }
      return memo
    },
    {}
  )

  const tokenTotal: BigNumber = Object.keys(mapped).reduce<BigNumber>(
    (memo, key) => memo.add(mapped[key]),
    BigNumber.from(0)
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tokenTotal: tokenTotal.toHexString(),
    numDrops: treeElements.length,
    claims: proofs,
  }
}
