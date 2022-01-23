const NFT = artifacts.require("ERC1155Mock");


module.exports = function(deployer, network, accounts) {
    if(network === 'test'){
	deployer.deploy(NFT,"","TestERC1155","T1155");
    }
};
