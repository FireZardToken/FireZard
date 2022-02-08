
pragma solidity ^0.8;

import "../CrossContractManListener.sol";
import "./ListenerMock2.sol";

contract ListenerMock1 is CrossContractManListener {
    string  public constant contract_name = 'ListenerMock1';
    bytes32 public constant contract_id = keccak256(abi.encodePacked(contract_name));
    bytes32 h_mock2 = keccak256('ListenerMock2');

    address public mock2;

    function getName() pure external returns(string memory) {
	return contract_name;
    }

    function getId() pure external returns(bytes32) {
	return contract_id;
    }

    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) external onlyManager {
//	super._onListenAdded(hname, contractInstance, isNew);
	if(hname == h_mock2)
	    mock2 = contractInstance;
    }

    function onListenRemoved(bytes32 hname) external onlyManager {
//	super._onListenRemoved(hname);
	if(hname == h_mock2)
	    mock2 = address(0);
    }

    function getValue() public view returns(uint256) {
	return ListenerMock2(mock2).getValue();
    }

}