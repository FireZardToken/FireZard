
const RNG = artifacts.require("RNG");
const TAG = artifacts.require("TagStorage");
const NFT = artifacts.require("FireZardNFT");
const Stats = artifacts.require("DragonStats");
const Minter = artifacts.require("DragonMinter");

contract("DragonMinter", accounts => {

    it("Testing authorized DragonMinter control", async () => {
	const minter = await Minter.deployed();
	const rng    = await RNG.deployed();
	const tag    = await TAG.deployed();
	const nft    = await NFT.deployed();
	const stats  = await Stats.deployed();
	
	await minter.linkRNG(rng.address, {from: accounts[1]});
    });
});
