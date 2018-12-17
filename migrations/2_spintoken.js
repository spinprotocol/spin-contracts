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
// @see https://ropsten.etherscan.io/token/0x668d6d1a5be72dc477c630de38aaedc895e5019c
// @see https://rinkeby.etherscan.io/token/0x668d6d1a5be72dc477c630de38aaedc895e5019c
// const SPIN_TOKEN_ADDRESS = '0x668d6d1a5be72dc477c630de38aaedc895e5019c';

// Aspen - Klaytn
// Testnet deployment of SPIN Token contract
//  const SPIN_TOKEN_ADDRESS = '0x9ed6f09f2977944884d46c69f5c78929188dbec7';

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
// @see https://etherscan.io/token/0x
// const SPIN_CROWDSALE_ADDRESS = '';

// Rinkeby & Ropsten - Ethereum
// Testnet deployment of SPIN Crowdsale contract
// @see https://ropsten.etherscan.io/token/0x85bbaffb26e22f185ab75f730c06d507c8862241
// @see https://rinkeby.etherscan.io/token/0x289451Ad811c7091aba0Ae313afE126a75cBE62D
// const SPIN_CROWDSALE_ADDRESS = '0x289451Ad811c7091aba0Ae313afE126a75cBE62D';

// Aspen - Klaytn
// Testnet deployment of SPIN Crowdsale contract
// const SPIN_CROWDSALE_ADDRESS = '0x377e188453818a5b55641ccdc8f253f5314d003f';

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
