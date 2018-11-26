require('dotenv').config();

const SpinToken = artifacts.require("./SpinToken.sol");
const SpinCrowdsale = artifacts.require("./SpinCrowdsale.sol");

const name = "SPIN Protocol";
const symbol = "SPIN";
const decimals = 18;
const initialSupply = 1250000000;

// TODO: Change this parameters in mainnet deployment
const rate = 10000  // 1 ETH = 10,000 SPIN token
const wallet = process.env.FUND_COLLECTOR_ADDRESS;
const totalSaleCap = 100 * Math.pow(10, 18); // 100 ETH

// Local testnet deployer
module.exports = function(deployer) {
  // Leave this blank to run unit tests
}

/*************SPIN Token***************/
// Mainnet
// Mainnet deployment of SPIN Token contract
// @see https://etherscan.io/token/0x???
// const SPIN_TOKEN_ADDRESS = '';

// Ropsten & Ropsten
// Testnet deployment of SPIN Token contract
// @see https://ropsten.etherscan.io/token/0x668d6d1a5be72dc477c630de38aaedc895e5019c
// @see https://rinkeby.etherscan.io/token/0x668d6d1a5be72dc477c630de38aaedc895e5019c
// const SPIN_TOKEN_ADDRESS = '0x668d6d1a5be72dc477c630de38aaedc895e5019c';

// Deployer
// module.exports = (deployer) => {
//   if (network === 'ropsten' || network === 'rinkeby' || network === 'kovan') {
//     deployer.deploy(SpinToken, name, symbol, decimals, initialSupply)
//       .then( _ => console.log('SPIN Token contract has been deployed successfully.'));
//   } else if (network === 'mainnet') {
//     // TODO: Implement
//   } else {
//     console.error('Unknown network!');
//   }
// };


/*************SPIN Crowdsale***************/
// Mainnet
// Mainnet deployment of SPIN Crowdsale contract
// @see https://etherscan.io/token/0x
// const SPIN_CROWDSALE_ADDRESS = '';

// Ropsten
// Testnet deployment of SPIN Crowdsale contract
// @see https://ropsten.etherscan.io/token/0x40a5aed3788279c1af41ee80c3c759f47ccbec6a
// @see https://rinkeby.etherscan.io/token/0x40a5aed3788279c1af41ee80c3c759f47ccbec6a
// const SPIN_CROWDSALE_ADDRESS = '0x40a5aed3788279c1af41ee80c3c759f47ccbec6a';

// Deployer
// module.exports = (deployer, network) => {
//   if (network === 'ropsten' || network === 'rinkeby' || network === 'kovan') {
//     deployer.deploy(SpinCrowdsale, rate, wallet, SPIN_TOKEN_ADDRESS, totalSaleCap)
//     .then( _ => console.log('SPIN Crowdsale contract has been deployed successfully.'));
//   } else if (network === 'mainnet') {
//     // TODO: Implement
//   } else {
//     console.error('Unknown network!');
//   }
// };
