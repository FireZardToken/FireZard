const NFT = artifacts.require("ERC1155SupplyMock");


module.exports = function(deployer, network, accounts) {
    if(network === 'test'){
	deployer.deploy(NFT,"","TestERC1155Supply","T1155S");
    }
};
