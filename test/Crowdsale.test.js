const { ether } = require('./utils/ether');
const { getCurrentTimestamp, increaseTime } = require('./utils/evm');
const { calculateBonus } = require('./utils/crowdsale');
const SpinToken = artifacts.require('SpinToken');
const SpinCrowdsale = artifacts.require('SpinCrowdsale');
const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();


contract('SpinCrowdsale', ([creator, wallet, funder, thirdParty, thirdPartyAlt]) => {
  const NAME = 'SPIN Protocol';
  const SYMBOL = 'SPIN';
  const DECIMALS = 18;
  const INITIAL_SUPPLY = new BigNumber(1250000000); // 1.25 Billion SPIN tokens

  const EXCHANGE_RATE = new BigNumber(10); // 1 ether = 10 SPIN
  const TOTAL_SALE_CAP = ether(10);
  const VESTING_TOKEN_AMOUNT = new BigNumber('4e22'); // 40,000 SPIN
  const SALE_PERIOD = 1000; // 1000 seconds
  const BONUS_RATE = new BigNumber(2500); // 25% Bonus rate which is multiplied by 100 for better resolution

  // These values are for testing purposes. The values set in SpinCrowdsale 
  // contract which will be deployed in mainnet will be different.
  const PURCHASED_TOKEN_RELEASE_TIME = 600; // 10 minutes
  const BONUS_TOKEN_RELEASE_TIME = 1200; // 20 minutes
  const VESTING_PARTY_RELEASE_TIME = 3600 // 1 hour per vesting (incremental)

  const fundingAmount = ether(2); // 2 ether
  const insufficientFundingAmount = ether(0.1); // 0.1 ether
  const vestAmount_funder = new BigNumber('2.5e21');
  const vestAmount_thirdParty = new BigNumber('1e21');


  beforeEach(async () => {
    this.token = await SpinToken.new(NAME, SYMBOL, DECIMALS, INITIAL_SUPPLY);
    this.crowdsale = await SpinCrowdsale.new(EXCHANGE_RATE, wallet, this.token.address, TOTAL_SALE_CAP);

    // Fund the crowdsale contract with tokens
    await this.token.transfer(
      this.crowdsale.address,
      TOTAL_SALE_CAP.mul(EXCHANGE_RATE).add(VESTING_TOKEN_AMOUNT)
    );
  });

  describe('Crowdsale', () => {
    it('has an purchase rate', async () => {
      (await this.crowdsale.rate()).should.be.bignumber.equal(EXCHANGE_RATE);
    });
  
    it('has a collector wallet', async () => {
      (await this.crowdsale.wallet()).should.equal(wallet);
    });
  
    it('has a token', async () => {
      (await this.crowdsale.token()).should.be.equal(this.token.address);
    });
  });

  describe('Crowdsale::Admin', () => {
    it('admin can add a new admin', async () => {
      await this.crowdsale.addAdmin(thirdParty).should.be.fulfilled;
      (await this.crowdsale.isAdmin(thirdParty)).should.be.true;
    });

    it('does not allow an unauthorized address to add an admin', async () => {
      (await this.crowdsale.isAdmin(thirdPartyAlt)).should.be.false;
      await this.crowdsale.addAdmin(thirdParty, {from: thirdPartyAlt}).should.be.rejected;
    });
  });

  describe('Crowdsale::Whitelisted', () => {
    it('admin can add account/s to whitelist', async () => {
      await this.crowdsale.addToWhitelist(funder).should.be.fulfilled;
      await this.crowdsale.addWhitelist([thirdParty, thirdPartyAlt]).should.be.fulfilled;

      (await this.crowdsale.isWhitelisted(funder)).should.be.true;
      (await this.crowdsale.isWhitelisted(thirdParty)).should.be.true;
      (await this.crowdsale.isWhitelisted(thirdPartyAlt)).should.be.true;
    });

    it('admin can remove an account from whitelist', async () => {
      await this.crowdsale.addWhitelist([funder, thirdParty]).should.be.fulfilled;
      await this.crowdsale.removeFromWhitelist(funder).should.be.fulfilled;
      await this.crowdsale.removeFromWhitelist(thirdParty).should.be.fulfilled;

      (await this.crowdsale.isWhitelisted(funder)).should.be.false;
      (await this.crowdsale.isWhitelisted(thirdParty)).should.be.false;
    });

    it('does not allow unauthorized accounts to add/remove accounts to whitelist', async () => {
      await this.crowdsale.addToWhitelist(funder, {from: thirdParty}).should.be.rejected;
      await this.crowdsale.addWhitelist([funder, thirdParty], {from: thirdParty}).should.be.rejected;

      await this.crowdsale.addWhitelist([funder, thirdParty, thirdPartyAlt]).should.be.fulfilled;
      await this.crowdsale.removeFromWhitelist(funder, {from: thirdParty}).should.be.rejected;
    });
  });

  describe('Crowdsale::Withdrawable', () => {
    it('admin can withdraw ether from the contract', async () => {
      // Notice that there is no way to have ether in crowdsale contract
      // unless, in deployment time, fund collector wallet is set as the contract itself
      // Therefore just testing whether this function can be called or not.
      let contractPreBalanceEth = await web3.eth.getBalance(this.crowdsale.address);
      await this.crowdsale.withdrawToken(0).should.be.fulfilled;

      let contractPostBalanceEth = await web3.eth.getBalance(this.crowdsale.address);
      contractPostBalanceEth.should.be.bignumber.equal(contractPreBalanceEth.sub(0));
    });

    it('admin can withdraw token from the contract', async () => {
      let contractPreBalanceToken = await this.token.balanceOf(this.crowdsale.address);
      await this.crowdsale.withdrawToken(VESTING_TOKEN_AMOUNT).should.be.fulfilled;

      let contractPostBalanceToken = await this.token.balanceOf(this.crowdsale.address);
      contractPostBalanceToken.should.be.bignumber.equal(contractPreBalanceToken.sub(VESTING_TOKEN_AMOUNT));
    });

    it('does not allow an unauthorized account to withdraw token/ether', async () => {
      await this.crowdsale.withdrawToken(VESTING_TOKEN_AMOUNT, {from: thirdParty}).should.be.rejected;
      await this.crowdsale.withdrawEther(ether(0), {from: thirdParty}).should.be.rejected;
    });
  });

  describe('Crowdsale::Phased', () => {
    let walletPreBalanceEther;
    let walletPostBalanceEther;
    let crowdsalePreBalanceToken;
    let crowdsalePostBalanceToken;
    let phaseStartTime;

    beforeEach(async () => {
      walletPreBalanceEther = await web3.eth.getBalance(wallet);
      crowdsalePreBalanceToken = await this.token.balanceOf(this.crowdsale.address);
      phaseStartTime = (await getCurrentTimestamp()) + 10;

      // Add `funder` to whitelist
      await this.crowdsale.addToWhitelist(funder);

      // Start a phase
      await this.crowdsale.setPhase(
        EXCHANGE_RATE,
        phaseStartTime,
        SALE_PERIOD + phaseStartTime, 
        BONUS_RATE
      ).should.be.fulfilled;

      // Wind EVM time forward so that the sale starts
      await increaseTime(20);
      (await this.crowdsale.isActive()).should.be.true;
    });

    it('sets phase variables correctly', async () => {
      // Compare the actual phase variables with the expected ones
      (await this.crowdsale.phaseStartTime()).should.be.bignumber.equal(phaseStartTime);
      (await this.crowdsale.phaseEndTime()).should.be.bignumber.equal(SALE_PERIOD + phaseStartTime);
      (await this.crowdsale.phaseBonusRate()).should.be.bignumber.equal(BONUS_RATE);
    });

    it('transfers and locks tokens upon a purchase', async () => {
      let tokenAmount = EXCHANGE_RATE.mul(fundingAmount);
      let bonusAmount = calculateBonus(tokenAmount, BONUS_RATE);

      // Send some ether for purchase as `funder`
      await this.crowdsale.sendTransaction({from: funder, value: fundingAmount});

      // Check amount of tokens transfered and locked against funder address
      let actualLockedTokens = await this.token.totalBalanceOf(funder);
      actualLockedTokens.should.be.bignumber.equal(tokenAmount.add(bonusAmount));

      // Check whether fund collector get the ether sent for purchased
      walletPostBalanceEther = await web3.eth.getBalance(wallet);
      walletPostBalanceEther.should.be.bignumber.equal(walletPreBalanceEther.add(fundingAmount));

      // Check whether crowdsale token balance is reduced by the amount of token transfered and locked
      crowdsalePostBalanceToken = await this.token.balanceOf(this.crowdsale.address);
      crowdsalePostBalanceToken.should.be.bignumber.equal(
        crowdsalePreBalanceToken.sub(tokenAmount.add(bonusAmount))
      );
    });

    it('does not allow to set a phase while there is an active phase', async () => {
      phaseStartTime = (await getCurrentTimestamp()) + 100;

      // Start a phase
      await this.crowdsale.setPhase(
        EXCHANGE_RATE,
        phaseStartTime,
        SALE_PERIOD + phaseStartTime, 
        BONUS_RATE
      ).should.be.rejected;
    });

    it('does not allow a non-whitelisted address to make a purchase', async () => {
      // Send some ether for purchase as `thirdParty`
      await this.crowdsale.sendTransaction({from: thirdParty, value: fundingAmount}).should.be.rejected;
    });

    it('does not allow to make a purchase when the sale phase deactive', async () => {
      await increaseTime(SALE_PERIOD);
      (await this.crowdsale.isActive()).should.be.false;
      // Send some ether for purchase as `funder`
      await this.crowdsale.sendTransaction({from: funder, value: fundingAmount}).should.be.rejected;
    });

    it('does not allow an unauthorized address to set a phase', async () => {
      await increaseTime(SALE_PERIOD);

      phaseStartTime = (await getCurrentTimestamp()) + 100;

      // Start a phase
      await this.crowdsale.setPhase(
        EXCHANGE_RATE,
        phaseStartTime,
        SALE_PERIOD + phaseStartTime, 
        BONUS_RATE,
        {from: thirdParty}
      ).should.be.rejected;
    });

    it('does not allow to set a phase in past', async () => {
      await increaseTime(SALE_PERIOD);

      // Start a phase
      await this.crowdsale.setPhase(
        EXCHANGE_RATE,
        phaseStartTime,
        SALE_PERIOD + phaseStartTime, 
        BONUS_RATE
      ).should.be.rejected;
    });

    it('does not allow to set a phase with 0 purchase rate', async () => {
      await increaseTime(SALE_PERIOD);

      phaseStartTime = (await getCurrentTimestamp()) + 100;

      // Start a phase
      await this.crowdsale.setPhase(
        0,
        phaseStartTime,
        SALE_PERIOD + phaseStartTime, 
        BONUS_RATE
      ).should.be.rejected;
    });
  });

  describe('Crowdsale::Capped', () => {
    let phaseStartTime;

    beforeEach(async () => {
      phaseStartTime = (await getCurrentTimestamp()) + 10;

      // Add `funder` to whitelist
      await this.crowdsale.addToWhitelist(funder);

      // Start a phase
      await this.crowdsale.setPhase(
        EXCHANGE_RATE,
        phaseStartTime,
        SALE_PERIOD + phaseStartTime, 
        BONUS_RATE
      ).should.be.fulfilled;

      // Wind EVM time forward so that the sale starts
      await increaseTime(20);
      (await this.crowdsale.isActive()).should.be.true;
    });

    it('has a total sale cap', async () => {
      (await this.crowdsale.getTotalSaleCap()).should.be.bignumber.equal(TOTAL_SALE_CAP);
    });

    it('sets individual caps', async () => {
      await this.crowdsale.setIndividualCaps(ether(1), ether(5));

      // Validate actual caps
      let caps = await this.crowdsale.getIndividualCaps();
      caps[0].should.be.bignumber.equal(ether(1));
      caps[1].should.be.bignumber.equal(ether(5));
    });

    it('does not allow an unauthorized address to set individual caps', async () => {
      await this.crowdsale.setIndividualCaps(ether(1), ether(5), {from: thirdParty}).should.be.rejected;
    });

    it('does not allow to make a purchase less than the minimum cap', async () => {
      await this.crowdsale.setIndividualCaps(ether(1), ether(4));
      await this.crowdsale.sendTransaction({from: funder, value: insufficientFundingAmount}).should.be.rejected;
      await this.crowdsale.sendTransaction({from: funder, value: fundingAmount}).should.be.fulfilled;
    });

    it('does not allow to make a purchase more than the maximum cap', async () => {
      await this.crowdsale.setIndividualCaps(ether(1), ether(2));
      await this.crowdsale.sendTransaction({from: funder, value: ether(3)}).should.be.rejected;
      await this.crowdsale.sendTransaction({from: funder, value: ether(2)}).should.be.fulfilled;
      await this.crowdsale.sendTransaction({from: funder, value: ether(1)}).should.be.rejected;
    });

    it('does not allow to make any more purchase when the total sale cap is reached', async () => {
      await this.crowdsale.sendTransaction({from: funder, value: TOTAL_SALE_CAP.sub(ether(1.001))}).should.be.fulfilled;
      await this.crowdsale.sendTransaction({from: funder, value: ether(1.001)}).should.be.fulfilled;
      await this.crowdsale.sendTransaction({from: funder, value: 1}).should.be.rejected;
    });
  });

  describe('Crowdsale::Vesting&Releasing', () => {
    let walletPreBalanceEther;
    let crowdsalePreBalanceToken;
    let earnedToken;

    beforeEach(async () => {
      walletPreBalanceEther = await web3.eth.getBalance(wallet);
      crowdsalePreBalanceToken = await this.token.balanceOf(this.crowdsale.address);

      // Calculate amount of total earned token upon a purchase
      let tokenAmount = EXCHANGE_RATE.mul(fundingAmount);
      let bonusAmount = calculateBonus(tokenAmount, BONUS_RATE);
      earnedToken = tokenAmount.add(bonusAmount);

      let phaseStartTime = (await getCurrentTimestamp()) + 1;

      // Add funders to whitelist
      await this.crowdsale.addWhitelist([funder, thirdParty, thirdPartyAlt]).should.be.fulfilled;

      // Start a phase
      await this.crowdsale.setPhase(
        EXCHANGE_RATE,
        phaseStartTime,
        SALE_PERIOD + phaseStartTime, 
        BONUS_RATE
      ).should.be.fulfilled;

      // Wind EVM time forward so that the sale starts
      await increaseTime(20);
      (await this.crowdsale.isActive()).should.be.true;
    });

    it('releases all locked tokens', async () => {
      // Make some purchase from different funder addresses
      await this.crowdsale.sendTransaction({from: funder, value: fundingAmount}).should.be.fulfilled;
      await this.crowdsale.sendTransaction({from: thirdParty, value: fundingAmount}).should.be.fulfilled;
      await this.crowdsale.sendTransaction({from: thirdPartyAlt, value: fundingAmount}).should.be.fulfilled;

      // Check whether fund collector gets the ether sent for purchases
      let walletPostBalanceEther = await web3.eth.getBalance(wallet);
      walletPostBalanceEther.should.be.bignumber.equal(walletPreBalanceEther.add(fundingAmount.mul(3)));

      // Check whether crowdsale token balance is reduced by the amount of total token transfered and locked
      let crowdsalePostBalanceToken = await this.token.balanceOf(this.crowdsale.address);
      crowdsalePostBalanceToken.should.be.bignumber.equal(
        crowdsalePreBalanceToken.sub(earnedToken.mul(3))
      );

      // Wind forward EVM blocktime to time when the all earned token locks expire
      await increaseTime(BONUS_TOKEN_RELEASE_TIME);

      // And release tokens
      await this.crowdsale.releaseTokens([funder, thirdParty, thirdPartyAlt]).should.be.fulfilled;

      // Check funders token balances
      let funderPostBalance = await this.token.balanceOf(funder);
      let thirdPartyPostBalance = await this.token.balanceOf(thirdParty);
      let thirdPartyAltPostBalance = await this.token.balanceOf(thirdPartyAlt);
      funderPostBalance.should.be.bignumber.equal(earnedToken);
      thirdPartyPostBalance.should.be.bignumber.equal(earnedToken);
      thirdPartyAltPostBalance.should.be.bignumber.equal(earnedToken);
    });

    it('vests tokens', async () => {
      let funderPreBalanceToken = await this.token.balanceOf(funder);
      let thirdPartyPreBalanceToken = await this.token.balanceOf(thirdParty);

      // Vest tokens for the dedicated accounts
      await this.crowdsale.vestDedicatedTokens(
        [funder, thirdParty],
        [vestAmount_funder, vestAmount_thirdParty]
      ).should.be.fulfilled;

      // Wind forward EVM blocktime to time when the first party of the vested token lock expires
      await increaseTime(VESTING_PARTY_RELEASE_TIME);

      // Release token for first party
      this.crowdsale.releaseTokens([funder, thirdParty]).should.be.fulfilled;

      // Check token balances
      let funderPostBalanceToken = await this.token.balanceOf(funder);
      let thirdPartyPostBalanceToken = await this.token.balanceOf(thirdParty);
      funderPostBalanceToken.should.be.bignumber.equal(funderPreBalanceToken.add(vestAmount_funder));
      thirdPartyPostBalanceToken.should.be.bignumber.equal(thirdPartyPreBalanceToken.add(vestAmount_thirdParty));
      
      // Wind forward EVM blocktime to time when the second party of the vested token lock expires
      await increaseTime(VESTING_PARTY_RELEASE_TIME);

      funderPreBalanceToken = funderPostBalanceToken;
      thirdPartyPreBalanceToken = thirdPartyPostBalanceToken;

      // Release token for first party
      this.crowdsale.releaseTokens([funder, thirdParty]).should.be.fulfilled;

      // Check token balances
      funderPostBalanceToken = await this.token.balanceOf(funder);
      thirdPartyPostBalanceToken = await this.token.balanceOf(thirdParty);
      funderPostBalanceToken.should.be.bignumber.equal(funderPreBalanceToken.add(vestAmount_funder));
      thirdPartyPostBalanceToken.should.be.bignumber.equal(thirdPartyPreBalanceToken.add(vestAmount_thirdParty));

      // Wind forward EVM blocktime to time when the third party of the vested token lock expires
      await increaseTime(VESTING_PARTY_RELEASE_TIME);

      funderPreBalanceToken = funderPostBalanceToken;
      thirdPartyPreBalanceToken = thirdPartyPostBalanceToken;

      // Release token for first party
      this.crowdsale.releaseTokens([funder, thirdParty]).should.be.fulfilled;

      // Check token balances
      funderPostBalanceToken = await this.token.balanceOf(funder);
      thirdPartyPostBalanceToken = await this.token.balanceOf(thirdParty);
      funderPostBalanceToken.should.be.bignumber.equal(funderPreBalanceToken.add(vestAmount_funder));
      thirdPartyPostBalanceToken.should.be.bignumber.equal(thirdPartyPreBalanceToken.add(vestAmount_thirdParty));

      // Wind forward EVM blocktime to time when the fourth party of the vested token lock expires
      await increaseTime(VESTING_PARTY_RELEASE_TIME);

      funderPreBalanceToken = funderPostBalanceToken;
      thirdPartyPreBalanceToken = thirdPartyPostBalanceToken;

      // Release token for first party
      this.crowdsale.releaseTokens([funder, thirdParty]).should.be.fulfilled;

      // Check token balances
      funderPostBalanceToken = await this.token.balanceOf(funder);
      thirdPartyPostBalanceToken = await this.token.balanceOf(thirdParty);
      funderPostBalanceToken.should.be.bignumber.equal(funderPreBalanceToken.add(vestAmount_funder));
      thirdPartyPostBalanceToken.should.be.bignumber.equal(thirdPartyPreBalanceToken.add(vestAmount_thirdParty));
    });

    it('does not allow an unauthorized address to vest tokens', async () => {
      // Try to vest tokens for the dedicated accounts as an unauthorized account
      await this.crowdsale.vestDedicatedTokens(
        [funder, thirdParty],
        [vestAmount_funder, vestAmount_thirdParty],
        {from: thirdParty}
      ).should.be.rejected;
    });

    it('does not release vested tokens before the vesting period expires', async () => {
      let funderPreBalanceToken = await this.token.balanceOf(funder);
      let thirdPartyPreBalanceToken = await this.token.balanceOf(thirdParty);

      // Vest tokens for the dedicated accounts
      await this.crowdsale.vestDedicatedTokens(
        [funder, thirdParty],
        [vestAmount_funder, vestAmount_thirdParty]
      ).should.be.fulfilled;

      // Try release tokens before the vesting period expires
      this.crowdsale.releaseTokens([funder, thirdParty]).should.be.fulfilled;

      // Check token balances
      let funderPostBalanceToken = await this.token.balanceOf(funder);
      let thirdPartyPostBalanceToken = await this.token.balanceOf(thirdParty);
      funderPostBalanceToken.should.be.bignumber.not.equal(funderPreBalanceToken.add(vestAmount_funder));
      thirdPartyPostBalanceToken.should.be.bignumber.not.equal(thirdPartyPreBalanceToken.add(vestAmount_thirdParty));
    });
  });
});
