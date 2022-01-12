const Util   = artifacts.require("Util");

const NFT    = artifacts.require("FireZardNFT");
const Stats  = artifacts.require("DragonStats");
const Viewer  = artifacts.require("StatsView");
const Treasury  = artifacts.require("Treasury");

module.exports = function(deployer, network, accounts) {
	return Viewer.deployed().then( (viewer) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, Treasury);
		    var treasury = await deployer.deploy(Treasury, nft.address, viewer.address, stats.address);
		    return treasury;
		});
	    });
	});
};
