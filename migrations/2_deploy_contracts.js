var BadiumERC20 = artifacts.require("./BadiumERC20.sol");

module.exports = function(deployer) {
  deployer.deploy(BadiumERC20);
};
