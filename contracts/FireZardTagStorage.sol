/**
 * Stores FireZard tokens tags related to game mechanics
 */ 

pragma solidity ^0.8.0;

import "../../../access/AccessControlEnumerable.sol";
import "../../../utils/Context.sol";

contract FireZardTagStorage is Context, Ownable, AccessControlEnumerable {
    bytes32 public constant ADDER_ROLE = keccak256('ADDER_ROLE');

    mapping (address => boolean) adders;
    mapping (bytes32 => uint8) tagGroup;
    mapping (bytes32 => bytes32) tagValue;
    mapping (bytes32 => boolean) groupMember;

    modifier isAdder {
	require(hasRole(ADDER_ROLE,msg.sender),"Adder's role required");
	_;
    }

    modifier isGroupMember(uint8 groupID) {
	groupMemberKey = abi.encodePacked(entity,groupID);
	require(groupMember[groupMemberKey],"Need to be tag's group member");
	_;
    }

    constructor() {
	_setupRole(ADDER_ROLE, _msgSender());
    }

    setTagAdderRole(address entity) public virtual onlyOwner {
	adders[entity] = true;
    }

    revokeTagAdderRole(address entity) public virtual onlyOwner {
	adders[entity] = false;
    }

    addAdder2Group(address entity,uint8 groupID) public virtual onlyOwner {
	groupMemberKey = abi.encodePacked(entity,groupID);
	groupMember[groupMemberKey] = true;
    }

    removeAdderFromGroup(address entity,uint8 groupID) public virtual onlyOwner {
	groupMemberKey = abi.encodePacked(entity,groupID);
	groupMember[groupMemberKey] = false;
    }

    setTag(uint8 groupID, bytes32 key, bytes32 value) public virtual onlyOwner isGroupMember(groupID) {
	if(tagGroup[key])
	    require(tagGroup[key] == groupID, "Tag's group cannot be modified");
	else
	    tagGroup[key] = groupID;
	tagValue = value;
    }

    setTag(uint8 groupID, bytes32 key, bytes32 value) public virtual onlyOwner isGroupMember(groupID) {
	if(tagGroup[key])
	    require(tagGroup[key] == groupID, "Tag's group cannot be modified");
	else
	    tagGroup[key] = groupID;
	tagValue = value;
    }

    getTagValue(bytes32 key) public view returns bytes32 {
	return tagValue[key];
    }

    getTagGroup(bytes32 key) public view returns uint8 {
	return tagGroup[key];
    }

}
