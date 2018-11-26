pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Crowdsale.sol";
import "./CappedCrowdsale.sol";
import "./PhasedCrowdsale.sol";
import "./Whitelisted.sol";
import "./ERC1132.sol";


contract SpinCrowdsale is Crowdsale, CappedCrowdsale, PhasedCrowdsale, Whitelisted {
  using SafeMath for uint256;

  bytes32 internal constant _REASON_VESTING_1ST_PARTY = "vesting_1st_party";
  bytes32 internal constant _REASON_VESTING_2ND_PARTY = "vesting_2nd_party";
  bytes32 internal constant _REASON_VESTING_3RD_PARTY = "vesting_3rd_party";
  bytes32 internal constant _REASON_VESTING_4TH_PARTY = "vesting_4th_party";
  bytes32 internal constant _REASON_CROWDSALE = "crowdsale";
  bytes32 internal constant _REASON_BONUS = "bonus";
  mapping(bytes32 => uint256) internal lockPeriods;


  constructor(uint256 rate, address wallet, ERC1132 token, uint256 totalSaleCap)
    public
    Crowdsale(rate, wallet, token)
    CappedCrowdsale(totalSaleCap) 
  {
    // TODO: Fix the lock periods!!!
    lockPeriods[_REASON_VESTING_1ST_PARTY] = 1 hours;
    lockPeriods[_REASON_VESTING_2ND_PARTY] = 2 hours;
    lockPeriods[_REASON_VESTING_3RD_PARTY] = 3 hours;
    lockPeriods[_REASON_VESTING_4TH_PARTY] = 4 hours;
    lockPeriods[_REASON_CROWDSALE] = 10 minutes;
    lockPeriods[_REASON_BONUS] = 20 minutes;
  }

  /**
   * @dev The order of the accounts and the token amounts should be same
   * @param dedicatedAccounts Address list to be vested for
   * @param dedicatedTokens List of token amounts to be vested per each vesting party for
   */
  function vestDedicatedTokens(
    address[] dedicatedAccounts,
    uint256[] dedicatedTokens
  )
    external
    onlyAdmin
  {
    for (uint i = 0; i < dedicatedAccounts.length; i++) {
      _vestTokens(dedicatedAccounts[i], dedicatedTokens[i]);
    }
  }

  /**
   * @dev Unlocks the tokens for the provided addresses
   *      only for the locks of which the validity expired
   * @param accounts List of addresses that the tokens to be unlocked
   */
  function releaseTokens(address[] accounts) external {
    for (uint256 i = 0; i < accounts.length; i++) {
      token().unlock(accounts[i]);
    }
  }

  /**
   * @dev Vests the given amount of tokens for the given beneficiary
   *      Vesting occurs in four parties each having different
   *      vesting period with the same amount provided by `tokenAmount`.
   * @param beneficiary Address that the tokens to be vested for
   * @param tokenAmount Amount of tokens to be vested
   */
  function _vestTokens(
    address beneficiary,
    uint256 tokenAmount
  )
    internal
  {
    token().transferWithLock(
      beneficiary,
      _REASON_VESTING_1ST_PARTY,
      tokenAmount,
      lockPeriods[_REASON_VESTING_1ST_PARTY]
    );

    token().transferWithLock(
      beneficiary,
      _REASON_VESTING_2ND_PARTY,
      tokenAmount,
      lockPeriods[_REASON_VESTING_2ND_PARTY]
    );

    token().transferWithLock(
      beneficiary,
      _REASON_VESTING_3RD_PARTY,
      tokenAmount,
      lockPeriods[_REASON_VESTING_3RD_PARTY]
    );

    token().transferWithLock(
      beneficiary,
      _REASON_VESTING_4TH_PARTY,
      tokenAmount,
      lockPeriods[_REASON_VESTING_4TH_PARTY]
    );
  }

  /**
   * @dev Extend parent behavior requiring to be within contributing period
   * @param beneficiary Address performing the token purchase
   * @param weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(
    address beneficiary,
    uint256 weiAmount
  )
    internal
    onlyWhitelisted
    view
  {
    super._preValidatePurchase(beneficiary, weiAmount);
  }

  /**
   * @dev Transfers and locks purchased and bonus tokens.
   *      Amount of bonus tokens are calculated with the
   *      bonus rate of the current phase
   * @param beneficiary Address performing the token purchase
   * @param tokenAmount Number of tokens to be emitted
   */
  function _deliverTokens(
    address beneficiary,
    uint256 tokenAmount
  )
    internal
  {
    // Get the bonus rate for the current phase and calculate the bonus tokens
    uint256 bonusAmount = _calculateBonus(tokenAmount, phaseBonusRate());

    // Transfer and lock purchased tokens
    if (token().tokensLocked(beneficiary, _REASON_CROWDSALE) == 0) {
      token().transferWithLock(beneficiary, _REASON_CROWDSALE, tokenAmount, lockPeriods[_REASON_CROWDSALE]);
    } else {
      token().increaseLockAmountFor(beneficiary, _REASON_CROWDSALE, tokenAmount);
    }

    // Transfer and lock bonus tokens
    if (token().tokensLocked(beneficiary, _REASON_BONUS) == 0) {
      token().transferWithLock(beneficiary, _REASON_BONUS, bonusAmount, lockPeriods[_REASON_BONUS]);
    } else {
      token().increaseLockAmountFor(beneficiary, _REASON_BONUS, bonusAmount);
    }
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 weiAmount)
    internal view returns (uint256)
  {
    return weiAmount.mul(rate());
  }

  /**
   * @param tokenAmount Token amount to be invested
   * @param bonusRate Bonus rate in percentage multiplied by 100
   */
  function _calculateBonus(uint256 tokenAmount, uint256 bonusRate)
    private pure returns (uint256)
  {
    return tokenAmount.mul(bonusRate).div(10000);
  }
}