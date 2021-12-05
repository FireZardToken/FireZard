const Distrib = artifacts.require("StatsDistrib");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Distrib);
};
