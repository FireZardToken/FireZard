
pragma solidity ^0.8;

import "../CrossContractManListener.sol";

contract ListenerMock2 is CrossContractManListener {

    uint256 public value;

    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) external override {
//	super._onListenAdded(hname, contractInstance, isNew);
    }

    function onListenRemoved(bytes32 hname) external override {
//	super._onListenRemoved(hname);
    }

    function onUpdate(address oldInstance, address _manager) external override {
	super._onUpdate(oldInstance, _manager);
	value = ListenerMock2(oldInstance).getValue()+3;
    }

    function onAdd(address _manager) external override {
	super._onAdd(_manager);
	value = 1;
    }

    function getValue() public view returns(uint256){
	return value;
    }

}