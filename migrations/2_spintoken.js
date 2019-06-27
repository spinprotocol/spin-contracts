const SpinToken = artifacts.require("./SpinToken.sol");
const SpinCrowdsale = artifacts.require("./SpinCrowdsale.sol");
const SpinAirdrop = artifacts.require("./SpinAirdrop.sol");

const name = "SPIN Protocol";
const symbol = "SPIN";
const decimals = 18;
const initialSupply = 1075000000;

// TODO: Change this parameters in mainnet deployment
const rate = 21935.9375  // 1 ETH = 21,935.9375 SPIN token
const totalSaleCap = 2279.36463 * Math.pow(10, 18); // 2,279.36463 ETH
const wallet = process.env.FUND_COLLECTOR_ADDRESS;


/************* SPIN Token deployed information ***************/

// Mainnet - Ethereum
// @see https://etherscan.io/token/0x???
const SPIN_TOKEN_ADDRESS_MAINNET = '0x4f22310c27ef39feaa4a756027896dc382f0b5e2';

// Rinkeby - Ethereum
// @see https://ropsten.etherscan.io/token/0x7ece7ebea80de3f16e3c0a36b49739ccf17978ba
const SPIN_TOKEN_ADDRESS_ROPSTEN = '0x7ece7ebea80de3f16e3c0a36b49739ccf17978ba';

// Ropsten - Ethereum
// @see https://rinkeby.etherscan.io/token/0xd97243b693c3173b165e975fc0bc1590e6acee15
const SPIN_TOKEN_ADDRESS_RINKEBY = '0xd97243b693c3173b165e975fc0bc1590e6acee15';

// Mainnet - Klaytn
// @see https://baobab.klaytnscope.com/account/0x
const SPIN_TOKEN_ADDRESS_KLAYTN_MAINNET = '';

// Baobab - Klaytn
// @see https://baobab.klaytnscope.com/account/0x6071bacfea19df27cd685c9f957a6a19376a62ad
const SPIN_TOKEN_ADDRESS_BAOBAB = '0x6071bacfea19df27cd685c9f957a6a19376a62ad';
// before: 0x91d47fe9c5d892851060d6db6b31d264bb8a4d1b

// Aspen - Klaytn
// @see https://baobab.klaytnscope.com/account/0x760e61a237adfe8169887e160eca8c2ca80e2aac
const SPIN_TOKEN_ADDRESS_ASPEN = '0x760e61a237adfe8169887e160eca8c2ca80e2aac';

// Deployer
const TokenContractDeployer = (deployer, network) => {
  if (network === 'ropsten' || network === 'rinkeby' || network === 'kovan' || network === 'klaytn-baobab') {
    deployer.deploy(SpinToken, name, symbol, decimals, initialSupply)
      .then( _ => console.log('SPIN Token contract has been deployed successfully.'));
  } else if (network === 'mainnet' || network === 'klaytn-mainnet') {
    // TODO: Implement
  } else {
    throw new Error('Unknown network!');
  }
};

/*************************************************************/


/************* SPIN Crowdsale deployed information ***************/

// Mainnet - Ethereum
// @see https://etherscan.io/0x
// const SPIN_CROWDSALE_ADDRESS = '';

// Rinkeby - Ethereum
// @see https://ropsten.etherscan.io/0x289451ad811c7091aba0ae313afe126a75cbe62d
// const SPIN_CROWDSALE_ADDRESS = '0x289451ad811c7091aba0ae313afe126a75cbe62d';

// Ropsten - Ethereum
// @see https://rinkeby.etherscan.io/0x3e1d06f5895db0eb24ce9b029a9e771a7878c798
// const SPIN_CROWDSALE_ADDRESS = '0x3e1d06f5895db0eb24ce9b029a9e771a7878c798';

// Aspen - Klaytn
// const SPIN_CROWDSALE_ADDRESS = '0xe24abde016cd48b867cb9da8aadde869b5f2df08';

// Baobab - Klaytn
// const SPIN_CROWDSALE_ADDRESS = '0xf918d63643c86c6f51d1930cdf166d97382adb89';

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
    case 'klaytn-baobab':
      return SPIN_TOKEN_ADDRESS_BAOBAB;
    case 'klaytn-mainnet':
      return SPIN_TOKEN_ADDRESS_KLAYTN_MAINNET;
    default:
      throw new Error('Unknown network!');
  }
}


/************* SPIN Airdrop deployed information ***************/

// Baobab - Klaytn
// const SPIN_AIRDROP_ADDRESS = '0xf04bc4b0f3335541884b148d389a94bf97abba8b';

// Deployer
const AirdropContractDeployer = (deployer, network) => {
  deployer.deploy(SpinAirdrop, getTokenAddress(network))
    .then( _ => console.log(`SPIN Airdrop contract has been deployed successfully on ${network}.`));
};



/*****************************************************************/

module.exports = (deployer, network) => {
  /**
   * Token contract deploy.
   */
  // TokenContractDeployer(deployer, network);

  /**
   * Sale contract deploy.
   */
  // SaleContractDeployer(deployer, network);

  /**
   * Sale contract deploy.
   */
  AirdropContractDeployer(deployer, network);
}
