const Manager = artifacts.require("./CrossContractMan.sol");
const Util   = artifacts.require("Util");
//const TAG    = artifacts.require("TagStorage");
//const NFT    = artifacts.require("FireZardNFT");
//const Stats  = artifacts.require("DragonStats");
const Viewer  = artifacts.require("StatsView");

module.exports = function(deployer, network, accounts) {
/*	return TAG.deployed().then( (tag) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, Viewer);
		    var viewer = await deployer.deploy(Viewer, tag.address, nft.address);
		    return viewer;
		});
	    });
	});*/
    return Manager.deployed().then(async (manager) =>{
	await deployer.link(Util, Viewer);
	const res = await await deployer.deploy(Viewer);
	const viewer = await Viewer.deployed();
	await viewer.grantRole(await viewer.MANAGER_ROLE(),manager.address);
	await manager.addContract(viewer.address);
	return res;
    });
};
