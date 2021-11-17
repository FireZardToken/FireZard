var RNG = artifacts.require("./RNG.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(RNG, (network === 'test'));
};
