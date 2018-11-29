# spin-contracts
Smart-contracts for SPIN Protocol platform


## Deployment
1. First uncomment the deployer function corresponds to the contract you want to deploy and comment out all the others in `migrations/2_spintoken.js` file.
2. If the project folder includes `build` folder, first delete it
3. Compile the corresponding contract as follows;
`truffle compile`
4. Set mnemonic words for deployer in your command line as follows;
`export MNEMONICS="<mnemonic_words>"`
5. And set your infura project secret key as follows;
`export INFURA_API_KEY="<infura_project_secret>"`
6. Also set fund collector address as follows;
`export FUND_COLLECTOR_ADDRESS="<fund_collector_address>"`
7. Finally deploy the contract on the network you desire
`truffle migrate --network <network_name>`


## Test
* First uncomment local testnet deployer function and comment out all the other functions in `migrations/2_spintoken.js` file.
* In order to run the whole tests
`truffle test`
* In order to run only specific test file
`truffle test ./test/<filename>`
