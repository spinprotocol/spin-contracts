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


/*************SPIN Token***************/
// Mainnet - Ethereum
// Mainnet deployment of SPIN Token contract
// @see https://etherscan.io/token/0x???
const SPIN_TOKEN_ADDRESS_MAINNET = '';

// Rinkeby & Ropsten - Ethereum
// Testnet deployment of SPIN Token contract
// @see https://ropsten.etherscan.io/token/0x7ece7ebea80de3f16e3c0a36b49739ccf17978ba
const SPIN_TOKEN_ADDRESS_ROPSTEN = '0x7ece7ebea80de3f16e3c0a36b49739ccf17978ba';
// @see https://rinkeby.etherscan.io/token/0xd97243b693c3173b165e975fc0bc1590e6acee15
const SPIN_TOKEN_ADDRESS_RINKEBY = '0xd97243b693c3173b165e975fc0bc1590e6acee15';

// Aspen - Klaytn
// Testnet deployment of SPIN Token contract
const SPIN_TOKEN_ADDRESS_ASPEN = '0x760e61a237adfe8169887e160eca8c2ca80e2aac';

// Deployer
const TokenContractDeployer = (deployer, network) => {
  if (network === 'ropsten' || network === 'rinkeby' || network === 'kovan' || network === 'klaytn-aspen') {
    deployer.deploy(SpinToken, name, symbol, decimals, initialSupply)
      .then( _ => console.log('SPIN Token contract has been deployed successfully.'));
  } else if (network === 'mainnet') {
    // TODO: Implement
  } else {
    throw new Error('Unknown network!');
  }
};


/*************SPIN Crowdsale***************/
// Mainnet - Ethereum
// Mainnet deployment of SPIN Crowdsale contract
// @see https://etherscan.io/0x
// const SPIN_CROWDSALE_ADDRESS = '';

// Rinkeby & Ropsten - Ethereum
// Testnet deployment of SPIN Crowdsale contract
// @see https://ropsten.etherscan.io/0x397427ef2608a64421c8888cc73c87a22d434281
// const SPIN_CROWDSALE_ADDRESS = '0x397427ef2608a64421c8888cc73c87a22d434281';
// @see https://rinkeby.etherscan.io/0xb4ad4e4987ac8e3d8dbbaaf1f6ebb45967bb4549
// const SPIN_CROWDSALE_ADDRESS = '0xb4ad4e4987ac8e3d8dbbaaf1f6ebb45967bb4549';

// Aspen - Klaytn
// Testnet deployment of SPIN Crowdsale contract
// const SPIN_CROWDSALE_ADDRESS = '0x4b4b01b4df66f592e91d85432f45ec8becf58655';

// Deployer
const SaleContractDeployer = (deployer, network) => {
  deployer.deploy(SpinCrowdsale, rate, wallet, getTokenAddress(network), totalSaleCap)
    .then( _ => console.log(`SPIN Crowdsale contract has been deployed successfully on ${network}.`));
};

function getTokenAddress(network) {
  switch (network) {
    case 'mainnet':
    case 'homestead':
      return SPIN_TOKEN_ADDRESS_MAINNET;
    case 'ropsten':
      return SPIN_TOKEN_ADDRESS_ROPSTEN;
    case 'rinkeby':
      return SPIN_TOKEN_ADDRESS_RINKEBY;
    case 'kovan':
      return SPIN_TOKEN_ADDRESS_KOVAN;
    case 'klaytn-aspen':
      return SPIN_TOKEN_ADDRESS_ASPEN;
    default:
      throw new Error('Unknown network!');
  }
}

module.exports = (deployer, network) => {
  // TokenContractDeployer(deployer, network);
  SaleContractDeployer(deployer, network);
}
