const Util   = artifacts.require("Util");

const NFT    = artifacts.require("FireZardNFT");
const Stats  = artifacts.require("DragonStats");
const Viewer  = artifacts.require("StatsView");
const DragonViewer  = artifacts.require("DragonCardView");

module.exports = function(deployer, network, accounts) {
	return Viewer.deployed().then( (viewer) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, DragonViewer);
		    var dragonViewer = await deployer.deploy(DragonViewer, viewer.address, nft.address, stats.address);
		    return dragonViewer;
		});
	    });
	});
};
