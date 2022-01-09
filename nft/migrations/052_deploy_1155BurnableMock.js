const NFT = artifacts.require("ERC1155BurnableMock");


module.exports = function(deployer, network, accounts) {
    if(network === 'test'){
	deployer.deploy(NFT,"","TestERC1155Burnable","T1155B");
    }
};
