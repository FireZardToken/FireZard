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
      return Buffer.from(keccak256(toHex(nonce)), 'hex');
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

contract("RNG", accounts => {


  it("RNG distribution tests", async () => {
    const rng = await RNG.deployed();
    const test_rng = await TestRNG.deployed();

    await rng.setCommitmentConfirmationCap(1);
    
    const nonce1 = generateNonce();
    const commitment1 = hash(nonce1);

    await rng.commit(commitment1);
    const rvalue1 = await rng.getRandomValue(nonce1);
    const coin_side = await test_rng.tossCoin(rvalue1);

    console.log(rvalue1.toString(10));
    console.log(coin_side);

  });

});
