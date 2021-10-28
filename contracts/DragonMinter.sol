/**
 * Dragon minter logic. Creates Unique dragon NFTs with unique IDs and all necessary data tags
 */

pragma solidity ^0.8.0;

import "IRNG.sol";

contract DragonMinter is Context, Ownable, AccessControlEnumerable {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    address public          RNG_addr;

    constructor(address rng_contract) {
	this.RNG_addr = rng_contract;
	_setupRole(MINTER_ROLE, _msgSender());
    }

    addMinter(address entity) public virtual onlyOwner {
	_setupRole(MINTER_ROLE, entity);
    }

    removeMinter(address entity) public virtual onlyOwner {
	_revokeRole(MINTER_ROLE, entity);
    }

    initPackage(byte32[] calldata commitment) external virtual {
	for(i=0;i<commitment.length;i++)
	    IRNG(RNG_addr).init(commitment[i]);
    }

    drawPackage(byte32[] calldata commitment) external virtual {
	for(i=0;i<commitment.length;i++)
	    IRNG(RNG_addr).open(commitment[i]);
    }

    mintPackage(byte32[] calldata commitment) external virtual isMinter {
	for(i=0;i<commitment.length;i++){
	    rvalue=IRNG(RNG_addr).getRandomValue(commitment[i]);
	    
	}
    }
}