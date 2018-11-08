const SpinToken = artifacts.require("./SpinToken.sol");

const WEI = 10**18;

const name = "SPIN Protocol";
const symbol = "SPIN";
const decimals = 18;
const initialSupply = 1250000000 * WEI;

module.exports = function(deployer) {
  deployer.deploy(SpinToken, name, symbol, decimals, initialSupply);
}
