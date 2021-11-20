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
    return Math.floor(Math.random()*(10**12));
}

const checkTossCoinDistrib = async(rng, test_rng, commit_period, rounds) => {
    await rng.setCommitmentConfirmationCap(commit_period);
    var side0 = 0;
    var side1 = 0;
    for(var i=0;i<rounds;i++){
	const nonce = generateNonce();
	const commitment = hash(nonce);
	await rng.commit(commitment);

	for(j=0;j<commit_period-1;j++)
	    await test_rng.writeSomeData(generateNonce());
	const rvalue = await rng.getRandomValue(nonce);
	const coin_side = await test_rng.tossCoin(rvalue);
	console.log(nonce);
	console.log(commitment.toString('hex'));
	console.log(rvalue.toString(10));
	console.log(coin_side.toString(10));
	if(coin_side == 0)side0++;
	    else side1++;
    }
    console.log("side0: "+side0);
    console.log("side1: "+side1);
}

contract("RNG", accounts => {


  it("RNG distribution tests", async () => {
    const rng = await RNG.deployed();
    const test_rng = await TestRNG.deployed();

    await checkTossCoinDistrib(rng, test_rng, 1, 10);

  });

});
