const Manager = artifacts.require("./CrossContractMan.sol");
const Util   = artifacts.require("Util");
//const NFT    = artifacts.require("FireZardNFT");
//const Stats  = artifacts.require("DragonStats");
//const Viewer  = artifacts.require("StatsView");
const Treasury  = artifacts.require("Treasury");
const TAG    = artifacts.require("TagStorage");

module.exports = function(deployer, network, accounts) {
/*	return Viewer.deployed().then( (viewer) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, Treasury);
		    var treasury = await deployer.deploy(Treasury, nft.address, viewer.address, stats.address);
		    return treasury;
		});
	    });
	});*/
    return Manager.deployed().then(async (manager) =>{
	await deployer.link(Util, Treasury);
	const res = await deployer.deploy(Treasury);
	const treasury = await Treasury.deployed();
	const tag = await TAG.deployed();
	await treasury.grantRole(await treasury.MANAGER_ROLE(),manager.address);
	await tag.grantAdderRole(treasury.address);
	await tag.addEditor2Group(treasury.address,10);
	await manager.addContract(treasury.address);
	return res;
    });
};
