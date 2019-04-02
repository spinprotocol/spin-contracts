const SpinToken = artifacts.require("./SpinToken.sol");
const SpinCrowdsale = artifacts.require("./SpinCrowdsale.sol");
const SpinAirdrop = artifacts.require("./SpinAirdrop.sol");

const name = "SPIN Protocol";
const symbol = "SPIN";
const decimals = 18;
const initialSupply = 1075000000;

// TODO: Change this parameters in mainnet deployment
const rate = 10000  // 1 ETH = 10,000 SPIN token
const totalSaleCap = 100 * Math.pow(10, 18); // 100 ETH


/*************SPIN Token***************/
// Mainnet - Ethereum
// Mainnet deployment of SPIN Token contract
// @see https://etherscan.io/token/0x???
const SPIN_TOKEN_ADDRESS_MAINNET = '0x4f22310c27ef39feaa4a756027896dc382f0b5e2';

// Rinkeby & Ropsten - Ethereum
// Testnet deployment of SPIN Token contract
// @see https://ropsten.etherscan.io/token/0x7ece7ebea80de3f16e3c0a36b49739ccf17978ba
const SPIN_TOKEN_ADDRESS_ROPSTEN = '0x4f22310c27ef39feaa4a756027896dc382f0b5e2';
// @see https://rinkeby.etherscan.io/token/0xd97243b693c3173b165e975fc0bc1590e6acee15
const SPIN_TOKEN_ADDRESS_RINKEBY = '0xd97243b693c3173b165e975fc0bc1590e6acee15';

// Aspen - Klaytn
// Testnet deployment of SPIN Token contract
const SPIN_TOKEN_ADDRESS_ASPEN = '0x760e61a237adfe8169887e160eca8c2ca80e2aac';

// Deployer
const TokenContractDeployer = (deployer, network) => {
    deployer.deploy(SpinToken, name, symbol, decimals, initialSupply)
      .then( _ => console.log('SPIN Token contract has been deployed successfully.'));
};


/*************SPIN Crowdsale***************/
/*
  Mainnet - Ethereum
  Mainnet deployment of SPIN Crowdsale contract
  @see https://etherscan.io/0x

  Rinkeby & Ropsten - Ethereum
  Testnet deployment of SPIN Crowdsale contract
  @see https://ropsten.etherscan.io/0x31ae85cf5bd649d42b00094c8c1c919c3d9f5df1
  @see https://rinkeby.etherscan.io/0xb1a8b1597c32dae4a25fae75afbdffb1cc821d28

  Aspen - Klaytn
  Testnet deployment of SPIN Crowdsale contract
  SPIN_CROWDSALE_ADDRESS = '0xe24abde016cd48b867cb9da8aadde869b5f2df08';
*/

// Deployer
const SaleContractDeployer = (deployer, network) => {
  if (!process.env.FUND_COLLECTOR_ADDRESS) {
    throw new Error('FUND_COLLECTOR_ADDRESS environment variable is not set or empty!');
  }

  deployer.deploy(SpinCrowdsale, rate, process.env.FUND_COLLECTOR_ADDRESS, getTokenAddress(network), totalSaleCap)
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


/*************SPIN Airdrop***************/
/*
  Mainnet - Ethereum
  Mainnet deployment of SPIN Crowdsale contract
  @see https://etherscan.io/0x

  Rinkeby & Ropsten - Ethereum
  Testnet deployment of SPIN Airdrop contract
  @see https://ropsten.etherscan.io/
  @see https://rinkeby.etherscan.io/0x73239b5c1c8796f31c2ab2a540c6c2addc1b38d2

  Aspen - Klaytn
  Testnet deployment of SPIN Airdrop contract
  SPIN_AIRDROP_ADDRESS = '';
*/

// Airdrop Contract Deployer
const AirdropContractDeployer = (deployer, network) => {
  deployer.deploy(SpinAirdrop, getTokenAddress(network))
    .then( _ => console.log(`SPIN Airdrop contract has been deployed successfully on ${network}.`));
};


module.exports = (deployer, network) => {
  if (network === 'test') {
    console.log('Deployed contracts for unit testing on test network...');
    return;
  }

  // TokenContractDeployer(deployer, network);
  // SaleContractDeployer(deployer, network);
  AirdropContractDeployer(deployer, network);
}
