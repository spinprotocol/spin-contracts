// openzeppelin-solidity/test/helpers/ether.js
function ether (n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = {
  ether,
};
