const NFT = artifacts.require("FireZardNFT");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(NFT,"","FireZard","FZ");
};
