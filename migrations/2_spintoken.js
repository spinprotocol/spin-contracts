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
// Mainnet - Ethereum
// Mainnet deployment of SPIN Token contract
// @see https://etherscan.io/token/0x???
// const SPIN_TOKEN_ADDRESS = '';

// Rinkeby & Ropsten - Ethereum
// Testnet deployment of SPIN Token contract
// @see https://ropsten.etherscan.io/token/0x7ece7ebea80de3f16e3c0a36b49739ccf17978ba
// const SPIN_TOKEN_ADDRESS = '0x7ece7ebea80de3f16e3c0a36b49739ccf17978ba';
// @see https://rinkeby.etherscan.io/token/0xd97243b693c3173b165e975fc0bc1590e6acee15
// const SPIN_TOKEN_ADDRESS = '0xd97243b693c3173b165e975fc0bc1590e6acee15';

// Aspen - Klaytn
// Testnet deployment of SPIN Token contract
// const SPIN_TOKEN_ADDRESS = '0x760e61a237adfe8169887e160eca8c2ca80e2aac';

// Deployer
// module.exports = (deployer, network) => {
//   if (network === 'ropsten' || network === 'rinkeby' || network === 'kovan' || network === 'klaytn-aspen') {
//     deployer.deploy(SpinToken, name, symbol, decimals, initialSupply)
//       .then( _ => console.log('SPIN Token contract has been deployed successfully.'));
//   } else if (network === 'mainnet') {
//     // TODO: Implement
//   } else {
//     console.error('Unknown network!');
//   }
// };


/*************SPIN Crowdsale***************/
// Mainnet - Ethereum
// Mainnet deployment of SPIN Crowdsale contract
// @see https://etherscan.io/0x
// const SPIN_CROWDSALE_ADDRESS = '';

// Rinkeby & Ropsten - Ethereum
// Testnet deployment of SPIN Crowdsale contract
// @see https://ropsten.etherscan.io/0xce30c5b548826dc33a670a30f6a301efe129acba
// const SPIN_CROWDSALE_ADDRESS = '0xce30c5b548826dc33a670a30f6a301efe129acba';
// @see https://rinkeby.etherscan.io/0x440face1e4b497466057352d69e208b7b0025de4
// const SPIN_CROWDSALE_ADDRESS = '0x440face1e4b497466057352d69e208b7b0025de4';

// Aspen - Klaytn
// Testnet deployment of SPIN Crowdsale contract
// const SPIN_CROWDSALE_ADDRESS = '0xeb23ae93c72c4318bda376362fa1f7206cda91a8';

// Deployer
// module.exports = (deployer, network) => {
//   if (network === 'ropsten' || network === 'rinkeby' || network === 'kovan' || network === 'klaytn-aspen') {
//     deployer.deploy(SpinCrowdsale, rate, wallet, SPIN_TOKEN_ADDRESS, totalSaleCap)
//     .then( _ => console.log('SPIN Crowdsale contract has been deployed successfully.'));
//   } else if (network === 'mainnet') {
//     // TODO: Implement
//   } else {
//     console.error('Unknown network!');
//   }
// };
