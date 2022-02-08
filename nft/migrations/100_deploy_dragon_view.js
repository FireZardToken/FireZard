const Manager = artifacts.require("./CrossContractMan.sol");
const Util   = artifacts.require("Util");
//const NFT    = artifacts.require("FireZardNFT");
//const Stats  = artifacts.require("DragonStats");
//const Viewer  = artifacts.require("StatsView");
const DragonViewer  = artifacts.require("DragonCardView");

module.exports = function(deployer, network, accounts) {
/*	return Viewer.deployed().then( (viewer) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, DragonViewer);
		    var dragonViewer = await deployer.deploy(DragonViewer, viewer.address, nft.address, stats.address);
		    return dragonViewer;
		});
	    });
	});*/
    return Manager.deployed().then(async (manager) =>{
	await deployer.link(Util, DragonViewer);
	const res = await deployer.deploy(DragonViewer);
	const dragonViewer = await DragonViewer.deployed();
	await dragonViewer.grantRole(await dragonViewer.MANAGER_ROLE(),manager.address);
	await manager.addContract(dragonViewer.address);
	return res;
    });
};
