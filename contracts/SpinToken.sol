pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/SafeErc20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";

contract SpinToken is ERC20Detailed, ERC20Mintable, ERC20Pausable, ERC20Burnable {
  using SafeERC20 for IERC20;

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
    _mint(msg.sender, initialSupply);
  }
}
