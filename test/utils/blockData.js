async function getCurrentTimestamp() {
    return await web3.eth.getBlock('latest').timestamp;
}


module.exports = {
    getCurrentTimestamp,
}