const { decodeLogs } = require('./utils/decodeLogs');
const { ZERO_ADDRESS } = require('./utils/constants');
const { getCurrentTimestamp } = require('./utils/blockData');
const SpinToken = artifacts.require('SpinToken');
const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();


contract('SpinToken', ([creator, receiver, thirdParty]) => {
  const NAME = 'SPIN Protocol';
  const SYMBOL = 'SPIN';
  const DECIMALS = 18;
  const INITIAL_SUPPLY = 1250000000; // 1.25 Billion SPIN tokens
  const TOTAL_SUPPLY = new BigNumber(INITIAL_SUPPLY * 10 ** DECIMALS);

  const lockReason = 'VESTING';
  const lockedAmount = new BigNumber('200e18'); // 200 SPIN tokens
  const transferAmount = new BigNumber('100e18');  // 100 SPIN tokens
  const approveAmount = new BigNumber('10e18');  // 10 SPIN tokens
  const lockPeriod = new BigNumber(1000); // 1000 seconds
  const extendedLockPeriod = new BigNumber(500); // 500 seconds

  // Increase the block hight of local testnet 
  // manually to mock the real-time block generation
  const increaseTime = function(duration, id) {
    web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id
    });
  };


  beforeEach(async () => {
    this.token = await SpinToken.new(NAME, SYMBOL, DECIMALS, INITIAL_SUPPLY, { from: creator });
  });

  describe('ERC20::Standard Token', () => {
    it('has a name', async () => {
      (await this.token.name()).should.equal(NAME);
    });
  
    it('has a symbol', async () => {
      (await this.token.symbol()).should.equal(SYMBOL);
    });
  
    it('has 18 decimals', async () => {
      (await this.token.decimals()).should.be.bignumber.equal(DECIMALS);
    });
  
    it('has 1.25 * 10**9 * 10**18 (1.25 Billion * (pow 10,18)) initialSupply', async () => {
      (await this.token.totalSupply()).should.be.bignumber.equal(TOTAL_SUPPLY);
    });
  
    it('assigns the initial total supply to the creator', async () => {
      const totalSupply = await this.token.totalSupply();
      const creatorBalance = await this.token.balanceOf(creator);
  
      creatorBalance.should.be.bignumber.equal(totalSupply);
  
      const receipt = await web3.eth.getTransactionReceipt(this.token.transactionHash);
      const logs = decodeLogs(receipt.logs, SpinToken, this.token.address);
      logs.length.should.equal(3);
      // Call MinterRole
      logs[0].event.should.equal('MinterAdded');
      logs[0].args.account.valueOf().should.equal(creator);
      // Call PauserRole#
      logs[1].event.should.equal('PauserAdded');
      logs[1].args.account.valueOf().should.equal(creator);
      // Call IERC20#Transfer(address indexed from, address indexed to, uint256 value)
      logs[2].event.should.equal('Transfer');
      logs[2].args.from.valueOf().should.equal(ZERO_ADDRESS);
      logs[2].args.to.valueOf().should.equal(creator);
      logs[2].args.value.should.be.bignumber.equal(totalSupply);
    });

    it('transfers token', async () => {
      let creatorPreBalance = await this.token.balanceOf(creator);
      // Try to transfer some tokens
      let { logs } = await this.token.transfer(receiver, transferAmount, { from: creator }).should.be.fulfilled;

      // Compare pre&post balances
      let creatorPostBalance = await this.token.balanceOf(creator);
      let receiverPostBalance = await this.token.balanceOf(receiver);
      receiverPostBalance.should.be.bignumber.equal(transferAmount);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(transferAmount));

      logs.length.should.be.equal(1);
      logs[0].event.should.equal('Transfer');
      logs[0].args.from.should.equal(creator);
      logs[0].args.to.should.equal(receiver);
      logs[0].args.value.should.be.bignumber.equal(transferAmount);
    });

    it('approves allowance for thirdparty', async () => {
      // Try to approve some tokens to `receiver`
      let { logs } = await this.token.approve(receiver, approveAmount, { from: creator }).should.be.fulfilled;

      let receiverAllowance = await this.token.allowance(creator, receiver);
      receiverAllowance.should.be.bignumber.equal(approveAmount);

      logs.length.should.be.equal(1);
      logs[0].event.should.equal('Approval');
      logs[0].args.owner.should.equal(creator);
      logs[0].args.spender.should.equal(receiver);
      logs[0].args.value.should.be.bignumber.equal(approveAmount);
    });

    it('transfers from thirdparty on behalf', async () => {
      let creatorPreBalance = await this.token.balanceOf(creator);
      // First, approve some tokens to `receiver`
      await this.token.approve(receiver, approveAmount, { from: creator }).should.be.fulfilled;
      // And try to transfer some tokens
      await this.token.transferFrom(creator, thirdParty, approveAmount, { from: receiver }).should.be.fulfilled;

      // Compare pre&post balances
      let creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(approveAmount));
    });

    it('does not allow to transfer tokens more than the transferable balance', async () => {
      // Try to transfer some tokens as `receiver` who does not have balance
      await this.token.transfer(thirdParty, transferAmount, { from: receiver }).should.be.rejected;
    });

    it('does not allow to transfer from more than the owner\'s transferable balance or allowance', async () => {
      // First, approve some tokens to `receiver`
      await this.token.approve(receiver, approveAmount, { from: creator }).should.be.fulfilled;

      // And try to transfer some tokens more than the allowance
      await this.token.transferFrom(creator, thirdParty, approveAmount.add(10), { from: receiver }).should.be.rejected;

      let creatorBalance = await this.token.balanceOf(creator);
      // And try to transfer some tokens more than the owner's balance
      await this.token.transferFrom(creator, thirdParty, creatorBalance.add(10), { from: receiver }).should.be.rejected;
    });
  });

  describe('ERC20::Pausable Token', () => {
    beforeEach(async () => {
      // Fund `receiver`
      await this.token.transfer(receiver, transferAmount, {from: creator});
      (await this.token.balanceOf(receiver)).should.be.bignumber.equal(transferAmount);

      // Approve some token to `receiver`
      await this.token.approve(receiver, approveAmount, {from: creator});
      (await this.token.allowance(creator, receiver)).should.be.bignumber.equal(approveAmount);
    });

    it('reverts pause/unpause tx from an unauhtorized account', async () => {
      // Try to pause the token contract
      await this.token.pause({from: thirdParty}).should.be.rejected;

      // Pause the contract as an authorized account
      await this.token.pause({from: creator}).should.be.fulfilled;
      // Then try to unpause as `thirdParty` which is unauthorized
      await this.token.unpause({from: thirdParty}).should.be.rejected;
    });

    it('reverts transfers and approvals when the contract is paused', async () => {
      // First pause the token contract
      await this.token.pause({from: creator}).should.be.fulfilled;

      // Try to transfer some tokens to `receiver` as creator
      await this.token.transfer(receiver, transferAmount, {from: creator}).should.be.rejected;
      // Try to transfer tokens to `thirdParty` from `creator` as `receiver`
      await this.token.transferFrom(creator, thirdParty, approveAmount, {from: receiver}).should.be.rejected;
      // Try to approve `approveAmount` of tokens to `thirdParty` as `receiver`
      await this.token.approve(thirdParty, approveAmount, {from: receiver}).should.be.rejected;
      // Try to increase/decrease allowance by `apporveAmount` for `receiver`, as `creator`
      await this.token.increaseAllowance(receiver, approveAmount, {from: creator}).should.be.rejected;
      await this.token.decreaseAllowance(receiver, approveAmount, {from: creator}).should.be.rejected;
    });
  });

  describe('ERC20::Mintable Token', () => {
    it('only minter can mint', async () => {
      // Try to mint as `creator` which is a minter indeed
      await this.token.mint(receiver, transferAmount, {from: creator}).should.be.fulfilled;
      // Amounts of token minted to the corresponding address should be equal to that address' post balance
      (await this.token.balanceOf(receiver)).should.be.bignumber.equal(transferAmount);
    });

    it('reverts minting tx from an unauhtorized account', async () => {
      // Try to mint some tokens to `receiver` as `receiver`
      await this.token.mint(receiver, transferAmount, {from: receiver}).should.be.rejected;
    });
  });

  describe('ERC20::Burnable Token', () => {
    let creatorPreBalance;

    beforeEach(async () => {
      // Approve some token to `receiver`
      await this.token.approve(receiver, approveAmount, {from: creator});
      (await this.token.allowance(creator, receiver)).should.be.bignumber.equal(approveAmount);

      // Fund `thirdParty`
      await this.token.transfer(thirdParty, transferAmount, {from: creator});
      (await this.token.balanceOf(thirdParty)).should.be.bignumber.equal(transferAmount);

      creatorPreBalance = await this.token.balanceOf(creator);
    });

    it('burns tokens', async () => {
      // Burn `transferAmount` of token as `creator`
      await this.token.burn(transferAmount, {from: creator}).should.be.fulfilled;
      // Total supply should have been reduced by the burnt amount of token
      (await this.token.totalSupply()).should.be.bignumber.equal(TOTAL_SUPPLY.sub(transferAmount));
      // Also the balance of `creator`
      (await this.token.balanceOf(creator)).should.be.bignumber.equal(creatorPreBalance.sub(transferAmount));

      creatorPreBalance = await this.token.balanceOf(creator);
      // Burn `approveAmount` tokens from `creator` as `receiver`
      await this.token.burnFrom(creator, approveAmount, {from: receiver}).should.be.fulfilled;
      // Total supply should have been reduced by the burnt amount of token
      (await this.token.totalSupply()).should.be.bignumber.equal(TOTAL_SUPPLY.sub(transferAmount).sub(approveAmount));
      // Also the balance of `creator`
      (await this.token.balanceOf(creator)).should.be.bignumber.equal(creatorPreBalance.sub(approveAmount));
    });

    it('reverts burning if there is no balance or allowance', async () => {
      // Try to burn tokens as `receiver` which does not have enough balance for amount of token to be burnt
      await this.token.burn(approveAmount, {from: receiver}).should.be.rejected;

      // Try to burn tokens from `creator` as `thirdParty` which does not have allowance for `creator`
      await this.token.burnFrom(creator, transferAmount, {from: thirdParty}).should.be.rejected;
    });
  });

  describe('ERC20::Lockable Token', () => {
    let creatorPreBalance;
    let creatorPostBalance;
    let currentTimestamp;

    beforeEach(async () => {
      creatorPreBalance = await this.token.balanceOf(creator);
      currentTimestamp = await getCurrentTimestamp();
    });

    it('locks tokens and reduces amount of tokens locked from the transferable balance', async () => {
      await this.token.lock(lockReason, lockedAmount, lockPeriod, { from: creator }).should.be.fulfilled;

      // Compare pre&post balances after locking tokens
      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(lockedAmount));

      // Check the actually locked tokens
      let actualLockedAmount = await this.token.tokensLocked(creator, lockReason);
      actualLockedAmount.should.be.bignumber.equal(lockedAmount);

      // Check the locked tokens after lock period
      actualLockedAmount = await this.token.tokensLockedAtTime(
        creator,
        lockReason,
        currentTimestamp + lockPeriod.valueOf() + 1 // One second after the lock period expires
      );
      actualLockedAmount.should.be.bignumber.equal(0);
    });

    it('increases the amount of tokens locked', async () => {
      // First lock some tokens
      await this.token.lock(lockReason, lockedAmount, lockPeriod, { from: creator }).should.be.fulfilled;
      let actualLockAmount = await this.token.tokensLocked(creator, lockReason);

      // Check whether if the sender's balance is reduced by the amount of token locked
      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(lockedAmount));
      creatorPreBalance = creatorPostBalance;

      await this.token.increaseLockAmount(lockReason, lockedAmount).should.be.fulfilled;
      let increasedLockAmount = await this.token.tokensLocked(creator, lockReason);

      // Check whether if the sender's balance is reduced by the amount of token locked additionally
      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(lockedAmount));

      // Compare the pre-locked amount and increased lock amount
      increasedLockAmount.should.be.bignumber.equal(actualLockAmount.add(lockedAmount));
    });

    it('unlocks tokens', async () => {
      // First lock some tokens
      await this.token.lock(lockReason, lockedAmount, lockPeriod, {from: creator}).should.be.fulfilled;
      let lockedTokenAmount = await this.token.tokensLockedAtTime(creator, lockReason, currentTimestamp);
      // Compare pre&post balances
      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(lockedAmount));
      creatorPreBalance = creatorPostBalance;

      // Wind forward EVM block time
      let lockedToken = await this.token.locked(creator, lockReason);
      await increaseTime(lockedToken[1].sub(currentTimestamp), 0);

      // Compare the amount of unlockable tokens at the end 
      // of lock period with the initially locked token
      let unlockableTokenAmount = await this.token.getUnlockableTokens(creator);
      unlockableTokenAmount.should.be.bignumber.equal(lockedTokenAmount);

      // And finally unlock the tokens
      await this.token.unlock(creator).should.be.fulfilled;

      // Check if the sender's balance is increased by amount of tokens unlocked
      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.add(unlockableTokenAmount));

      // Check, also if whether tokens are unlocked or not
      unlockableTokenAmount = await this.token.getUnlockableTokens(creator);
      unlockableTokenAmount.should.be.bignumber.equal(0);
    });

    it('transferWithLocks', async () => {
      await this.token.transferWithLock(receiver, lockReason, transferAmount, lockPeriod, {from: creator}).should.be.fulfilled;

      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(transferAmount));

      let lockedToken = await this.token.locked(receiver, lockReason);
      lockedToken[0].should.be.bignumber.equal(transferAmount);

      // TODO: To complete the rest of this test,
      // comment out the previous test and run the test again.

      // // Wind forward EVM block time
      // await increaseTime(lockedToken[1].sub(currentTimestamp), 1);
      // let receiverPreBalance = await this.token.balanceOf(receiver);
      // // And finally unlock the tokens
      // await this.token.unlock(receiver);
      // let receiverPostBalance = await this.token.balanceOf(receiver);
      // receiverPostBalance.should.be.bignumber.equal(receiverPreBalance.add(transferAmount));
    });

    it('extends lock period for an existing lock', async () => {
      // Notice that `this.token.locked(...)` returns 
      // `locked` variable from the contract which is indeed a mapping to
      // a struct of shape of `{uint256 amount, uint256 validity, bool claimed}`
      // therefore returned `value[0]` is equal to `amount`, `value[1]` is 
      // equal to `validity` and `value[2]` is `claimed`.

      // Lock some token first
      await this.token.lock(lockReason, lockedAmount, lockPeriod, { from: creator }).should.be.fulfilled;
      let lockedToken = await this.token.locked(creator, lockReason);

      // Check whether if the sender's balance is reduced by the amount of token locked
      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(lockedAmount));

      await this.token.extendLock(lockReason, extendedLockPeriod, { from: creator }).should.be.fulfilled;
      let lockExtendedToken = await this.token.locked(creator, lockReason);

      // Compare the validity of the locked tokens
      lockExtendedToken[1].should.be.bignumber.equal(lockedToken[1].add(extendedLockPeriod));
    });

    it('locks tokens again after unlocking', async () => {
      await this.token.lock(lockReason, lockedAmount, 0).should.be.fulfilled;
      await this.token.unlock(creator).should.be.fulfilled;
      await this.token.lock(lockReason, lockedAmount, lockPeriod).should.be.fulfilled;
    });

    it('transfers with lock tokens again after unlocking', async () => {
      await this.token.transferWithLock(receiver, lockReason, lockedAmount, 0).should.be.fulfilled;
      await this.token.unlock(receiver).should.be.fulfilled;
      await this.token.transferWithLock(receiver, lockReason, lockedAmount.add(100), 0).should.be.fulfilled;
    });

    it('returns 0 amount of locked token for unknown reasons', async () => {
      let actualLockedAmount = await this.token.tokensLocked(creator, lockReason);
      actualLockedAmount.should.be.bignumber.equal(0);
    });

    it('does not allow to lock tokens more than the sender\'s balance', async () => {
      await this.token.lock(lockReason, lockedAmount, lockPeriod, {from: receiver}).should.be.rejected;
    });

    it('does not allow to extend lock period and increasing lock amount for a non-existing lock', async () => {
      // Try to extend lock which does not exist
      await this.token.extendLock(lockReason, lockedAmount, lockPeriod, { from: creator }).should.be.rejected;
      // Try to increase lock amount for a non-existing lock
      await this.token.increaseLockAmount(lockReason, lockedAmount, lockPeriod, { from: creator }).should.be.rejected;
    });

    it('does not allow to lock 0 amount of token', async () => {
      await this.token.lock(lockReason, 0, lockPeriod).should.be.rejected;
      await this.token.transferWithLock(receiver, lockReason, 0, lockPeriod).should.be.rejected;
    });

    it('does not allow to increase amount of locked tokens by amount more than the sender\'s balance', async () => {
      // First lock some tokens
      await this.token.lock(lockReason, lockedAmount, lockPeriod, { from: creator }).should.be.fulfilled;
      let actualLockAmount = await this.token.tokensLocked(creator, lockReason);

      // Check whether if the sender's balance is reduced by the amount of token locked
      creatorPostBalance = await this.token.balanceOf(creator);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(lockedAmount));
      creatorPreBalance = creatorPostBalance;

      // Try to increase amount of locked tokens by an amount more then the transferable balance
      await this.token.increaseLockAmount(lockReason, creatorPreBalance.add(1)).should.be.rejected;
    });

    it('does not allow to transferWithLock more than the sender\'s balance', async () => {
      await this.token.transferWithLock(receiver, lockReason, creatorPreBalance.add(1), lockPeriod).should.be.rejected;
    });
  });
});
