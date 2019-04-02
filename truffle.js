const HDWalletProvider = require('truffle-hdwallet-provider');


const providerFactory = network => new HDWalletProvider(
  process.env.MNEMONICS || '',                                  // Mnemonic of the deployer
  `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`  // Provider URL => web3.HttpProvider
);


module.exports = {
  networks: {
    'mainnet': {
      provider: providerFactory('mainnet'),
      network_id: 1,
      gas: 7000000,
      gasPrice: 50000000000 // 100 Gwei, Change this value according to price average of the deployment time
    },
    'ropsten': {
      provider: providerFactory('ropsten'),
      network_id: 3,
      gas: 6000000,
      gasPrice: 50000000000 // 50 Gwei
    },
    'rinkeby': {
      provider: providerFactory('rinkeby'),
      network_id: 4,
      gas: 6000000,
      gasPrice: 50000000000 // 50 Gwei
    },
    'kovan': {
      provider: providerFactory('kovan'),
      network_id: 42,
      gas: 6000000,
      gasPrice: 50000000000  // 50 Gwei
    },
    'klaytn-aspen': { // The Aspen node should be runing on the local and also the account should be unlocked
      host: '127.0.0.1',
      port: 8551,
      network_id: '1000',
      gas: 6000000,
      gasPrice: 25000000000, // 25 Gpeb is fixed for Aspen, any other gas price will cause a rejection
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
