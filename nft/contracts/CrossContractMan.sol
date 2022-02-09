
pragma solidity ^0.8;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./ICrossContractManListener.sol";

contract CrossContractMan is Ownable, AccessControlEnumerable {
    using Address for address;
    bytes32 public constant RETIRING_MANAGER_ROLE = keccak256('RETIRING_MANAGER_ROLE');

    mapping(bytes32 => address) public contracts;

    bytes32[] public hnames;

    event ContractReplaced(bytes32 h_name, address contract_addr);

    event ContractAdded(bytes32 h_name, address contract_addr);

    event ManagerUpdatedFrom(address oldManager);

    event ManagerUpdatedTo(address newManager);

    modifier isRetiringManager() {
	require(hasRole(RETIRING_MANAGER_ROLE, msg.sender),"CrossContractMan: the caller must have RETIRING_MANAGER_ROLE");
	_;
    }

    constructor() Ownable() {
	_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function onSwitchManager(address oldManager) public virtual isRetiringManager {
	for(uint i=0;i<CrossContractMan(oldManager).getContractsCount();i++){
	    bytes32 hname = CrossContractMan(oldManager).hnames(i);
	    hnames.push(hname);
	    contracts[hname] = CrossContractMan(oldManager).contracts(hname);
	}
	emit ManagerUpdatedFrom(oldManager);
    }

    function addContract(address contract_addr) public virtual onlyOwner {
	bytes32 id = ICrossContractManListener(contract_addr).getId();
	_addContract(id, contract_addr);
    }

    function addContract(string calldata name, address contract_addr) public virtual onlyOwner {
	bytes32 h_name = keccak256(abi.encodePacked(name));
	_addContract(h_name, contract_addr);
    }

    function _addContract(bytes32 h_name, address contract_addr) internal {
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
	    if(contracts[hnames[i]] == address(0))continue;
	    if(isListener(contracts[hnames[i]]))
		ICrossContractManListener(contracts[hnames[i]]).onListenAdded(h_name,contract_addr,is_new);
	    if(is_listener){
		ICrossContractManListener(contract_addr).onListenAdded(hnames[i],contracts[hnames[i]],true);
		if(!is_new)
		    ICrossContractManListener(contracts[h_name]).onListenRemoved(hnames[i]);
	    }
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
	    try ERC165(instance).supportsInterface(type(ICrossContractManListener).interfaceId) returns(bool responce){
		return responce;
	    }catch{
		return false;
	    }
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
	emit ManagerUpdatedTo(newManager);
	CrossContractMan(newManager).onSwitchManager(address(this));
	CrossContractMan(newManager).renounceRole(RETIRING_MANAGER_ROLE, address(this));
    }

    function getContract(string calldata name) public view returns(address) {
	bytes32 h_name = keccak256(abi.encodePacked(name));
	return contracts[h_name];
    }

    function getContractsCount() public view returns(uint256) {
	return hnames.length;
    }
}
