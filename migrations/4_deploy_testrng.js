var TestRNG = artifacts.require("./TestRNG.sol");
var Util = artifacts.require("./FireZardUtil.sol");

module.exports = function(deployer, network, accounts) {
  if(network === 'test'){
    deployer.link(Util, TestRNG);
    deployer.deploy(TestRNG);
  }
};
