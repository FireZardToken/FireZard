var Manager = artifacts.require("./CrossContractMan.sol");

module.exports = function(deployer) {
  deployer.deploy(Manager);
};
