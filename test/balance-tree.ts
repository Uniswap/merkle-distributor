import MerkleTree from './merkle-tree'
import { BigNumber } from 'ethers'

export default class BalanceTree {
  private readonly tree: MerkleTree
  constructor(balances: { [account: string]: BigNumber }) {
    // convert the balances object to a list of hashes
    throw new Error('not implemented')
  }

  public getHexRoot(): string {
    throw new Error('not implemented')
  }
}
