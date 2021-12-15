var TestRNG = artifacts.require("./TestRNG.sol");
var Util = artifacts.require("./Util.sol");

module.exports = function(deployer, network, accounts) {
  if((network === 'test')||(network === 'develop')){
    deployer.link(Util, TestRNG);
    deployer.deploy(TestRNG);
  }
};
