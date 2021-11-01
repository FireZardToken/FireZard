/**
 * @notice Stores FireZard tokens tags related to game mechanics
 * @title FireZard Tag generic storage
 * @notice Stores tags (key-value) pairs of byte32, string, uint256 and boolean types.
 * The storage is agnostic to what contract (editor) and what data are being stored. Tags are formed by 
 * the editor contracts. The storage provides authentication for adding/modifying tags.
 * 
 * Each tag is assigned an editors' group. An editor (contract or user) can be added to one or more groups.
 * An editor can add/modify only those tags that are assigned to a group which the editor belongs to.
 */

pragma solidity ^0.8.0;

import "../../../access/AccessControlEnumerable.sol";
import "../../../utils/Context.sol";
import "FireZardUtil.sol";

contract FireZardTagStorage is Context, Ownable, AccessControlEnumerable {
    bytes32 public constant ADDER_ROLE = keccak256('ADDER_ROLE');

    mapping (bytes32 => uint8) tagGroup;
    mapping (bytes32 => bytes32) tagByte32Value;
    mapping (bytes32 => string) tagStringValue;
    mapping (bytes32 => uint256) tagIntValue;
    mapping (bytes32 => boolean) tagBooleanValue;
    mapping (bytes32 => StatType) tagType;
    mapping (bytes32 => boolean) groupMember;

    modifier isGroupMember(uint8 groupID) {
	groupMemberKey = abi.encodePacked(entity,groupID);
	require(groupMember[groupMemberKey],"Need to be tag's group member");
	_;
    }

    modifier isTagGroup(uint8 groupID, bytes32 key) {
	if(tagGroup[key])
	    require(tagGroup[key] == groupID, "Tag's group cannot be modified");
	else
	    tagGroup[key] = groupID;
	_;
    }

    modifier isByte32Tag(bytes32 key) {
	require((tagType[key] == StatType.ByteArray), "The tag must be a byte array");
	_;
    }

    modifier isStringTag(bytes32 key) {
	require((tagType[key] == StatType.String), "The tag must be a string");
	_;
    }

    modifier isIntTag(bytes32 key) {
	require((tagType[key] == StatType.Integer), "The tag must be an integer");
	_;
    }

    modifier isBooleanTag(bytes32 key) {
	require((tagType[key] == StatType.Boolean), "The tag must be a boolean");
	_;
    }

    constructor() {
    }

    addEditor2Group(address entity,uint8 groupID) public virtual onlyOwner {
	groupMemberKey = abi.encodePacked(entity,groupID);
	groupMember[groupMemberKey] = true;
    }

    removeEditorFromGroup(address entity,uint8 groupID) public virtual onlyOwner {
	groupMemberKey = abi.encodePacked(entity,groupID);
	groupMember[groupMemberKey] = false;
    }

    setTag(uint8 groupID, bytes32 key, bytes32 value) public virtual isGroupMember(groupID) isTagGroup(groupID, key) {
	tagType = StatType.ByteArray;
	tagByte32Value[key] = value;
    }

    setTag(uint8 groupID, bytes32 key, string value) public virtual isGroupMember(groupID) isTagGroup(groupID, key) {
	tagType = StatType.String;
	tagStringValue[key] = value;
    }

    setTag(uint8 groupID, bytes32 key, uint256 value) public virtual isGroupMember(groupID) isTagGroup(groupID, key) {
	tagType = StatType.Integer;
	tagIntValue[key] = value;
    }

    setTag(uint8 groupID, bytes32 key, boolean value) public virtual isGroupMember(groupID) isTagGroup(groupID, key) {
	tagType = StatType.Boolean;
	tagBooleanValue[key] = value;
    }

    getTagType(bytes32 key) public view returns StatType {
	return tagType[key];
    }

    getByte32Value(bytes32 key) public view isByte32Tag(key) returns bytes32 {
	return tagByte32Value[key];
    }

    getStringValue(bytes32 key) public view isStringTag(key) returns string {
	return tagStringValue[key];
    }

    getIntValue(bytes32 key) public view isIntTag(key) returns uint256 {
	return tagIntValue[key];
    }

    getBooleanValue(bytes32 key) public view isBooleanTag(key) returns boolean {
	return tagBooleanValue[key];
    }

    getTagGroup(bytes32 key) public view returns uint8 {
	return tagGroup[key];
    }

}
