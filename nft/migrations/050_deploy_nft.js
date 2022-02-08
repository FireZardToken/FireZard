const Manager = artifacts.require("./CrossContractMan.sol");
const NFT = artifacts.require("FireZardNFT");

module.exports = function(deployer, network, accounts) {
    return Manager.deployed().then(async (manager) =>{
	const res = await deployer.deploy(NFT,"","FireZard","FZ");
	const nft = await NFT.deployed();
	await manager.addContract('FireZardNFT', nft.address);
	return res;
    });
    
};
