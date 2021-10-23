const {
  ether,
  expectRevert,
} = require('@openzeppelin/test-helpers');


const keccak256 = require('keccak256');

const { toHex, generateChallengeSolution } = require('../client/src/miner.js');

const should = require('chai').should();

const checkBalance = async (instance, account, expected_balance, expected_supply) => {
    if(expected_supply != -1){
        const supply = await instance.totalSupply.call();
        supply.should.be.a.bignumber.that.equals(expected_supply);
    }
    const balance = await instance.balanceOf.call(account);
    balance.should.be.a.bignumber.that.equals(expected_balance);
}

const checkAllowance = async (instance, owner, spender, expected_allowance) => {
    const allowance = await instance.allowance.call(owner, spender);
    allowance.should.be.a.bignumber.that.equals(expected_allowance);
}

const checkStake = async (instance, account, expected_balance, expected_supply, expected_stake, expected_total_stake) => {                                                                                                             
    await checkBalance(instance, account, expected_balance, expected_supply);                                                                                                                                                    
    if(expected_total_stake != -1){                                                                                                                                                                                              
        const total = await instance.totalStake.call();                                                                                                                                                                          
        total.should.be.a.bignumber.that.equals(expected_total_stake);                                                                                                                                                           
    }
    var stake = await instance.stakeOf.call(account);
    stake.should.be.a.bignumber.that.equals(expected_stake);

}

const mine_pow = async (instance, account) => {
    var difficulty = await instance.difficulty.call();
    var prevBlock  = await instance.prevBlock.call();
    var start      = Math.floor(Math.random()*(10**12));
    var nonce   = generateChallengeSolution(difficulty, prevBlock, account, start, start+10**9);
    await instance.powMine(nonce, {from: account});
    return nonce;
}

const mine_pos = async (instance, account) => {
    var random_value = keccak256(Buffer.from(Math.random().toString(16)));
    await instance.posMine(random_value, {from: account});
    return random_value;
}

const testMinePos = async (instance, iterations, default_account) => {
    for(var i=0; i<iterations; i++){
        await expectRevert(
                instance.disableMining({from: default_account}),
                'Not a mining admin -- Reason given: Not a mining admin.'
        );

        var slot = await instance.getSlot.call();
        if(slot == 255)slot=0;
        var next_staker = await instance.getStaker.call(slot);
        var staker_balance = await instance.balanceOf.call(next_staker);
        var staker_stake = await instance.stakeOf.call(next_staker);
        var total_supply = await instance.totalSupply.call();
        var total_stake = await instance.totalStake.call();

        await mine_pos(instance, next_staker);
        await checkStake(instance,next_staker,staker_balance.add(ether('4')),total_supply.add(ether('4')),staker_stake,total_stake);

        var newSlot = await instance.getSlot.call();
        if(newSlot != 255)
            await expectRevert(
                mine_pos(instance, next_staker),
                'BadiumERC20: Attempt to double mine in the same slot -- Reason given: BadiumERC20: Attempt to double mine in the same slot.'
            );
        else
            await expectRevert(
                mine_pos(instance, next_staker),
                'New epoch did not start yet -- Reason given: New epoch did not start yet.'
            );
        await checkStake(instance,next_staker,staker_balance.add(ether('4')),total_supply.add(ether('4')),staker_stake,total_stake);

    }
}


const testDeterministicStakerChoice = async (instance, iterations) => {
    var prev_staker = null;
    for(var i=0; i<iterations; i++){
        var slot = await instance.getSlot.call();
        if(slot == 255)slot=-1;
        var reward_hash = await instance.getRewardHash.call(slot+1);
        var next_staker = await instance.getStakerFromHash.call(reward_hash);
        if(prev_staker!=null)
            assert(next_staker == prev_staker, 'Stacker selector is not deterministic on same input data!');
        prev_staker = next_staker;
    }
}

module.exports = { checkBalance, mine_pow, mine_pos, testMinePos, testDeterministicStakerChoice, checkAllowance, checkStake }
