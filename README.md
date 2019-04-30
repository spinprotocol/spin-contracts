# spin-contracts
Smart-contracts for SPIN Protocol platform


## Deployment - Ethereum
1. First uncomment the deployer function corresponds to the contract you want to deploy and comment out all the others in `migrations/2_spintoken.js` file.
2. If the project folder includes `build` folder, first delete it
3. Compile the corresponding contract as follows;
`truffle compile`
4. Set mnemonic words for deployer in your command line as follows;
`export MNEMONICS="<mnemonic_words>"`
3. And set your infura project secret key as follows;
`export INFURA_API_KEY="<infura_project_secret>"`
4. Also set fund collector address as follows;
`export FUND_COLLECTOR_ADDRESS="<fund_collector_address>"`
5. Finally deploy the contract on the network you desire
`NETWORK=<network_name> npm run deploy`


## Deployment - Kalytn
1. First uncomment the deployer function corresponds to the contract you want to deploy and comment out all the others in `migrations/2_spintoken.js` file.
2. If the project folder includes `build` folder, first delete it
3. Compile the corresponding contract as follows;
`truffle compile`
4. Set privatekey words for deployer in your command line as follows;
`export PRIVATEKEY="<private_key>"`
5. Finally deploy the contract on the network you desire
`truffle migrate --network <network_name>`


## Test
* In order to run the whole tests
`truffle test`
* In order to run only specific test file
