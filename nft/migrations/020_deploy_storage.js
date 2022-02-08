const Manager = artifacts.require("./CrossContractMan.sol");
const TagStorage = artifacts.require("./TagStorage.sol");

module.exports = function(deployer) {
    return Manager.deployed().then(async (manager) =>{
	const res = await deployer.deploy(TagStorage);
	const tag = await TagStorage.deployed();
	await manager.addContract('TagStorage',tag.address);
	return res;
    });
};
