pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/SafeErc20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "./ERC1132.sol";

contract SpinToken is ERC20Detailed, ERC20Mintable, ERC20Pausable, ERC20Burnable, ERC1132 {
  using SafeERC20 for IERC20;

  /**
   * @dev Set Ethereum Unit
   * see http://ethdocs.org/en/latest/ether.html#denominations
   */
  uint256 private constant _UNIT = 10 ** uint256(dedimals());

  /**
   * @dev Error messages for require statements
   */
  string internal constant _ALREADY_LOCKED = 'Tokens already locked';
  string internal constant _NOT_LOCKED = 'No tokens locked';
  string internal constant _AMOUNT_ZERO = 'Amount can not be 0';

  /**
   * @dev constructor to mint initial tokens
   * @param name
   * @param symbol
   * @param decimals
   * @param initialSupply
   */
  constructor(
    string name,
    string symbol,
    uint8 decimals,
    uint256 initialSupply
  )
    ERC20Detailed(name, symbol, decimals)
    public
  {
    // Mint the initial supply
    require(initialSupply > 0, "initialSupply must be greater than zero.");
    mint(msg.sender, initialSupply * _UNIT);
  }

  /**
   * @dev Locks a specified amount of tokens against an address,
   *      for a specified reason and time
   * @param reason The reason to lock tokens
   * @param amount Number of tokens to be locked
   * @param time Lock time in seconds
   */
  function lock(bytes32 reason, uint256 amount, uint256 time)
    public
    returns (bool)
  {
    uint256 validUntil = now.add(time);

    // 토큰이 이미 잠겼으면, extendLock 또는 increaseLockAmount 함수를 이용한다
    require(tokenLocked(msg.sender, reason) == 0, _ALREADY_LOCKED);
    require(amount != 0, _AMOUNT_ZERO);

    if (locked[msg.sender][reason].amount == 0) {
      lockReason[msg.sender].push(reason);
    }

    transfer(address(this), amount);

    locked[msg.sender][reason] = lockToken(amount, validUntil, false);

    emit Locked(msg.sender, reason, amount, validUntil);
    return true;
  }

  /**
   * @dev Returns tokens locked for a specified address for a specified reason
   * @param of The address whose tokens are locked
   * @param reason The reason to query the lock tokens for
   */
  function tokensLocked(address of, bytes32 reason)
    public
    view
    returns (uint256 amount)
  {
    if (!locked[of][reason].claimed) {
      amount = locked[of][reason].amount;
    }
  }

  /**
   * @dev Returns tokens locked for a specified address for a
   *      specified reason at a specific time
   * @param of The address whose tokens are locked
   * @param reason The reason to query the lock tokens for
   * @param time The timestamp to query the lock tokens for
   */
  function tokensLockedAtTime(address of, bytes32 reason, uint256 time)
    public
    view
    returns (uint256 amount)
  {
    if (locked[of][reason].validity > time) {
      amount = locked[of][reason].amount;
    }
  }

  /**
   * @dev Returns total tokens held by an address (locked + transferable)
   * @param of The address to query the total balance of
   */
  function totalBalanceOf(address of)
    public
    view
    returns (uint256 amount)
  {
    amount = balanceOf(_of);

    for (uint256 i = 0; i < lockReason[of].length; i++) {
      amount = amount.add(tokensLocked(of, lockReason[of][i]));
    }
  }

  /**
   * @dev Extends lock for a specified reason and time
   * @param reason The reason to lock tokens
   * @param time Lock extension time in seconds
   */
  function extendLock(bytes32 reason, uint256 time)
    public
    returns (bool)
  {
    require(tokensLocked(msg.sender, reason) > 0, _NOT_LOCKED);

    locked[msg.sender][reason].validity = locked[msg.sender][reason].validity.add(time);

    emit Locked(msg.sender, reason, locked[msg.sender][reason].amount, locked[msg.sender][reason].validity);
    return true;
  }

  /**
   * @dev Increase number of tokens locked for a specified reason
   * @param reason The reason to lock tokens
   * @param amount Number of tokens to be increased
   */
  function increaseLockAmount(bytes32 reason, uint256 amount)
      public
      returns (bool)
  {
      require(tokensLocked(msg.sender, reason) > 0, NOT_LOCKED);
      transfer(address(this), amount);

      locked[msg.sender][reason].amount = locked[msg.sender][reason].amount.add(amount);

      emit Locked(msg.sender, reason, locked[msg.sender][reason].amount, locked[msg.sender][reason].validity);
      return true;
  }

  /**
   * @dev Returns unlockable tokens for a specified address for a specified reason
   * @param of The address to query the the unlockable token count of
   * @param reason The reason to query the unlockable tokens for
   */
  function tokensUnlockable(address of, bytes32 reason)
    public
    view
    returns (uint256 amount)
  {
    if (locked[of][reason].validity <= now && !locked[of][reason].claimed) {  //solhint-disable-line
      amount = locked[of][reason].amount;
    }
  }

  /**
   * @dev Unlocks the unlockable tokens of a specified address
   * @param of Address of user, claiming back unlockable tokens
   */
  function unlock(address of)
    public
    returns (uint256 unlockableTokens)
  {
    uint256 lockedTokens;

    for (uint256 i = 0; i < lockReason[of].length; i++) {
      lockedTokens = tokensUnlockable(of, lockReason[of][i]);
      if (lockedTokens > 0) {
        unlockableTokens = unlockableTokens.add(lockedTokens);
        locked[of][lockReason[of][i]].claimed = true;
        emit Unlocked(of, lockReason[of][i], lockedTokens);
      }
    }

    if (unlockableTokens > 0) {
      this.transfer(of, unlockableTokens);
    }
  }

  /**
   * @dev Gets the unlockable tokens of a specified address
   * @param of The address to query the the unlockable token count of
   */
  function getUnlockableTokens(address of)
    public
    view
    returns (uint256 unlockableTokens)
  {
    for (uint256 i = 0; i < lockReason[of].length; i++) {
      unlockableTokens = unlockableTokens.add(tokensUnlockable(of, lockReason[of][i]));
    }
  }


  /**
   * @dev Transfers and Locks a specified amount of tokens,
   *      for a specified reason and time
   * @param to adress to which tokens are to be transfered
   * @param reason The reason to lock tokens
   * @param amount Number of tokens to be transfered and locked
   * @param time Lock time in seconds
   */
  function transferWithLock(address to, bytes32 reason, uint256 amount, uint256 time)
    public
    returns (bool)
  {
    uint256 validUntil = now.add(time); //solhint-disable-line

    require(tokensLocked(to, reason) == 0, _ALREADY_LOCKED);
    require(amount != 0, _AMOUNT_ZERO);

    if (locked[to][reason].amount == 0)
        lockReason[to].push(reason);

    transfer(address(this), amount);

    locked[to][reason] = lockToken(amount, validUntil, false);

    emit Locked(to, reason, amount, validUntil);
    return true;
  }
}
