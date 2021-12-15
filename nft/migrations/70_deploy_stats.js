const Util    = artifacts.require("Util");
const Distrib = artifacts.require("StatsDistrib");
const Stats   = artifacts.require("DragonStats");

module.exports = function(deployer, network, accounts){
    return Distrib.deployed().then(async (distrib) =>{
	await deployer.link(Util, Stats);
	return await deployer.deploy(Stats, distrib.address);
    });
};
