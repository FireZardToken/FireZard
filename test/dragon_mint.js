const {
  ether,
  send,
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');

const chai = require('chai');

const { keccak256 } = require("@ethersproject/keccak256");

const { generateNonce } = require('./helper.js');

const RNG = artifacts.require("RNG");
const TAG = artifacts.require("TagStorage");
const NFT = artifacts.require("FireZardNFT");
const Stats = artifacts.require("DragonStats");
const Minter = artifacts.require("DragonMinter");
const TestRNG = artifacts.require("TestRNG");
const Util = artifacts.require("Util");

chai.use(require('chai-bn')(BN));
const should = require('chai').should();

contract("DragonMinter", accounts => {

    it("Testing authorized DragonMinter control", async () => {
	const minter = await Minter.deployed();
	const rng    = await RNG.deployed();
	const tag    = await TAG.deployed();
	const nft    = await NFT.deployed();
	const stats  = await Stats.deployed();
	
	await expectRevert(
	    minter.linkRNG(rng.address, {from: accounts[1]}),
	    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
	);
	await expectRevert(
	    minter.linkTAG(rng.address, {from: accounts[1]}),
	    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
	);
	await expectRevert(
	    minter.linkNFT(rng.address, {from: accounts[1]}),
	    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
	);
	await expectRevert(
	    minter.linkStatsLib(rng.address, {from: accounts[1]}),
	    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
	);
	await expectRevert(
	    minter.setTagGroupId(10, {from: accounts[1]}),
	    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
	);
	await expectRevert(
	    minter.addMinter(accounts[2], {from: accounts[1]}),
	    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
	);
	await expectRevert(
	    minter.removeMinter(accounts[2], {from: accounts[1]}),
	    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
	);
    });

    it("Testing minting of Dragon cards with (pseudo-)randomly generated stats", async () => {
	const minter   = await Minter.deployed();
	const rng      = await RNG.deployed();
	const test_rng = await TestRNG.deployed();
	const nft      = await NFT.deployed();
	const stats    = await Stats.deployed();
	const tag      = await TAG.deployed();
	const util     = await Util.deployed();

	const DRAGON_CARD_TYPE_CODE = await util.DRAGON_CARD_TYPE_CODE();
	const MAX_UINT = await util.MAX_UINT.call();
//	console.log("DRAGON_CARD_TYPE_CODE: "+DRAGON_CARD_TYPE_CODE);

	var commitments = [];
	var nonces = [];
	for(var i=0;i<10;i++){
	    var nonce = generateNonce();
	    commitments[i] = keccak256('0x'+nonce.toString('hex'));
	    nonces[i] = nonce;
	}
	await minter.initPackage(commitments);

	await test_rng.writeSomeData(generateNonce());

	await minter.lockPackage(nonces);
	
	await minter.openPackage(accounts[1], commitments);

	for(var i=0;i<commitments.length;i++){
//	    console.log("============================================================================");
//	    console.log("Commitment: "+commitments[i]);
//	    console.log("Nonce: "+nonces[i].toString('hex'));
	    var id = await rng.read(commitments[i]);
	    var balance = await nft.balanceOf(accounts[1],id);
	    var token_type = await nft.typeOf(id);
	    var rarity = await stats.getStatInt(token_type, id, await stats.RARITY_STR());
	    var card_type = await stats.getStatInt(token_type, id, await stats.TYPE_STR());
	    var health = await tag.getIntValue(await util.getTagKey(id, await stats.HEALTH_STR()));

	    assert.equal(balance, 1, "Excatly one dragon card must be minted");
	    assert.equal(token_type, DRAGON_CARD_TYPE_CODE, "The NFT must be a dragon card");
	    health.should.be.a.bignumber.equal(MAX_UINT);

/*	    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
	    console.log("ID: "+id);
	    console.log("Balance is "+balance.toString(10));
	    console.log("Token type: "+token_type);
	    console.log("Rarity: "+rarity.toString(10));
	    console.log("Card type: "+card_type.toString(10));
	    console.log("Health: "+health.toString(10));
	    console.log();
	    console.log();*/
	}
    });
});
