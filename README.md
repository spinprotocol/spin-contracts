# spin-contracts
Smart-contracts for SPIN Protocol platform


## Deployment
1. First uncomment the deployer function corresponds to the contract you want to deploy and comment out all the others in `migrations/2_spintoken.js` file (line 88 or line 89).
2. Set mnemonic words for deployer in your command line as follows;
`export MNEMONICS="<mnemonic_words>"`
3. And set your infura project secret key as follows;
`export INFURA_API_KEY="<infura_project_secret>"`
4. Also set fund collector address as follows;
`export FUND_COLLECTOR_ADDRESS="<fund_collector_address>"`
5. Finally deploy the contract on the network you desire
`NETWORK=<network_name> truffle test ./test/<filename>`


## Test
* In order to run the whole tests
`truffle test`
* In order to run only specific test file
