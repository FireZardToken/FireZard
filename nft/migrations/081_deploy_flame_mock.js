var FLAME_MOCK = artifacts.require("./mocks/FLAME_MOCK.sol");

module.exports = function(deployer, network, accounts) {
if((network === 'test')||(network === 'bsc_test')){
    deployer.deploy(FLAME_MOCK);
  }
}
