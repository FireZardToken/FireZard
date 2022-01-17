const {
  ether,
  send,
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');

const NFT = artifacts.require("FireZardNFT");
const Stats = artifacts.require("DragonStats");
const View = artifacts.require("StatsView");
const Treasury = artifacts.require("Treasury");
const TagStorage = artifacts.require("TagStorage");
const Util = artifacts.require("Util");

const chai = require('chai');

chai.use(require('chai-bn')(BN));
const should = require('chai').should();

const UR = 37232725125;
const SR = 398899492231;
const R  = 609425615360;
const U  = 97547893934;
const C  = 831088583595;

const UR2 = 215653727565;
const SR2 = 942178954528;
const R2  = 384414581383;
const U2  = 954880605996;
const C2  = 809757709714;


const NON_DRAGON_CARD_TYPE_CODE = '0x73582846693746278759238757361865984702752638587659ABC36774745000';

const NON_DRAGON_CARD_IDS = ['0x10','0x20','0x30','0x40','0x50','0x60','0x70','0x80','0x90','0x100'];

const claimCheck = async(token_id, account, delegatedClaim) => {
	let from;
	if(delegatedClaim)
	    from = this.minter;
	else
	    from = account;
	var rarity = new BN((await this.view.getStat(this.DRAGON_CARD_TYPE_CODE, token_id, 'rarity')).int_val);
//	var reward = await this.treasury.getRewardValue(rarity);
	var reward = new BN(await this.treasury.getRewardValue(rarity));
	var before_balance = new BN(await web3.eth.getBalance(account));
	var expected_amount =before_balance.add(reward);
	var tx_receipt = await this.treasury.claim(token_id, {from: from});
	var tx = await web3.eth.getTransaction(tx_receipt.tx);
	var balance = new BN(await web3.eth.getBalance(account));
	if(!delegatedClaim){
	    var gas_used = new BN(tx_receipt.receipt.gasUsed);
	    var gas_price = new BN(tx.gasPrice);
	    var txCost = gas_price.mul(gas_used);
	    balance = balance.add(txCost);
	}
	balance.should.be.bignumber.equals(expected_amount);
}

const claimCheckExpectFail = async(token_id, account, error_msg, delegatedClaim, nonMinter) => {
	let _minter;
	if(nonMinter)
	    _minter = this.non_minter;
	else
	    _minter= this.minter;
	let from;
	if(delegatedClaim)
	    from = _minter;
	else
	    from = account;
	expectRevert(
	    this.treasury.claim(token_id,{from: from}),
	    error_msg
	);
}

const checkWithdraw = (accounts) => {

    context("The deposit", () => {
	describe("Withdrawing", () => {
	    it("Fail to withdraw as non-admin", async () => {
		expectRevert(
		    this.treasury.withdraw(accounts[7],ether('10'), {from: accounts[6]}),
		    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
		);
	    });

	    it("Withdraw as admin", async () => {
		var before_balance = new BN(await web3.eth.getBalance(accounts[7]));
		var expected_amount =before_balance.add(new BN(ether('10')));
		await this.treasury.withdraw(accounts[7],ether('10'));
		var balance = new BN(await web3.eth.getBalance(accounts[7]));
		balance.should.be.bignumber.equals(expected_amount);
	    });
	});
    });
}

const mint = async(account, token_id, dragon_card) => {
    var NFT_CODE;
    if(dragon_card)
	NFT_CODE = this.DRAGON_CARD_TYPE_CODE;
    else
	NFT_CODE = NON_DRAGON_CARD_TYPE_CODE;
    await this.nft.mint(
	account,
	token_id,
	1,
	NFT_CODE
    );
    var rarity_override_key = await this.util.getTagKey(token_id,"rarity_override");
    await this.tag_storage.setTag(0,rarity_override_key,false);
}

const checkRewardingBehavior = (accounts, delegatedClaim) => {
    let context_msg;
    let _UR;
    let _SR;
    let _R;
    let _U;
    let _C;

    if(delegatedClaim){
	context_msg = "Minter claims rewards for token owners";
	_UR = UR;
	_SR = SR;
	_R = R;
	_U = U;
	_C = C;
    }else{
	context_msg = "Token owners claim rewards for their tokens";
	_UR = UR2;
	_SR = SR2;
	_R = R2;
	_U = U2;
	_C = C2;
    }

    context(context_msg, () => {
	describe("Claim rewards for non-existent tokens", () => {
	    it("Fail to claim rewards", async () => {
		err_msg = "Treasury: The token must be present in single quantity";
		await claimCheckExpectFail(_UR, accounts[1], err_msg, delegatedClaim);
		await claimCheckExpectFail(_SR, accounts[2], err_msg, delegatedClaim);
		await claimCheckExpectFail(_R,  accounts[3], err_msg, delegatedClaim);
		await claimCheckExpectFail(_U,  accounts[4], err_msg, delegatedClaim);
		await claimCheckExpectFail(_C,  accounts[5], err_msg, delegatedClaim);
	    });
	});

	describe("Claim rewards for minted tokens", () => {

	    before( async () => {
		await this.tag_storage.grantAdderRole(accounts[0]);
		await this.tag_storage.addEditor2Group(accounts[0],0);
		await mint(accounts[1],_UR,true);
		await mint(accounts[2],_SR,true);
		await mint(accounts[3],_R,true);
		await mint(accounts[4],_U,true);
		await mint(accounts[5],_C,true);

		this.shift=0;
		if(delegatedClaim)this.shift=5;

		await mint(accounts[1], NON_DRAGON_CARD_IDS[0+this.shift],false);
		await mint(accounts[2], NON_DRAGON_CARD_IDS[1+this.shift],false);
		await mint(accounts[3], NON_DRAGON_CARD_IDS[2+this.shift],false);
		await mint(accounts[4], NON_DRAGON_CARD_IDS[3+this.shift],false);
		await mint(accounts[5], NON_DRAGON_CARD_IDS[4+this.shift],false);

	    });

	    if(delegatedClaim)
		it("Fail to claim rewards for token owners as non-minter", async () => {
		    err_msg = "Treasury: The reward must be claimed to the token owner -- Reason given: Treasury: The reward must be claimed to the token owner.";
		    await claimCheckExpectFail(_UR, accounts[1], err_msg, delegatedClaim, true);
		    await claimCheckExpectFail(_SR, accounts[2], err_msg, delegatedClaim, true);
		    await claimCheckExpectFail(_R,  accounts[3], err_msg, delegatedClaim, true);
		    await claimCheckExpectFail(_U,  accounts[4], err_msg, delegatedClaim, true);
		    await claimCheckExpectFail(_C,  accounts[5], err_msg, delegatedClaim, true);
		});
	    else
		it("Fail to claim rewards for not owned tokens", async () => {
		    err_msg = "Treasury: The reward must be claimed to the token owner -- Reason given: Treasury: The reward must be claimed to the token owner.";
		    await claimCheckExpectFail(_UR, accounts[2], err_msg, delegatedClaim);
		    await claimCheckExpectFail(_SR, accounts[3], err_msg, delegatedClaim);
		    await claimCheckExpectFail(_R,  accounts[4], err_msg, delegatedClaim);
		    await claimCheckExpectFail(_U,  accounts[5], err_msg, delegatedClaim);
		    await claimCheckExpectFail(_C,  accounts[1], err_msg, delegatedClaim);
		});

	    it("Fail to claim rewards for non-dragon tokens", async () => {
		err_msg = "Treasury: The token must be of Dragon Card NFT type -- Reason given: Treasury: The token must be of Dragon Card NFT type.";
		await claimCheckExpectFail(NON_DRAGON_CARD_IDS[0+this.shift], accounts[1], err_msg, delegatedClaim);
		await claimCheckExpectFail(NON_DRAGON_CARD_IDS[1+this.shift], accounts[2], err_msg, delegatedClaim);
		await claimCheckExpectFail(NON_DRAGON_CARD_IDS[2+this.shift], accounts[3], err_msg, delegatedClaim);
		await claimCheckExpectFail(NON_DRAGON_CARD_IDS[3+this.shift], accounts[4], err_msg, delegatedClaim);
		await claimCheckExpectFail(NON_DRAGON_CARD_IDS[4+this.shift], accounts[5], err_msg, delegatedClaim);
	    });

	    it("Successful claim", async () => {
		await claimCheck(_UR, accounts[1], delegatedClaim);
		await claimCheck(_SR, accounts[2], delegatedClaim);
		await claimCheck(_R,  accounts[3], delegatedClaim);
		await claimCheck(_U,  accounts[4], delegatedClaim);
		await claimCheck(_C,  accounts[5], delegatedClaim);
	    });

	    it("Fail to claim second rewards for same cards", async () => {
		var err_msg = "Treasury: The card's reward has been already claimed -- Reason given: Treasury: The card's reward has been already claimed.";
		await claimCheckExpectFail(_UR, accounts[1], err_msg, delegatedClaim);
		await claimCheckExpectFail(_SR, accounts[2], err_msg, delegatedClaim);
		await claimCheckExpectFail(_R,  accounts[3], err_msg, delegatedClaim);
		await claimCheckExpectFail(_U,  accounts[4], err_msg, delegatedClaim);
		await claimCheckExpectFail(_C,  accounts[5], err_msg, delegatedClaim);
	    });

	});
    });
}

contract("Treasury", (accounts) => {

    before( async () => {
	this.nft    = await NFT.deployed();
	this.stats  = await Stats.deployed();
	this.view	= await View.deployed();
	this.treasury	= await Treasury.deployed();
	this.tag_storage= await TagStorage.deployed();
	this.util      = await Util.deployed();

	this.minter	= accounts[9];
	this.non_minter	= accounts[8];

	this.DRAGON_CARD_TYPE_CODE = await this.util.DRAGON_CARD_TYPE_CODE();
	await this.view.linkStatsLib(this.stats.address, this.DRAGON_CARD_TYPE_CODE);

	await this.treasury.setReward(0,ether('5'));
	await this.treasury.setReward(1,ether('0.5'));
	await this.treasury.setReward(2,ether('0.25'));
	await this.treasury.setReward(3,ether('0.384'));
	await this.treasury.setReward(4,ether('0'));

	var MINTER_ROLE = await this.nft.MINTER_ROLE();
	await this.treasury.grantRole(MINTER_ROLE, this.minter);

	await web3.eth.sendTransaction({from: accounts[0], to: this.treasury.address, value: ether('80')});
    });

    checkRewardingBehavior(accounts, false);
    checkRewardingBehavior(accounts, true);
    checkWithdraw(accounts);
});
