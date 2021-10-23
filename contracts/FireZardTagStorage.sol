/**
 * Stores FireZard tokens tags related to game mechanics
 */ 

pragma soloditi ^0.8;

import "../../../access/AccessControlEnumerable.sol";
import "../../../utils/Context.sol";

contract FireZardTagStorage is Context, AccessControlEnumerable {
    bytes32 public constant ADDER_ROLE = keccak256('ADDER_ROLE');

    mapping (address => boolean) adders;
    mapping (byte => uint8) tagGroup;
    mapping (byte => byte) tagValue;
    mapping (byte => boolean) groupMember;

    constructor() {
	_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
	_setupRole(ADDER_ROLE, _msgSender());
    }

    setTagAdderRole(address entity) public virtual isAdmin {
	adders[entity] = true;
    }

    revokeTagAdderRole(address entity) public virtual isAdmin {
	adders[entity] = false;
    }

    addAdder2Group(address entity,uint8 groupID) public virtual isAdmin {
	
    }

    setTag(uint8 groupID, byte key, byte value) public virtual isAdder isGroupMember {
	if(tagGroup[key])
	    require(tagGroup[key] == groupID, "Tag's group cannot be modified");
	else
	    tagGroup[key] = groupID;
	tagValue = value;
    }

}