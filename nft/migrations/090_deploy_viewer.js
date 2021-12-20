const Util   = artifacts.require("Util");

const TAG    = artifacts.require("TagStorage");
const NFT    = artifacts.require("FireZardNFT");
const Stats  = artifacts.require("DragonStats");
const Viewer  = artifacts.require("StatsView");

module.exports = function(deployer, network, accounts) {
	return TAG.deployed().then( (tag) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, Viewer);
		    var viewer = await deployer.deploy(Viewer, tag.address, nft.address);
		    return viewer;
		});
	    });
	});
};
