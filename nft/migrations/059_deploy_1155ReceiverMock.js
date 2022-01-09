const receiver = artifacts.require("ERC1155ReceiverMock");

const RECEIVER_SINGLE_MAGIC_VALUE = '0xf23a6e61';
const RECEIVER_BATCH_MAGIC_VALUE  = '0xbc197c81';

module.exports = function(deployer, network, accounts) {
    if(network === 'test'){
	deployer.deploy(
	    receiver, 
	    RECEIVER_SINGLE_MAGIC_VALUE, 
	    false, 
	    RECEIVER_BATCH_MAGIC_VALUE,
	    false
	    );
    }
};
