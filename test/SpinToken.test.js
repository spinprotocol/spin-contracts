const { decodeLogs } = require('./utils/decodeLogs');
const { ZERO_ADDRESS } = require('./utils/constants');
const SpinToken = artifacts.require('SpinToken');
const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();


contract('SpinToken', ([_, creator, receiver]) => {
  console.log("_", _);
  console.log("creator", creator);

  const NAME = 'SPIN Protocol';
  const SYMBOL = 'SPIN';
  const DECIMALS = 18;
  const INITIAL_SUPPLY = 1250;
  const TOTAL_SUPPLY = new BigNumber(INITIAL_SUPPLY * 10 ** DECIMALS);

  const lockReason = 'GOV';
  const lockReason2 = 'CLAIM';
  const lockReason3 = 'VESTED';
  const lockedAmount = new BigNumber(200);
  const lockPeriod = new BigNumber(1000); // 1000 seconds
  const extendedLockPeriod = new BigNumber(500); // 500 seconds
  const lockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  const transferAmount = new BigNumber(100);
  const approveAmount = 10;
  const nullAddress = 0x0000000000000000000000000000000000000000;

  // Increase the block hight of local testnet 
  // manually to mock the real-time block generation
  const increaseTime = function(duration) {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id: lockTimestamp
      },
      (err, resp) => {
        if (!err) {
          web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: lockTimestamp + 1
          });
        }
      }
    );
  };


  beforeEach(async () => {
    this.token = await SpinToken.new(NAME, SYMBOL, DECIMALS, INITIAL_SUPPLY, { from: creator });
  });

  it('has a name', async () => {
    (await this.token.name()).should.equal(NAME);
  });

  it('has a symbol', async () => {
    (await this.token.symbol()).should.equal(SYMBOL);
  });

  it('has 18 decimals', async () => {
    (await this.token.decimals()).should.be.bignumber.equal(DECIMALS);
  });

  it('has 1250 * 10**18 initialSupply', async () => {
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

  describe('Lockable Token', () => {
    let creatorTotalBalance;
    let creatorPreBalance;
    let creatorPostBalance;
    let currentBlockNumber;
    let currentTimestamp;

    beforeEach(async () => {
      creatorPreBalance = await this.token.balanceOf(creator);
      currentBlockNumber = await web3.eth.blockNumber;
      currentTimestamp = await web3.eth.getBlock(currentBlockNumber).timestamp;
    });

    it('has the right balance for the contract creator', async () => {
      let balance = await this.token.balanceOf(creator);
      let totalBalance = await this.token.totalBalanceOf(creator);
      let totalSupply = await this.token.totalSupply();
      balance.should.be.bignumber.equal(TOTAL_SUPPLY);
      totalBalance.should.be.bignumber.equal(TOTAL_SUPPLY);
      totalSupply.should.be.bignumber.equal(TOTAL_SUPPLY);
    });

    it('reduces locked tokens from transferable balance', async () => {
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

    it('transfers token', async () => {
      // Try to transfer some tokens
      let { logs } = await this.token.transfer(receiver, transferAmount, { from: creator }).should.be.fulfilled;

      // Compare pre&post balances
      creatorPostBalance = await this.token.balanceOf(creator);
      let receiverPostBalance = await this.token.balanceOf(receiver);
      receiverPostBalance.should.be.bignumber.equal(transferAmount);
      creatorPostBalance.should.be.bignumber.equal(creatorPreBalance.sub(transferAmount));

      logs.length.should.be.equal(1);
      logs[0].event.should.equal('Transfer');
      logs[0].args.from.should.equal(creator);
      logs[0].args.to.should.equal(receiver);
      logs[0].args.value.should.be.bignumber.equal(transferAmount);
    });

    it('reverts locking more tokens than the balance of the sender', async () => {
      await this.token.lock(lockReason, creatorPreBalance, lockPeriod).should.be.rejected;
    });

    it('can extend lock period for an existing lock', async () => {
      // Notice that `this.token.locked(...)` returns 
      // `locked` variable from the contract which is indeed
      // a struct of shape of `{uint256 amount, uint256 validity, bool claimed}`
      // therefore returned `value[0]` is equal to `amount`, `value[1]` is 
      // equal to `validity` and `value[2]` is `claimed`.

      // Lock some token first
      await this.token.lock(lockReason, lockedAmount, lockPeriod, { from: creator }).should.be.fulfilled;
      let lockedToken = await this.token.locked(creator, lockReason);

      await this.token.extendLock(lockReason, extendedLockPeriod, { from: creator }).should.be.fulfilled;
      let lockExtendedToken = await this.token.locked(creator, lockReason);

      // Compare the validities of the locked tokens
      lockExtendedToken[1].should.be.bignumber.equal(lockedToken[1].add(extendedLockPeriod));

      // await assertRevert(token.extendLock(lockReason2, lockPeriod));
      // await assertRevert(token.increaseLockAmount(lockReason2, lockPeriod));
    });
  });
})
