const Manager = artifacts.require("./CrossContractMan.sol");
const Util    = artifacts.require("Util");
const Stats   = artifacts.require("DragonStats");

module.exports = function(deployer, network, accounts){
	return Manager.deployed().then(async (manager) =>{
	    await deployer.link(Util, Stats);
	    const res = await deployer.deploy(Stats);
	    const stats = await Stats.deployed();
	    await stats.grantRole(await stats.MANAGER_ROLE(),manager.address);
	    await manager.addContract(stats.address);
	    return res;
	});
};
