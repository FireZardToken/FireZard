const Manager = artifacts.require("./CrossContractMan.sol");
const Util   = artifacts.require("Util");
//const RNG    = artifacts.require("RNG");
const TAG    = artifacts.require("TagStorage");
const NFT    = artifacts.require("FireZardNFT");
//const Stats  = artifacts.require("DragonStats");
const Minter = artifacts.require("DragonMinter");
const ether_digits = '000000000000000000';

module.exports = function(deployer, network, accounts) {
/*    return RNG.deployed().then( (rng) =>{
	return TAG.deployed().then( (tag) => {
	    return NFT.deployed().then( (nft) => {
		return Stats.deployed().then(async (stats) => {
		    await deployer.link(Util, Minter);
		    var minter = await deployer.deploy(Minter, rng.address, tag.address, nft.address, stats.address);
		    await nft.grantRole(await nft.MINTER_ROLE(), minter.address);
		    await tag.grantAdderRole(minter.address);
		    return minter;
		});
	    });
	});
    });*/
    return Manager.deployed().then(async (manager) =>{
	await deployer.link(Util, Minter);
	const res = await deployer.deploy(Minter);
	const minter = await Minter.deployed();
	await minter.grantRole(await minter.MANAGER_ROLE(),manager.address);
	await manager.addContract(minter.address);
	await minter.setPrice(1,'1500'+ether_digits);
	await minter.setPrice(10,'10000'+ether_digits);
	const nft = await NFT.deployed();
	const tag = await TAG.deployed();
	await nft.grantRole(await nft.MINTER_ROLE(), minter.address);
	await tag.grantAdderRole(minter.address);
/*	console.log("MINTER#RNG: "+(await minter.RNG_addr()));
	console.log("MANAGER#MINTER: "+(await manager.getContract('DragonMinter')));
	console.log("MANAGER#RNG: "+(await manager.getContract('RNG')));
	console.log("MANAGER#CONTRACT_COUNT: "+(await manager.getContractsCount()));*/
	return res;
    });
};
