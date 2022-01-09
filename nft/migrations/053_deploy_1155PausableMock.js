const NFT = artifacts.require("ERC1155PausableMock");


module.exports = function(deployer, network, accounts) {
    if(network === 'test'){
	deployer.deploy(NFT,"","TestERC1155Pausable","T1155P");
    }
};
