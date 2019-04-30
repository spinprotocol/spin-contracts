const HDWalletProvider = require('truffle-hdwallet-provider');
const PrivateKeyConnector = require('connect-privkey-to-provider');

const providerFactory4Ethereum = network => new HDWalletProvider(
  process.env.MNEMONICS || '',                                  // Mnemonic of the deployer
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`  // Provider URL => web3.HttpProvider
);

const providerFactory4Klaytn = network => new PrivateKeyConnector(
  process.env.PRIVATEKEY || '',
  `https://api.${network}.klaytn.net:8651`
);

module.exports = {
  networks: {
    /**
     * Ethereum Network
     */
    'mainnet': {
      provider: providerFactory4Ethereum('mainnet'),
      network_id: 1,
      gas: 8000000,
      gasPrice: 100000000000 // 100 Gwei, Change this value according to price average of the deployment time
    },
    'ropsten': {
      provider: providerFactory4Ethereum('ropsten'),
      network_id: 3,
      gas: 6000000,
      gasPrice: 50000000000 // 50 Gwei
    },
    'rinkeby': {
      provider: providerFactory4Ethereum('rinkeby'),
      network_id: 4,
      gas: 6000000,
      gasPrice: 50000000000 // 50 Gwei
    },
    'kovan': {
      provider: providerFactory4Ethereum('kovan'),
      network_id: 42,
      gas: 6000000,
      gasPrice: 50000000000  // 50 Gwei
    },

    /**
     * Klaytn Network
     */
    'klaytn-baobab': {
      provider: providerFactory4Klaytn('baobab'),
      port: 8651,
      network_id: '1001',
      gas: 20000000,
      gasPrice: null,
    },
    'klaytn-mainnet': {
      provider: providerFactory4Klaytn('baobab'),
      port: 8651,
      network_id: '1001',
      gas: 20000000,
      gasPrice: null,
    },
  },
  mocha: {
    useColors: true,
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      gasPrice: 21
    }
  }
};
