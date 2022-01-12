const {
  ether,
  send,
  BN,           
  constants,    
  expectEvent,  
  expectRevert, 
} = require('@openzeppelin/test-helpers');

const TagStorage = artifacts.require("TagStorage");

const keccak256 = require('keccak256');

contract("TagStorage", accounts => {

    var owner    = accounts[0];
    var adder1   = accounts[1];
    var adder2   = accounts[2];
    var attacker = accounts[3];
    var admin    = accounts[9];

    const group1 = 1;
    const group2 = 2;

  it("Role and group membership management: granting/revoking admin role, granting/revoking adders' role, adding/removing editor's membership for a group", async () => {
    const tagStorage = await TagStorage.deployed();

    var is_owner_admin = await tagStorage.isAdmin(owner);
    assert.equal(is_owner_admin,true,"Owner must have admin role");

    // Granting/revoking admin's role for admin
    await tagStorage.grantAdminRole(admin);
    var is_admin = await tagStorage.isAdmin(admin);
    assert.equal(is_admin,true,"Admin must have admin role");
    await tagStorage.revokeAdminRole(admin);
    is_admin = await tagStorage.isAdmin(admin);
    assert.equal(is_admin,false,"Admin must not have admin role");

    // Granting tag adder's role to adder1
    await tagStorage.grantAdderRole(adder1);
    var is_adder1 = await tagStorage.isAdder(adder1);
    assert.equal(is_adder1,true,"Adder1 must have the Adder's role granted");
    var is_adder2 = await tagStorage.isAdder(adder2);
    assert.equal(is_adder2,false,"Adder2 must not have the Adder's role granted");

    // Adding adder1 to group1
    await tagStorage.addEditor2Group(adder1,group1);
    var is_adder1group1 = await tagStorage.isGroupMember(adder1,group1);
    assert.equal(is_adder1group1,true,"Adder1 must be a member of group1");
    var is_adder1group2 = await tagStorage.isGroupMember(adder1,group2);
    assert.equal(is_adder1group2,false,"Adder1 must not be a member of group2");

    // Granting and revoking tag adder's role for adder2
    await tagStorage.grantAdderRole(adder2);
    is_adder2 = await tagStorage.isAdder(adder2);
    assert.equal(is_adder2,true,"Adder2 must have the Adder's role granted");
    await tagStorage.revokeAdderRole(adder2);
    is_adder2 = await tagStorage.isAdder(adder2);
    assert.equal(is_adder2,false,"Adder2 must not have the Adder's role granted");

    // Adding/removing adder2 to/from group1
    await tagStorage.addEditor2Group(adder2,group1);
    var is_adder2group1 = await tagStorage.isGroupMember(adder2,group1);
    assert.equal(is_adder2group1,true,"Adder2 must be a member of group1");
    await tagStorage.removeEditorFromGroup(adder2,group1);
    is_adder2group1 = await tagStorage.isGroupMember(adder2,group1);
    assert.equal(is_adder2group1,false,"Adder2 must not be a member of group1");

  });

  it("Authorization test: admin and adder role management, group membership management", async () => {
    const tagStorage = await TagStorage.deployed();

    // Precondition
    assert.equal(
	await tagStorage.isAdmin(attacker),
	false,
	"Attacker must not be admin"
    );
    assert.equal(
	await tagStorage.isAdmin(adder1),
	false,
	"Adder1 must not be admin"
    );
    await tagStorage.grantAdminRole(admin);
    assert.equal(
	await tagStorage.isAdmin(admin),
	true,
	"Admin must be admin"
    );


    // Granting admin role
    await expectRevert(
	tagStorage.grantAdminRole(admin,{from: attacker}),
	'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
    );
    await expectRevert(
	tagStorage.grantAdminRole(admin,{from: adder1}),
	'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
    );
    await expectRevert(
	tagStorage.grantAdminRole(attacker,{from: admin}),
	'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
    );

    // Revoking admin role
    await expectRevert(
	tagStorage.revokeAdminRole(owner,{from: attacker}),
	'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
    );
    await expectRevert(
	tagStorage.revokeAdminRole(owner,{from: adder1}),
	'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
    );
    await expectRevert(
	tagStorage.revokeAdminRole(owner,{from: admin}),
	'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
    );

    // Granting adder's role
    await expectRevert(
	tagStorage.grantAdderRole(admin,{from: attacker}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await expectRevert(
	tagStorage.grantAdderRole(admin,{from: adder1}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await tagStorage.grantAdderRole(admin,{from: admin}),
    assert.equal(
	await tagStorage.isAdder(admin),
	true,
	"Admin must be adder"
    );


    // Revoking adder's role
    await expectRevert(
	tagStorage.revokeAdderRole(adder1,{from: attacker}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await expectRevert(
	tagStorage.revokeAdderRole(adder1,{from: adder1}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await tagStorage.revokeAdderRole(admin,{from: admin}),
    assert.equal(
	await tagStorage.isAdder(admin),
	false,
	"Admin must not be adder"
    );

    // Add a member to group
    await expectRevert(
	tagStorage.addEditor2Group(admin,group1,{from: attacker}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await expectRevert(
	tagStorage.addEditor2Group(admin,group1,{from: adder1}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await tagStorage.addEditor2Group(admin,group1,{from: admin}),
    assert.equal(
	await tagStorage.isGroupMember(admin,group1),
	true,
	"Admin must be group1 member"
    );

    // Remove a member from group
    await expectRevert(
	tagStorage.removeEditorFromGroup(adder1,group1,{from: attacker}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await expectRevert(
	tagStorage.removeEditorFromGroup(adder1,group1,{from: adder1}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await tagStorage.removeEditorFromGroup(admin,group1,{from: admin}),
    assert.equal(
	await tagStorage.isGroupMember(admin,group1),
	false,
	"Admin must be not group1 member"
    );

    await tagStorage.revokeAdminRole(admin);
    assert.equal(
	await tagStorage.isAdmin(admin),
	false,
	"Admin must not be admin"
    );

    await expectRevert(
	tagStorage.grantAdderRole(attacker,{from: admin}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await expectRevert(
	tagStorage.revokeAdderRole(adder1,{from: admin}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await expectRevert(
	tagStorage.addEditor2Group(attacker,group1,{from: admin}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );
    await expectRevert(
	tagStorage.removeEditorFromGroup(adder1,group1,{from: admin}),
	"TagStorage: The caller must have admin's priviledges -- Reason given: TagStorage: The caller must have admin's priviledges."
    );


  });

  it("Authorization test: unauthorized tag addition/edition", async () => {
    const tagStorage = await TagStorage.deployed();

    // Precondition
    assert.equal(
	await tagStorage.isGroupMember(attacker,group2),
	false,
	"Attacker must not be group2 member"
    );
    assert.equal(
	await tagStorage.isGroupMember(owner,group2),
	false,
	"Owner must not be group2 member"
    );
    assert.equal(
	await tagStorage.isAdder(adder1),
	true,
	"Adder1 must be adder"
    );
    assert.equal(
	await tagStorage.isGroupMember(adder1,group2),
	false,
	"Adder1 must not be group2 member"
    );
    assert.equal(
	await tagStorage.isGroupMember(adder1,group1),
	true,
	"Adder1 must be group1 member"
    );
    await tagStorage.grantAdderRole(adder2);
    assert.equal(
	await tagStorage.isAdder(adder2),
	true,
	"Adder2 must be adder"
    );
    await tagStorage.addEditor2Group(adder2,group2);
    assert.equal(
	await tagStorage.isGroupMember(adder2,group2),
	true,
	"Adder2 must be group2 member"
    );


    // Testing attacker's tag addition
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bytearray'),keccak256('some value'),{from: attacker}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.string'),'some value',{from: attacker}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.int'),141,{from: attacker}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bool'),true,{from: attacker}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );

    // Testing owner's tag addition
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bytearray'),keccak256('some value'),{from: owner}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.string'),'some value',{from: owner}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.int'),141,{from: owner}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bool'),true,{from: owner}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );

    // Testing adder1 tag addition to group2
    await tagStorage.setTag(group2,keccak256('test.bytearray'),keccak256('some value'),{from: adder1}),
    await tagStorage.setTag(group2,keccak256('test.string'),'some value',{from: adder1}),
    await tagStorage.setTag(group2,keccak256('test.int'),141,{from: adder1}),
    await tagStorage.setTag(group2,keccak256('test.bool'),true,{from: adder1}),

    // Testing adder1 tag modification for group2
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bytearray'),keccak256('modified value'),{from: adder1}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.string'),'modified value',{from: adder1}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.int'),144,{from: adder1}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bool'),false,{from: adder1}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );

    // Testing adder2 tag edition, switching to group1
    await tagStorage.setTag(group1,keccak256('test.bytearray'),keccak256('modified value'),{from: adder2}),
    await tagStorage.setTag(group1,keccak256('test.string'),'modified value',{from: adder2}),
    await tagStorage.setTag(group1,keccak256('test.int'),144,{from: adder2}),
    await tagStorage.setTag(group1,keccak256('test.bool'),false,{from: adder2}),

    // Testing adder2 tag modification for group1
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bytearray'),keccak256('modified value3'),{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.string'),'modified value3',{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.int'),148,{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bool'),true,{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );

    await tagStorage.addEditor2Group(adder2,group1);
    assert.equal(
	await tagStorage.isGroupMember(adder2,group1),
	true,
	"Adder2 must be group1 member"
    );

    // Testing adder2 tag edition
    await tagStorage.setTag(group1,keccak256('test.bytearray'),keccak256('modified value2'),{from: adder2}),
    await tagStorage.setTag(group1,keccak256('test.string'),'modified value2',{from: adder2}),
    await tagStorage.setTag(group1,keccak256('test.int'),148,{from: adder2}),
    await tagStorage.setTag(group1,keccak256('test.bool'),true,{from: adder2}),

    await tagStorage.removeEditorFromGroup(adder2,group1);
    assert.equal(
	await tagStorage.isGroupMember(adder2,group1),
	false,
	"Adder2 must not be group1 member"
    );

    // Testing adder2 tag modification for group1
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bytearray'),keccak256('modified value4'),{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.string'),'modified value4',{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.int'),152,{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test.bool'),false,{from: adder2}),
	"TagStorage: Need to be tag's group member -- Reason given: TagStorage: Need to be tag's group member."
    );

    await tagStorage.revokeAdderRole(adder2);
    assert.equal(
	await tagStorage.isAdder(adder2),
	false,
	"Adder2 must not be adder"
    );

    // Testing adder2 tag addition
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test2.bytearray'),keccak256('modified value4'),{from: adder2}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test2.string'),'modified value4',{from: adder2}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test2.int'),152,{from: adder2}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
    await expectRevert(
	tagStorage.setTag(group2,keccak256('test2.bool'),false,{from: adder2}),
	"TagStorage: The caller must have adder's priviledges -- Reason given: TagStorage: The caller must have adder's priviledges."
    );
  });

  it("Tag storage test: creating/modifying tags", async () => {
    const BYTE_TYPE    = 2;
    const STRING_TYPE  = 1;
    const INTEGER_TYPE = 0;
    const BOOLEAN_TYPE = 3;

    const tagStorage = await TagStorage.deployed();

    // Precondition
    assert.equal(
	await tagStorage.isAdder(adder1),
	true,
	"Adder1 must be adder"
    );
    assert.equal(
	await tagStorage.isGroupMember(adder1,group1),
	true,
	"Adder1 must be group1 member"
    );
    await tagStorage.grantAdderRole(adder2);
    assert.equal(
	await tagStorage.isAdder(adder2),
	true,
	"Adder2 must be adder"
    );
    await tagStorage.addEditor2Group(adder2,group2);
    assert.equal(
	await tagStorage.isGroupMember(adder2,group2),
	true,
	"Adder2 must be group2 member"
    );

//    await tagStorage.setTag['uint8', 'bytes32', 'bytes32'](group1,keccak256('test3.bytearray'),keccak256('byte value'),{from: adder1});
    await tagStorage.methods['setTag(uint8,bytes32,bytes32)'](group1,keccak256('test3.bytearray'),keccak256('byte value'),{from: adder1});
    var tag_type = await tagStorage.getTagType(keccak256('test3.bytearray'));
    assert.equal(tag_type, BYTE_TYPE, "Tag must be of Byte array type");
    var value = await tagStorage.getByte32Value(keccak256('test3.bytearray'));
    assert.equal(value, '0x'+keccak256('byte value').toString('hex'), "Byte array value must be hash of 'byte value'");
    var group = await tagStorage.getTagGroup(keccak256('test3.bytearray'));
    assert.equal(group,group1,"Tag must be associated to group1");


    await tagStorage.methods['setTag(uint8,bytes32,string)'](group1,keccak256('test3.string'),'string value',{from: adder1});
    tag_type = await tagStorage.getTagType(keccak256('test3.string'));
    assert.equal(tag_type, STRING_TYPE, "Tag must be of String type");
    value = await tagStorage.getStringValue(keccak256('test3.string'));
    assert.equal(value, 'string value', "String value must be 'string value'");
    group = await tagStorage.getTagGroup(keccak256('test3.string'));
    assert.equal(group,group1,"Tag must be associated to group1");


    await tagStorage.methods['setTag(uint8,bytes32,uint256)'](group1,keccak256('test3.int'),100,{from: adder1});
    tag_type = await tagStorage.getTagType(keccak256('test3.int'));
    assert.equal(tag_type, INTEGER_TYPE, "Tag must be of Integer type");
    value = await tagStorage.getIntValue(keccak256('test3.int'));
    assert.equal(value, 100, "Int value must be 100");
    group = await tagStorage.getTagGroup(keccak256('test3.int'));
    assert.equal(group,group1,"Tag must be associated to group1");

    await tagStorage.methods['setTag(uint8,bytes32,bool)'](group1,keccak256('test3.bool'),true,{from: adder1});
    tag_type = await tagStorage.getTagType(keccak256('test3.bool'));
    assert.equal(tag_type, BOOLEAN_TYPE, "Tag must be of Boolean type");
    value = await tagStorage.getBooleanValue(keccak256('test3.bool'));
    assert.equal(value, true, "Boolean value must be true");
    group = await tagStorage.getTagGroup(keccak256('test3.bool'));
    assert.equal(group,group1,"Tag must be associated to group1");

  });

});
