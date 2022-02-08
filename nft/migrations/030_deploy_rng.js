const Manager = artifacts.require("./CrossContractMan.sol");
const RNG = artifacts.require("./RNG.sol");
const Util = artifacts.require("./Util.sol");

module.exports = function(deployer, network, accounts) {
  return Manager.deployed().then(async (manager) =>{
	await deployer.link(Util, RNG);
	const res = await deployer.deploy(RNG, (network === 'test')||(network === 'develop'));
	const rng = await RNG.deployed();
	await rng.grantRole(await rng.MANAGER_ROLE(),manager.address);
	await manager.addContract(rng.address);
	return res;
    });
};
