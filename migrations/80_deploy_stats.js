const Util   = artifacts.require("Util");

const RNG    = artifacts.require("RNG");
const TAG    = artifacts.require("TagStorage");
const NFT    = artifacts.require("FireZardNFT");
const Stats  = artifacts.require("DragonStats");
const Minter = artifacts.require("DragonMinter");

module.exports = function(deployer, network, accounts) {
    return RNG.deployed().then( (rng) =>{
	return TAG.deployed().then( (tag) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, Minter);
		    return await deployer.deploy(Minter, rng.address, tag.address, nft.address, stats.address);
		});
	    });
	});
    });
};
