const Manager = artifacts.require("./CrossContractMan.sol");
const Distrib = artifacts.require("StatsDistrib");

module.exports = function(deployer, network, accounts) {
    return Manager.deployed().then(async (manager) =>{
	const res = await deployer.deploy(Distrib);
	const distrib = await Distrib.deployed();
	await distrib.grantRole(await distrib.MANAGER_ROLE(),manager.address);
	await manager.addContract(distrib.address);
	return res;
    });
};
