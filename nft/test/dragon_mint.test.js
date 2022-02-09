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
const { mint, getView, getInventorySize, getInventorySlots } = require('../client/src/dragon_card.js');

const RNG = artifacts.require("RNG");
const TAG = artifacts.require("TagStorage");
const NFT = artifacts.require("FireZardNFT");
const Stats = artifacts.require("DragonStats");
const Minter = artifacts.require("DragonMinter");
const FLAME_MOCK = artifacts.require("FLAME_MOCK");
const TestRNG = artifacts.require("TestRNG");
const View = artifacts.require("StatsView");
const DragonView = artifacts.require("DragonCardView");
const Manager = artifacts.require('CrossContractMan');
const Util = artifacts.require("Util");

const minter_abi = require('../client/src/contracts/DragonMinter.json');
const dragon_view_abi = require('../client/src/contracts/DragonCardView.json');

chai.use(require('chai-bn')(BN));
const should = require('chai').should();

const mint_test = function() {

    beforeEach(async function(){

	    const manager = this.manager;

	    this.minter  = await Minter.at(await manager.getContract('DragonMinter'));
	    this.rng  = await RNG.at(await manager.getContract('RNG'));
	    this.nft  = await NFT.at(await manager.getContract('FireZardNFT'));
	    this.stats_lib = await Stats.at(await manager.getContract('DragonStats'));
	    this.tag  = await TAG.at(await manager.getContract('TagStorage'));
	    this.view  = await View.at(await manager.getContract('StatsView'));
	    this.flame  = await FLAME_MOCK.at(await manager.getContract('FLAME'));
	    this.dragonView  = await DragonView.at(await manager.getContract('DragonCardView'));
	    this.util      = await Util.deployed();

	    this.test_rng  = await TestRNG.deployed();

    });


    it("Testing minting of Dragon cards with (pseudo-)randomly generated stats", async function() {
	const accounts = this.accounts;
	var commitments = this.commitments;

/*	const minter    = await Minter.deployed();
	const rng       = await RNG.deployed();
	const test_rng  = await TestRNG.deployed();
	const nft       = await NFT.deployed();
	const stats_lib = await Stats.deployed();
	const tag       = await TAG.deployed();
	const view	= await View.deployed();
	const flame	= await FLAME_MOCK.deployed();
	const dragonView= await DragonView.deployed();
	const util      = await Util.deployed();*/

	const minter    = this.minter;
	const rng       = this.rng;
	const test_rng  = this.test_rng;
	const nft       = this.nft;
	const stats_lib = this.stats_lib;
	const tag       = this.tag;
	const view	= this.view;
	const flame	= this.flame;
	const dragonView= this.dragonView;
	const util      = this.util;

//	console.log("minter: "+this.minter);

	const dragon_view_instance = new web3.eth.Contract(
	    dragon_view_abi.abi,
	    dragonView.address
	);

//	await minter.linkFLAME(flame.address);
//	await minter.setPrice(1,ether('1500'));
//	await minter.setPrice(10,ether('10000'));
	await minter.enableMintFee();

	const DRAGON_CARD_TYPE_CODE = await util.DRAGON_CARD_TYPE_CODE();
	const MAX_UINT = await util.MAX_UINT.call();
	await view.linkStatsLib(stats_lib.address);

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
		if(stats[j].name == await stats_lib.RARITY_OVERRIDE_STR()){
			assert.equal(stats[j].statType, 3, "Rarity override stat should be of boolean type");
			assert.equal(stats[j].is_mutable, true, "Rarity override stat should be mutable");
		}
		if(stats[j].name == await stats_lib.CHARACTER_STR()){
			assert.equal(stats[j].statType, 0, "Character stat should be of integer type");
			assert.equal(stats[j].is_mutable, false, "Character stat should be immutable");
		}
		if(stats[j].name == await stats_lib.CHARACTER_NAME_STR()){
			assert.equal(stats[j].statType, 1, "Character name stat should be of string type");
			assert.equal(stats[j].is_mutable, false, "Character name stat should be immutable");
		}
	}


	await flame.transfer(accounts[3], ether('500000'));
	await flame.approve(minter.address, MAX_UINT, {from: accounts[3]});

//	console.log("MINTER - RNG: "+(await minter.RNG_addr()));

	var startInvSize = await dragonView.getInventorySize(accounts[1]);

	var noncommon_found;
	var founds = [];
	founds[0] = false;
	founds[1] = false;
	var tries=0;
	do{
	    tries++;
	    noncommon_found = false;
	    var nonces = [];
	    for(var i=0;i<10;i++){
		var nonce = generateNonce();
		commitments[i] = keccak256('0x'+nonce.toString('hex'));
		nonces[i] = nonce;
	    }
	    var before_balance = new BN(await flame.balanceOf(accounts[3]));
	    await minter.initPackage(commitments, {from: accounts[3]});
	    var after_balance = new BN(await flame.balanceOf(accounts[3]));
	    expected_amount = after_balance.add(ether('10000'));
	    before_balance.should.be.bignumber.equals(expected_amount);

	    await test_rng.writeSomeData(generateNonce(), {from: accounts[3]});

	    await minter.lockPackage(nonces, {from: accounts[3]});

	    await minter.openPackage(accounts[1], commitments, {from: accounts[3]});

	// Checking if card pack of 10 contains no uncommon cards

	    var invSize = await dragonView.getInventorySize(accounts[1]);
	    invSize.should.be.bignumber.equals((new Number(startInvSize)+tries*10).toString('10'));
	    var slots = await dragonView.getInventorySlots(accounts[1], (Number(invSize)-10), 10);

	    for(var i=0;i<commitments.length;i++){
		var id = await rng.read(commitments[i]);
//		console.log("i: "+i+", invSize: "+invSize);
//		console.log("SLOTS["+(i+new Number(invSize)-10)+"]: "+slots[(i+new Number(invSize)-10)]);
		id.should.be.bignumber.equals(new BN(slots[i]));
		var token_type = await nft.typeOf(id);
		var rarity = new BN(await stats_lib.getStatInt(token_type, id, await stats_lib.RARITY_STR()));
		if(rarity.toString(10) !== '4')noncommon_found = true;
		console.log("Rarity: "+rarity);
	    }

	    console.log("Non-common found: "+noncommon_found);

	    for(var i=0;i<commitments.length;i++){
//	    console.log("============================================================================");
//	    console.log("Commitment: "+commitments[i]);
//	    console.log("Nonce: "+nonces[i].toString('hex'));
		var id = await rng.read(commitments[i]);
		var balance = await nft.balanceOf(accounts[1],id);
		var token_type = await nft.typeOf(id);
		var rarity = (new BN(await stats_lib.getStatInt(token_type, id, await stats_lib.RARITY_STR()))).toString(10);
//		var rarity_override = await stats_lib.getStatBool(token_type, id, await stats_lib.RARITY_OVERRIDE_STR());
		var card_type = await stats_lib.getStatInt(token_type, id, await stats_lib.TYPE_STR());
		var attack = await tag.getIntValue(await util.getTagKey(id, await stats_lib.ATTACK_STR()));
		var defense = await tag.getIntValue(await util.getTagKey(id, await stats_lib.DEFENSE_STR()));
		var health = await tag.getIntValue(await util.getTagKey(id, await stats_lib.HEALTH_STR()));
		
		assert.equal(balance, 1, "Excatly one dragon card must be minted");
		assert.equal(token_type, DRAGON_CARD_TYPE_CODE, "The NFT must be a dragon card");
		attack.should.be.a.bignumber.equal(MAX_UINT);
		defense.should.be.a.bignumber.equal(MAX_UINT);
		health.should.be.a.bignumber.equal(MAX_UINT);

		for(var j=0;j<stats.length;j++){
		    if((stats[j].name == 'character')||(stats[j].name == 'character_name'))continue;
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
		if((!noncommon_found)&&(i==4)){
		    rarity.should.be.a.bignumber.equal('4');
		    dsv.rarity.should.be.a.bignumber.equal('3');
		}else{
//		    assert.equal(rarity_override,false,"The common rarity type of this card should not be overriden");
		    rarity.should.be.a.bignumber.equal(dsv.rarity);
		}
		health.should.be.a.bignumber.equal(dsv.health);
		assert.equal(card_type, dsv.card_type, "Card type must be returned correctly");
		attack.should.be.a.bignumber.equal(dsv.attack);
		defense.should.be.a.bignumber.equal(dsv.defense);
	

		dsv = await getView(dragon_view_instance, id);
		assert.equal(dsv.owner,accounts[1],"Owner must be returned correctly");
		assert.equal(dsv.stacked,1,"Dragon card is not stackable");
		assert.equal(dsv.nft_type, DRAGON_CARD_TYPE_CODE, "The NFT must be a dragon card");
		assert.equal(dsv.version, version, "Version must be returned correctly");
//		rarity.should.be.a.bignumber.equal(dsv.rarity);
		if((!noncommon_found)&&(i==4)){
		    rarity.should.be.a.bignumber.equal('4');
		    dsv.rarity.should.be.a.bignumber.equal('3');
		}else{
//		    assert.equal(rarity_override,false,"The common rarity type of this card should not be overriden");
		    rarity.should.be.a.bignumber.equal(dsv.rarity);
		}

		console.log(dsv);

		health.should.be.a.bignumber.equal(dsv.health);
		assert.equal(card_type, dsv.card_type, "Card type must be returned correctly");
		attack.should.be.a.bignumber.equal(dsv.attack);
		defense.should.be.a.bignumber.equal(dsv.defense);

	    }

	    await expectRevert(
		minter.openPackage(accounts[1], commitments),
		'Same dragon card can be openned at most once -- Reason given: Same dragon card can be openned at most once.'
	    );
	    if(noncommon_found)founds[0] = true;
		else founds[1] = true;
	}while((!founds[0])||(!founds[1]));

    });

    it("Testing minting of Dragon cards with the backend nodejs library", async function() {
	const accounts = this.accounts;
	var commitments = this.commitments;

	var tries=0;

/*	const minter    = await Minter.deployed();
	const dragonView= await DragonView.deployed();
	const test_rng  = await TestRNG.deployed();
	const flame	= await FLAME_MOCK.deployed();
	const util      = await Util.deployed();*/

	const minter    = this.minter;
	const dragonView= this.dragonView;
	const test_rng  = this.test_rng;
	const flame	= this.flame;
	const util      = this.util;

	const minter_instance = new web3.eth.Contract(
	    minter_abi.abi,
	    minter.address
	);
	const dragon_view_instance = new web3.eth.Contract(
	    dragon_view_abi.abi,
	    dragonView.address
	);

	const DRAGON_CARD_TYPE_CODE = await util.DRAGON_CARD_TYPE_CODE();
	const MAX_UINT = await util.MAX_UINT.call();

	await flame.transfer(accounts[2], ether('100000'));
	await flame.approve(minter.address, MAX_UINT, {from: accounts[2]});

	const size = 10;

	var startInvSize = await getInventorySize(dragon_view_instance, accounts[1]);

	var cap = await minter_instance.methods.getBlockConfirmationCap().call();
	let [ids, foo] = await Promise.all([
		mint(web3, minter_instance, accounts[2], size),
		setTimeout(() => {test_rng.writeSomeData(generateNonce());}, 3000)
	    ]);

	var invSize = await getInventorySize(dragon_view_instance, accounts[1]);
	invSize.should.be.bignumber.equals((new Number(startInvSize)+tries*10).toString('10'));
	var slots = await getInventorySlots(dragon_view_instance, accounts[1], (Number(invSize)-10), 10);

	for(var i=0;i<ids.size;i++){
	    var dsv = await getView(dragon_view_instance, ids[i]);
	    ids[i].should.be.bignumber.equals(new BN(slots[i]));

	    assert.equal(dsv.stacked, 1, "Excatly one dragon card must be minted");
	    assert.equal(dsv.nft_type, DRAGON_CARD_TYPE_CODE, "The NFT must be a dragon card");
	    dsv.attack.should.be.a.bignumber.equal(MAX_UINT);
	    dsv.defense.should.be.a.bignumber.equal(MAX_UINT);
	    dsv.health.should.be.a.bignumber.equal(MAX_UINT);
	}

    });

    it("Testing nft transfer", async function() {
	const accounts = this.accounts;
	var commitments = this.commitments;

//	const nft       = await NFT.deployed();
	const nft	= this.nft;
	
	const balance1 = await nft.balanceOf(accounts[4],10);
	balance1.should.be.a.bignumber.equal(this.init_balance[4].toString('10'));

	await nft.mint(accounts[4],10,10,'0x');
	const balance2 = await nft.balanceOf(accounts[4],10);
	balance2.should.be.a.bignumber.equal((this.init_balance[4]+10).toString('10'));

//	await nft.safeTransferFrom(accounts[4], accounts[5], 10, 10, '0x', {from: accounts[4]});
	await nft.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](accounts[4], accounts[5], 10, 6, '0x', {from: accounts[4]});
	const balance3 = await nft.balanceOf(accounts[4],10);
	balance3.should.be.a.bignumber.equal((this.init_balance[4]+4).toString('10'));
	const balance4 = await nft.balanceOf(accounts[5],10);
	balance4.should.be.a.bignumber.equal((this.init_balance[5]+6).toString('10'));

    });

}



contract("DragonMinter", function(accounts) {

    before(async function(){
	this.accounts = accounts;
	this.commitments = [];

	this.manager = await Manager.deployed();
    });

/*    it("Testing authorized DragonMinter control", async () => {
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
    });*/


    describe('First deployment', function() {

	before(async function(){
	    this.init_balance = [];
	    this.init_balance[4] = 0;
	    this.init_balance[5] = 0;
	});

	context("Minting", mint_test);

    });

    describe('Second deployment', function() {

	before(async function(){
	    this.init_balance = [];
	    this.init_balance[4] = 4;
	    this.init_balance[5] = 6;

	});

	context("Minting", function(){

	    before(async function(){
		const manager = this.manager;

		this.minter  = null;
		this.rng  = null;
		this.nft  = null;
		this.stats_lib = null;
		this.tag  = null;
		this.view  = null;
		this.flame  = null;
		this.dragonView  = null;

		minter  = await Minter.new();
		rng  = await RNG.new(false);
		stats_lib = await Stats.new();
		view  = await View.new();
		dragonView  = await DragonView.new();

		await minter.grantRole(await minter.MANAGER_ROLE(), manager.address);
		await rng.grantRole(await rng.MANAGER_ROLE(), manager.address);
		await stats_lib.grantRole(await stats_lib.MANAGER_ROLE(), manager.address);
		await view.grantRole(await view.MANAGER_ROLE(), manager.address);
		await dragonView.grantRole(await dragonView.MANAGER_ROLE(), manager.address);


		await manager.addContract(minter.address);
		await manager.addContract(rng.address);
		await manager.addContract(stats_lib.address);
		await manager.addContract(view.address);
		await manager.addContract(dragonView.address);

		const nft = await NFT.at(await manager.getContract('FireZardNFT'));
		nft.grantRole(await nft.MINTER_ROLE(), minter.address);
		const tag = await TAG.at(await manager.getContract('TagStorage'));
		tag.grantAdderRole(minter.address);


	    });

	    mint_test();

	});

    });


});
