
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./ICrossContractManListener.sol";

abstract contract CrossContractManListener is ICrossContractManListener, Ownable, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256('MANAGER_ROLE');

    address public manager;

    constructor() Ownable() {
	_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyManager {
	require(hasRole(MANAGER_ROLE, msg.sender),"CrossContractManListener: the caller must have MANAGER_ROLE");
	_;
    }

    function onUpdate(address oldInstance, address _manager) external virtual override {
	_onUpdate(oldInstance,_manager);
    }

    function _onUpdate(address oldInstance, address _manager) internal virtual onlyManager {
	manager = _manager;

	emit ContractUpdated(oldInstance, _manager);
    }

    function onAdd(address _manager) external virtual override {
	_onAdd(_manager);
    }

    function _onAdd(address _manager) internal virtual onlyManager {
	manager = _manager;

	emit ContractAdded(_manager);
    }

    function onReplaced(address newInstance) external virtual override {
	_onReplaced(newInstance);
    }

    function _onReplaced(address newInstance) internal virtual onlyManager {
	manager = address(0);

	emit ContractReplaced(newInstance);
    }

    function onRemoved() external virtual override {
	_onRemoved();
    }

    function _onRemoved() internal virtual onlyManager {
	manager = address(0);

	emit ContractRemoved();
    }

    function updateOwnership(address newOwner) external virtual override {
	_updateOwnership(newOwner);
    }

    function _updateOwnership(address newOwner) internal virtual onlyManager {
	transferOwnership(newOwner);

	emit ContractOwnershipUpdate(newOwner);
    }

    function switchManager(address newManager) external virtual override {
	_switchManager(newManager);
    }

    function _switchManager(address newManager) internal virtual onlyManager {
	manager = newManager;
	grantRole(MANAGER_ROLE, newManager);
	revokeRole(MANAGER_ROLE, msg.sender);

	emit ContractManagerSwitch(newManager);
    }


//    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) public virtual;

//    function onListenRemoved(bytes32 hname) public virtual;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return 
        interfaceId == type(ICrossContractManListener).interfaceId ||
        super.supportsInterface(interfaceId);
    }

}