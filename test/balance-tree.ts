import MerkleTree from './merkle-tree'
import { BigNumber, utils } from 'ethers'

export default class BalanceTree {
  private readonly tree: MerkleTree
  constructor(balances: { [account: string]: BigNumber }) {
    this.tree = new MerkleTree(
      Object.keys(balances).map((account) => {
        return BalanceTree.toNode(account, balances[account])
      })
    )
  }

  // keccak256(abi.encode(account, amount))
  public static toNode(account: string, amount: BigNumber): Buffer {
    return Buffer.from(utils.solidityKeccak256(['address', 'uint256'], [account, amount]).substr(2), 'hex')
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  public getProof(account: string, amount: BigNumber): string[] {
    return this.tree.getHexProof(BalanceTree.toNode(account, amount))
  }
}
