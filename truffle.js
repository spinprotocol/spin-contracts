require('dotenv').config();

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten');

const rinkeybProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('rinkeby');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    // development: {
    //   host: 'localhost',
    //   port: 8545,
    //   network_id: '*', // eslint-disable-line camelcase
    // },
    ropsten: {
      provider: ropstenProvider,
      network_id: 3, // eslint-disable-line camelcase
      // , gas: 4500000
      // , gasPrice : 10000000000
    },
    rinkeby: {
      provider: rinkeybProvider,
      network_id: 4, // eslint-disable-line camelcase
      // , gas: 6700000
      // , gasPrice: 10000000000
    },
    // coverage: {
    //   host: 'localhost',
    //   network_id: '*', // eslint-disable-line camelcase
    //   port: 8555,
    //   gas: 0xfffffffffff,
    //   gasPrice: 0x01,
    // },
    // ganache: {
    //   host: 'localhost',
    //   port: 7545,
    //   network_id: '*', // eslint-disable-line camelcase
    // }
  }
};
