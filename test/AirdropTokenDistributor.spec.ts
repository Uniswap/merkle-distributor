import chai, { expect } from 'chai'
import { solidity, MockProvider, deployContract } from 'ethereum-waffle'
import { Contract, BigNumber } from 'ethers'

import Airdrop from '../build/AirdropTokenDistributor.json'
import TestERC20 from '../build/TestERC20.json'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

describe('AirdropTokenDistributor', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })
  const [wallet] = provider.getWallets()

  let token: Contract
  beforeEach('deploy token', async () => {
    token = await deployContract(wallet, TestERC20, ['Token', 'TKN', 0], overrides)
  })

  describe('#token', () => {
    it('returns the token address', async () => {
      const airdrop = await deployContract(wallet, Airdrop, [token.address, ZERO_BYTES32], overrides)
      expect(await airdrop.token()).to.eq(token.address)
    })
  })
})
