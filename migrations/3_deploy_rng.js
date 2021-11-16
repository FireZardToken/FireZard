var RNG = artifacts.require("./RNG.sol");

module.exports = function(deployer) {
  deployer.deploy(RNG,true);
};
