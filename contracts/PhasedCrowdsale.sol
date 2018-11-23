pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "./AdminRole.sol";

/**
 * @title PhasedCrowdsale
 * @dev Crowdsale accepting contributions only within 
 *      a time frame which can be repeated over time.
 */
contract PhasedCrowdsale is Crowdsale, AdminRole {
  using SafeMath for uint256;

  uint256 private _phaseIndex;
  uint256 private _phaseStartTime;
  uint256 private _phaseEndTime;
  uint256 private _phaseBonusRate;

  /**
   * @dev Reverts if not in the current phase time range.
   */
  modifier onlyWhilePhaseActive {
    require(isActive());
    _;
  }

  /**
   * @dev Reverts if in the current phase time range.
   */
  modifier onlyWhilePhaseDeactive {
    require(!isActive());
    _;
  }

  constructor() internal {
      _phaseIndex = 0;
      _phaseStartTime = block.timestamp;
      _phaseEndTime = block.timestamp + 1;
      _phaseBonusRate = 0;
  }

  /**
   * @return phase start time.
   */
  function phaseStartTime() public view returns(uint256) {
    return _phaseStartTime;
  }

  /**
   * @return phase end time.
   */
  function phaseEndTime() public view returns(uint256) {
    return _phaseEndTime;
  }

  /**
   * @return phase bonus rate.
   */
  function phaseBonusRate() public view returns(uint256) {
    return _phaseBonusRate;
  }

  /**
   * @return true if the phase is active, false otherwise.
   */
  function isActive() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= _phaseStartTime && block.timestamp <= _phaseEndTime;
  }

  /**
   * @dev Sets phase variables
   * @param phaseStartTime Phase start time
   * @param phaseEndTime Phase end time
   * @param phaseBonusRate Phase bonus rate
   */
  function setPhase(
    uint256 phaseStartTime,
    uint256 phaseEndTime,
    uint256 phaseBonusRate
  )
    public
    onlyAdmin
    onlyWhilePhaseDeactive
  {
    // solium-disable-next-line security/no-block-members
    require(phaseStartTime >= block.timestamp);
    require(phaseEndTime > phaseStartTime);

    _phaseStartTime = phaseStartTime;
    _phaseEndTime = phaseEndTime;
    _phaseBonusRate = phaseBonusRate;

    _phaseIndex++;
  }

  /**
   * @dev Extend parent behavior requiring to be within contributing period
   * @param beneficiary Token purchaser
   * @param weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address beneficiary,
    uint256 weiAmount
  )
    internal
    onlyWhilePhaseActive
    view
  {
    super._preValidatePurchase(beneficiary, weiAmount);
  }
}
