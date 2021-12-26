var RNG = artifacts.require("./RNG.sol");
var Util = artifacts.require("./Util.sol");

module.exports = function(deployer, network, accounts) {
  deployer.link(Util, RNG);
  deployer.deploy(RNG, (network === 'test')||(network === 'develop'));
};