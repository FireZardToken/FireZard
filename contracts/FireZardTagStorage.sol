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

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {FireZardUtil} from "./FireZardUtil.sol";


contract FireZardTagStorage is Context, Ownable, AccessControlEnumerable {
    bytes32 public constant ADDER_ROLE = keccak256('ADDER_ROLE');

    mapping (bytes32 => uint8) tagGroup;
    mapping (bytes32 => bytes32) tagByte32Value;
    mapping (bytes32 => string) tagStringValue;
    mapping (bytes32 => uint256) tagIntValue;
    mapping (bytes32 => bool) tagBooleanValue;
    mapping (bytes32 => FireZardUtil.StatType) tagType;
    mapping (bytes32 => bool) groupMember;

    modifier onlyAdder() {
	require(hasRole(ADDER_ROLE, msg.sender),"FireZardTagStorage: The caller must have adder's priviledges");
	_;
    }

    modifier onlyAdmin() {
	require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender),"FireZardTagStorage: The caller must have admin's priviledges");
	_;
    }

    modifier authorizeEdit(uint8 groupID, bytes32 key) {
	if(tagGroup[key]>0){
	    bytes32 groupMemberKey = keccak256(abi.encode(msg.sender,tagGroup[key]));
	    require(groupMember[groupMemberKey],"FireZardTagStorage: Need to be tag's group member");
	}
	tagGroup[key] = groupID;
	_;
    }

    modifier byte32Tag(bytes32 key) {
	require((tagType[key] == FireZardUtil.StatType.ByteArray), "FireZardTagStorage: The tag must be a byte array");
	_;
    }

    modifier stringTag(bytes32 key) {
	require((tagType[key] == FireZardUtil.StatType.String), "FireZardTagStorage: The tag must be a string");
	_;
    }

    modifier intTag(bytes32 key) {
	require((tagType[key] == FireZardUtil.StatType.Integer), "FireZardTagStorage: The tag must be an integer");
	_;
    }

    modifier booleanTag(bytes32 key) {
	require((tagType[key] == FireZardUtil.StatType.Boolean), "FireZardTagStorage: The tag must be a boolean");
	_;
    }

    constructor() {
	super._setupRole(DEFAULT_ADMIN_ROLE,msg.sender);
    }

    function grantAdminRole(address entity) external virtual onlyOwner {
	super._setupRole(DEFAULT_ADMIN_ROLE,entity);
    }

    function revokeAdminRole(address entity) external virtual onlyOwner {
	super.revokeRole(DEFAULT_ADMIN_ROLE,entity);
    }

    function grantAdderRole(address entity) external virtual onlyAdmin {
	super._setupRole(ADDER_ROLE,entity);
    }

    function revokeAdderRole(address entity) external virtual onlyAdmin {
	super.revokeRole(ADDER_ROLE,entity);
    }

    function isAdmin(address entity) external view returns (bool) {
	return hasRole(DEFAULT_ADMIN_ROLE, entity);
    }

    function isAdder(address entity) external view returns (bool) {
	return hasRole(ADDER_ROLE, entity);
    }

    function isGroupMember(address entity, uint8 groupID) external view returns (bool) {
	bytes32 groupMemberKey = keccak256(abi.encode(entity,groupID));
	return groupMember[groupMemberKey];
    }

    /**
     * @notice Add editor to a group
     * 
     * @param entity  Editor's address. It can be contract or user
     * @param groupID The id of the group where to add the entity
    **/
    function addEditor2Group(address entity,uint8 groupID) public virtual onlyAdmin {
	bytes32 groupMemberKey = keccak256(abi.encode(entity,groupID));
	groupMember[groupMemberKey] = true;
    }

    /**
     * @notice Remove editor from the group
     * 
     * @param entity  Editor's address. It can be contract or user
     * @param groupID The id of the group from where to remove the entity
    **/
    function removeEditorFromGroup(address entity,uint8 groupID) public virtual onlyAdmin {
	bytes32 groupMemberKey = keccak256(abi.encode(entity,groupID));
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
    function setTag(uint8 groupID, bytes32 key, bytes32 value) public virtual onlyAdder authorizeEdit(groupID, key) {
	tagType[key] = FireZardUtil.StatType.ByteArray;
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
    function setTag(uint8 groupID, bytes32 key, string calldata value) public virtual onlyAdder authorizeEdit(groupID, key) {
	tagType[key] = FireZardUtil.StatType.String;
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
    function setTag(uint8 groupID, bytes32 key, uint256 value) public virtual onlyAdder authorizeEdit(groupID, key) {
	tagType[key] = FireZardUtil.StatType.Integer;
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
    function setTag(uint8 groupID, bytes32 key, bool value) public virtual onlyAdder authorizeEdit(groupID, key) {
	tagType[key] = FireZardUtil.StatType.Boolean;
	tagBooleanValue[key] = value;
    }

    /**
     * @notice Gets data type of the tag.
     *
     * @param  key The tag's key
     * @return The tag's value data type
    **/
    function getTagType(bytes32 key) public view returns (FireZardUtil.StatType) {
	return tagType[key];
    }

    /**
     * @notice Gets tag's value of byte array type.
     *
     * @param key The tag's key
     * @return The tag's value of type bytes32
    **/
    function getByte32Value(bytes32 key) public view byte32Tag(key) returns (bytes32) {
	return tagByte32Value[key];
    }

    /**
     * @notice Gets tag's value of string type.
     *
     * @param key The tag's key
     * @return The tag's value of type string
    **/
    function getStringValue(bytes32 key) public view stringTag(key) returns (string memory) {
	return tagStringValue[key];
    }

    /**
     * @notice Gets tag's value of integer type.
     *
     * @param key The tag's key
     * @return The tag's value of type uint256
    **/
    function getIntValue(bytes32 key) public view intTag(key) returns (uint256) {
	return tagIntValue[key];
    }

    /**
     * @notice Gets tag's value of boolean type.
     *
     * @param key The tag's key
     * @return The tag's value of type boolean
    **/
    function getBooleanValue(bytes32 key) public view booleanTag(key) returns (bool) {
	return tagBooleanValue[key];
    }

    /**
     * @notice Gets tag's associated group
     *
     * @param key The tag's key
     * @return Id of the groupt to which the tag is currently associated
    **/
    function getTagGroup(bytes32 key) public view returns (uint8) {
	return tagGroup[key];
    }

}
