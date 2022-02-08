const Manager = artifacts.require("./CrossContractMan.sol");
const FLAME_MOCK = artifacts.require("./mocks/FLAME_MOCK.sol");

module.exports = function(deployer, network, accounts) {
if((network === 'test')||(network === 'bsc_test')){
    return Manager.deployed().then(async (manager) =>{
	const res = await deployer.deploy(FLAME_MOCK);
	const flame = await FLAME_MOCK.deployed();
	await manager.addContract('FLAME',flame.address);
	return res;
    });
  }
}
