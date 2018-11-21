const SpinToken = artifacts.require("./SpinToken.sol");

const name = "SPIN Protocol";
const symbol = "SPIN";
const decimals = 18;
const initialSupply = 1250000000;

// Local testnet deployer
module.exports = function(deployer) {
  // Leave this blank to run unit tests
}

/*************SPIN Token***************/
// Mainnet
// Mainnet deployment of SPIN Token contract
// @see https://etherscan.io/token/0x???
// const SPIN_TOKEN_ADDRESS = '';

// Ropsten
// Testnet deployment of SPIN Token contract
// @see https://ropsten.etherscan.io/token/0xd3bac9db564f649b756acbce5cb24471d39b13b5
// const SPIN_TOKEN_ADDRESS = '0xd3bac9db564f649b756acbce5cb24471d39b13b5';

// Rinkeby
// Testnet deployment of SPIN Token contract
// @see https://rinkeby.etherscan.io/token/0xd3bac9db564f649b756acbce5cb24471d39b13b5
// const SPIN_TOKEN_ADDRESS = '0xd3bac9db564f649b756acbce5cb24471d39b13b5';

// Testnet Deployer
// module.exports = (deployer) => {
//   deployer.deploy(SpinToken, name, symbol, decimals, initialSupply)
//     .then( _ => console.log('SPIN Token contract has been deployed successfully.'));
// };


// Notice that in mainnet deployments, we set a delay before resolving the deployer.deploy() fucntion
// because, the transactions are not immediately available even if they are mined
// at that specific time. Therefore we need to wait a while until the tx is available.
// The delay period is not certain, set by trial!!!

// Mainnet deployer of SPIN Token contract
// module.exports = (deployer, network, accounts) => {
//     deployer.deploy(SpinToken, accounts[0])
//         .then( _ => console.log('SPIN Token contract has been deployed successfully.'));
// };