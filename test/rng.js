const {
  ether,
  send,
  BN,           
  constants,    
  expectEvent,  
  expectRevert, 
} = require('@openzeppelin/test-helpers');

const RNG = artifacts.require("RNG");

const keccak256 = require('keccak256');

contract("RNG", accounts => {


  it("RNG distribution tests", async () => {
    const rng = await RNG.deployed();
    await rng.setCommitmentConfirmationCap(1);
    
    
  });

});
