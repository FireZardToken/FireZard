const {
  ether,
  send,
  BN,           
  constants,    
  expectEvent,  
  expectRevert, 
} = require('@openzeppelin/test-helpers');

const RNG = artifacts.require("RNG");
const TestRNG = artifacts.require("TestRNG");
const Util = artifacts.require("FireZardUtil");

//const keccak256 = require('keccak256');

const { keccak256 } = require("@ethersproject/keccak256");
const hash = (nonce) => {
      return Buffer.from(keccak256(toHex(nonce)).replace('0x',''), 'hex');
}

const toHex = (num) => {
    var hexS = num.toString(16);
    const length = 32;
    
    while (hexS.length < length) hexS = '0'+hexS;
    return '0x'+hexS;
}

const generateNonce = () => {
    return hash(Math.floor(Math.random()*(10**12)));
}

const getRValue = async(rng, test_rng, commit_period) => {
	const nonce = generateNonce();
	const commitment = keccak256('0x'+nonce.toString('hex'));
	await rng.commit(commitment);

	for(j=0;j<=commit_period-1;j++)
	    await test_rng.writeSomeData(generateNonce());
	await rng.lock(nonce);
	return await rng.read(commitment);
}

const checkTossCoinDistrib = async(rng, test_rng, util, commit_period, rounds) => {
    await rng.setCommitmentConfirmationCap(commit_period);
    var side0 = 0;
    var side1 = 0;
    for(var i=0;i<rounds;i++){
	const rvalue = await getRValue(rng, test_rng, commit_period);
	const coin_side = await test_rng.tossCoin(rvalue);
	if(coin_side == 0)side0++;
	    else side1++;
    }
//    console.log("side0: "+side0);
//    console.log("side1: "+side1);

    assert.equal(Math.abs(side1-side0)<=rounds*0.3,true,"Unbalanced coin flip");
    return (side0<side1);
}

const checkDiceDistrib = async(rng, test_rng, util, commit_period, rounds) => {
    await rng.setCommitmentConfirmationCap(commit_period);
    var side = [];
    for(var i=0;i<6;i++)side[i]=0;
    for(var i=0;i<rounds;i++){
	const rvalue = await getRValue(rng, test_rng, commit_period);
	const dice_side = await test_rng.throwDice(rvalue);
	side[dice_side]++;
    }

    var max  = 0;
    var maxi = 0;
    for(var i=0;i<6;i++){
	console.log("side"+i+": "+side[i]);
	assert.equal((side[i]>=0.5*(rounds/6))&&(side[i]<=1.5*(rounds/6)),true,"Unbalanced dice side "+i);
	if(side[i]>max){
	    max = side[i];
	    maxi = i;
	}
    }
    return maxi;
}

contract("RNG", accounts => {


/*  it("RNG flip coin tests", async () => {
    const rng = await RNG.deployed();
    const test_rng = await TestRNG.deployed();
    const util = await Util.deployed();

    var coin_sides_count = 0;

    for(i=0;i<5;i++)
	if(await checkTossCoinDistrib(rng, test_rng, util, 1, 100))coin_sides_count++;

    assert.equal((coin_sides_count>=2)&&(coin_sides_count<=4),true,"Unbalanced coin flip sides sum");
  });*/

  it("RNG dice tests", async () => {
    const rng = await RNG.deployed();
    const test_rng = await TestRNG.deployed();
    const util = await Util.deployed();

    var dice_sides_count = [];
    dice_sides_count[0]=0;
    dice_sides_count[1]=0;
    dice_sides_count[2]=0;
    dice_sides_count[3]=0;
    dice_sides_count[4]=0;
    dice_sides_count[5]=0;

    for(i=0;i<6;i++)
	dice_sides_count[await checkDiceDistrib(rng, test_rng, util, 1, 100)]++;

    for(i=0;i<6;i++)
	assert.equal(dice_sides_count[i]<3,true,"Biased side "+i+" count");
  });


});
