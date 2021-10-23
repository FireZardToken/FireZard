/**
 * Dragon minter logic. Creates Unique dragon NFTs with unique IDs and all necessary data tags
 */

pragma solidity ^0.8.0;

contract DragonMinter is Context, Ownable, AccessControlEnumerable {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    constructor() {
	_setupRole(MINTER_ROLE, _msgSender());
    }

    addMinter(address entity) public virtual onlyOwner {
	_setupRole(MINTER_ROLE, entity);
    }

    removeMinter(address entity) public virtual onlyOwner {
	_revokeRole(MINTER_ROLE, entity);
    }

    mintPackage(uint8 size) public virtual isMinter {
	
    }

}