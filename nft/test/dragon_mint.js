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
const View = artifacts.require("StatsView");
const DragonView = artifacts.require("DragonCardView");
const Util = artifacts.require("Util");

chai.use(require('chai-bn')(BN));
const should = require('chai').should();

contract("DragonMinter", accounts => {

	var commitments = [];

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
	const minter    = await Minter.deployed();
	const rng       = await RNG.deployed();
	const test_rng  = await TestRNG.deployed();
	const nft       = await NFT.deployed();
	const stats_lib = await Stats.deployed();
	const tag       = await TAG.deployed();
	const view	= await View.deployed();
	const dragonView= await DragonView.deployed();
	const util      = await Util.deployed();

	const DRAGON_CARD_TYPE_CODE = await util.DRAGON_CARD_TYPE_CODE();
	const MAX_UINT = await util.MAX_UINT.call();
	await view.linkStatsLib(stats_lib.address, DRAGON_CARD_TYPE_CODE);

	const stats = await view.stats(DRAGON_CARD_TYPE_CODE);

//	console.log(stats);

	for(var j=0;j<stats.length;j++){
		if(stats[j].name == await stats_lib.RARITY_STR()){
			assert.equal(stats[j].statType, 0, "Rarity stat should be of integer type");
			assert.equal(stats[j].is_mutable, false, "Rarity stat should be immutable");
		}
		if(stats[j].name == await stats_lib.HEALTH_STR()){
			assert.equal(stats[j].statType, 0, "Health stat should be of integer type");
			assert.equal(stats[j].is_mutable, true, "Health stat should be mutable");
		}
		if(stats[j].name == await stats_lib.TYPE_STR()){
			assert.equal(stats[j].statType, 0, "Type stat should be of integer type");
			assert.equal(stats[j].is_mutable, false, "Type stat should be immutable");
		}
		if(stats[j].name == await stats_lib.ATTACK_STR()){
			assert.equal(stats[j].statType, 0, "Attack stat should be of integer type");
			assert.equal(stats[j].is_mutable, true, "Attack stat should be mutable");
		}
		if(stats[j].name == await stats_lib.DEFENSE_STR()){
			assert.equal(stats[j].statType, 0, "Defense stat should be of integer type");
			assert.equal(stats[j].is_mutable, true, "Defense stat should be mutable");
		}
	}


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
	    var rarity = await stats_lib.getStatInt(token_type, id, await stats_lib.RARITY_STR());
	    var card_type = await stats_lib.getStatInt(token_type, id, await stats_lib.TYPE_STR());
	    var attack = await tag.getIntValue(await util.getTagKey(id, await stats_lib.ATTACK_STR()));
	    var defense = await tag.getIntValue(await util.getTagKey(id, await stats_lib.DEFENSE_STR()));
	    var health = await tag.getIntValue(await util.getTagKey(id, await stats_lib.HEALTH_STR()));

	    assert.equal(balance, 1, "Excatly one dragon card must be minted");
	    assert.equal(token_type, DRAGON_CARD_TYPE_CODE, "The NFT must be a dragon card");
	    health.should.be.a.bignumber.equal(MAX_UINT);

	    for(var j=0;j<stats.length;j++){
		    var stat_value = await view.getStat(token_type, id, stats[j].name);
		    assert.equal(stat_value.statType, stats[j].statType, "Stat type must coincide with the queried stat type");
		    if(stats[j].name == await stats_lib.RARITY_STR()){
			assert.equal(stat_value.int_val,rarity,"View must return correct rarity stat");
		    }
		    if(stats[j].name == await stats_lib.HEALTH_STR()){
//			assert.equal(stat_value.int_val,health,"View must return correct rarity stat");
			health.should.be.a.bignumber.equal(stat_value.int_val);
		    }
		    if(stats[j].name == await stats_lib.TYPE_STR()){
			assert.equal(stat_value.int_val,card_type,"View must return correct rarity stat");
		    }
		    if(stats[j].name == await stats_lib.ATTACK_STR()){
//			assert.equal(stat_value.int_val,rarity,"View must return correct rarity stat");
			attack.should.be.a.bignumber.equal(stat_value.int_val);
		    }
		    if(stats[j].name == await stats_lib.DEFENSE_STR()){
//			assert.equal(stat_value.int_val,rarity,"View must return correct rarity stat");
			defense.should.be.a.bignumber.equal(stat_value.int_val);
		    }
	    }

	    var dsv = await dragonView.getView(id);
	    var version = await dragonView.VERSION();
	    assert.equal(dsv.owner,accounts[1],"Owner must be returned correctly");
	    assert.equal(dsv.stacked,1,"Dragon card is not stackable");
	    assert.equal(dsv.nft_type, DRAGON_CARD_TYPE_CODE, "The NFT must be a dragon card");
	    assert.equal(dsv.version, version, "Version must be returned correctly");
	    rarity.should.be.a.bignumber.equal(dsv.rarity);
	    health.should.be.a.bignumber.equal(dsv.health);
	    assert.equal(card_type, dsv.card_type, "Card type must be returned correctly");
	    attack.should.be.a.bignumber.equal(dsv.attack);
	    defense.should.be.a.bignumber.equal(dsv.defense);
	    
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

/*    it("Testing generic stats viewer", async () => {
	const rng  = await RNG.deployed();
	const view = await View.deployed();

	const DRAGON_CARD_TYPE_CODE = await util.DRAGON_CARD_TYPE_CODE();
	const stats = await view.stats(DRAGON_CARD_TYPE_CODE);
	for(var i=0;i<commitments.length;i++){
	    var id = await rng.read(commitments[i]);
	    for(var j=0;j<stats.length;j++){
		
	    }
	}
    }); */
});
