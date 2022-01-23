const holder = artifacts.require("ERC1155Holder");


module.exports = function(deployer, network, accounts) {
    if(network === 'test'){
	deployer.deploy(holder);
    }
};
