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

    modifier isAdder() {
	require(hasRole(ADDER_ROLE, msg.sender),"The caller must have adder's priviledges");
	_;
    }

    modifier authorizeEdit(uint8 groupID, bytes32 key) {
	if(tagGroup[key]>0)
	    groupMemberKey = abi.encodePacked(msg.sender,tagGroup[key]);
	    require(groupMember[groupMemberKey],"Need to be tag's group member");
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
//	super._setupRole(ADDER_ROLE,msg.sender);
    }

    /**
     * @notice Add editor to a group
     * 
     * @param entity  Editor's address. It can be contract or user
     * @param groupID The id of the group where to add the entity
    **/
    addEditor2Group(address entity,uint8 groupID) public virtual onlyOwner {
	groupMemberKey = abi.encodePacked(entity,groupID);
	groupMember[groupMemberKey] = true;
    }

    /**
     * @notice Remove editor from the group
     * 
     * @param entity  Editor's address. It can be contract or user
     * @param groupID The id of the group from where to remove the entity
    **/
    removeEditorFromGroup(address entity,uint8 groupID) public virtual onlyOwner {
	groupMemberKey = abi.encodePacked(entity,groupID);
	groupMember[groupMemberKey] = false;
    }

    /**
     * @notice Set a byte array tag. The caller must have an adder role. 
     * The caller with the adder role can create new tag and assign it to any group id.
     * The caller may modify existing tag and assign it to a new group id if the caller belongs to the group currently associated to the tag.
     *
     * @param groupID The ID of the group for the tag
     * @param key     The key of the tag
     * @param value   The value (type byte32) of the tag
    **/
    setTag(uint8 groupID, bytes32 key, bytes32 value) public virtual isAdder() authorizeEdit(groupID, key) {
	tagType = StatType.ByteArray;
	tagByte32Value[key] = value;
    }

    /**
     * @notice Set a string tag. The caller must have an adder role.
     * The caller with the adder role can create new tag and assign it to any group id.
     * The caller may modify existing tag and assign it to a new group id if the caller belongs to the group currently associated to the tag.
     *
     * @param groupID The ID of the group for the tag
     * @param key     The key of the tag
     * @param value   The value (type string) of the tag
    **/
    setTag(uint8 groupID, bytes32 key, string value) public virtual isAdder() authorizeEdit(groupID, key) {
	tagType = StatType.String;
	tagStringValue[key] = value;
    }

    /**
     * @notice Set an integer tag. The caller must have an adder role.
     * The caller with the adder role can create new tag and assign it to any group id.
     * The caller may modify existing tag and assign it to a new group id if the caller belongs to the group currently associated to the tag.
     *
     * @param groupID The ID of the group for the tag
     * @param key     The key of the tag
     * @param value   The value (type uint256) of the tag
    **/
    setTag(uint8 groupID, bytes32 key, uint256 value) public virtual isAdder() authorizeEdit(groupID, key) {
	tagType = StatType.Integer;
	tagIntValue[key] = value;
    }

    /**
     * @notice Set a boolean tag. The caller must have an adder role.
     * The caller with the adder role can create new tag and assign it to any group id.
     * The caller may modify existing tag and assign it to a new group id if the caller belongs to the group currently associated to the tag.
     *
     * @param groupID The ID of the group for the tag
     * @param key     The key of the tag
     * @param value   The value (type boolean) of the tag
    **/
    setTag(uint8 groupID, bytes32 key, boolean value) public virtual isAdder() authorizeEdit(groupID, key) {
	tagType = StatType.Boolean;
	tagBooleanValue[key] = value;
    }

    /**
     * @notice Gets data type of the tag.
     *
     * @param  The tag's key
     * @return The tag's value data type
    **/
    getTagType(bytes32 key) public view returns StatType {
	return tagType[key];
    }

    /**
     * @notice Gets tag's value of byte array type.
     *
     * @param key The tag's key
     * @return The tag's value of type bytes32
    **/
    getByte32Value(bytes32 key) public view isByte32Tag(key) returns bytes32 {
	return tagByte32Value[key];
    }

    /**
     * @notice Gets tag's value of string type.
     *
     * @param key The tag's key
     * @return The tag's value of type string
    **/
    getStringValue(bytes32 key) public view isStringTag(key) returns string {
	return tagStringValue[key];
    }

    /**
     * @notice Gets tag's value of integer type.
     *
     * @param key The tag's key
     * @return The tag's value of type uint256
    **/
    getIntValue(bytes32 key) public view isIntTag(key) returns uint256 {
	return tagIntValue[key];
    }

    /**
     * @notice Gets tag's value of boolean type.
     *
     * @param key The tag's key
     * @return The tag's value of type boolean
    **/
    getBooleanValue(bytes32 key) public view isBooleanTag(key) returns boolean {
	return tagBooleanValue[key];
    }

    /**
     * @notice Gets tag's associated group
     *
     * @param key The tag's key
     * @return Id of the groupt to which the tag is currently associated
    **/
    getTagGroup(bytes32 key) public view returns uint8 {
	return tagGroup[key];
    }

}
