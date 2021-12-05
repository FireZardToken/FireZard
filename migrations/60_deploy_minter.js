const RNG = artifacts.require("RNG");
const TAG = artifacts.require("TagStorage");
const NFT = artifacts.require("FireZardNFT");
const Stats = artifacts.require("DragonStats");
const Minter = artifacts.require("DragonMinter");

module.exports = function(deployer, network, accounts) {
    const rng = await RNG.deployed();
    const tag = await TAG.deployed();
    const nft = await NFT.deployed();
    const stats = await Stats.deployed();
    deployer.deploy(Minter, rng.address, tag.address, nft.address, stats.address);
  }
};
