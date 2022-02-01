
pragma solidity ^0.8;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./ICrossContractManListener.sol";

contract CrossContractMan is ERC165, Ownable {
    using Address for address;
    mapping(bytes32 => address) public contracts;

    bytes32[] public hnames;

    event ContractReplaced(bytes32 h_name, address contract_addr);

    event ContractAdded(bytes32 h_name, address contract_addr);

    function addContract(string calldata name, address contract_addr) public virtual onlyOwner {
	bytes32 h_name = keccak256(abi.encodePacked(name));
	bool is_listener = isListener(contract_addr);
	bool is_new = false;
	if(contracts[h_name] != address(0)){
	    if(is_listener)
		ICrossContractManListener(contract_addr).onUpdate(contracts[h_name], address(this));
	    if(isListener(contracts[h_name]))
		ICrossContractManListener(contracts[h_name]).onReplaced(contract_addr);
	    emit ContractReplaced(h_name, contract_addr);
	}else{
	    is_new = true;
	    if(is_listener)
		ICrossContractManListener(contract_addr).onAdd(address(this));
	    hnames.push(h_name);
	    emit ContractAdded(h_name, contract_addr);
	}
	for(uint i=0;i<hnames.length;i++){
	    if(contracts[hnames[i]] == address(0))break;
	    if(!isListener(contracts[hnames[i]]))break;
	    ICrossContractManListener(contracts[hnames[i]]).onListenAdded(h_name,contract_addr,is_new);
	    ICrossContractManListener(contract_addr).onListenAdded(hnames[i],contracts[hnames[i]],true);
	    if(!is_new)
		ICrossContractManListener(contracts[h_name]).onListenRemoved(hnames[i]);
	}
	contracts[h_name] = contract_addr;
    }

    function removeContract(string calldata name) public virtual onlyOwner {
	bytes32 h_name = keccak256(abi.encodePacked(name));
	if(contracts[h_name] == address(0))return;
	bool is_listener = isListener(contracts[h_name]);
	if(isListener(contracts[h_name])){
	    ICrossContractManListener(contracts[h_name]).onRemoved();
	}
	for(uint i=0;i<hnames.length;i++){
	    if(contracts[hnames[i]] == address(0))break;
	    if(!isListener(contracts[hnames[i]]))break;
	    ICrossContractManListener(contracts[hnames[i]]).onListenRemoved(h_name);
	    ICrossContractManListener(contracts[h_name]).onListenRemoved(hnames[i]);
	}
	delete contracts[h_name];
    }

    function isListener(address instance) internal view returns(bool) {
	if(instance.isContract()){
	    if(ERC165(instance).supportsInterface(type(ICrossContractManListener).interfaceId))
		return true;
	}
	return false;
    }

    function updateOwnership(address newOwner) public virtual onlyOwner {
	for(uint i=0;i<hnames.length;i++){
	    ICrossContractManListener(contracts[hnames[i]]).updateOwnership(newOwner);
	}
	transferOwnership(newOwner);
    }

    function switchManager(address newManager) public virtual onlyOwner {
	for(uint i=0;i<hnames.length;i++){
	    ICrossContractManListener(contracts[hnames[i]]).switchManager(newManager);
	}
    }

    function getContract(string calldata name) public view returns(address) {
	bytes32 h_name = keccak256(abi.encodePacked(name));
	return contracts[h_name];
    }
}
