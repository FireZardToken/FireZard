
const TagStorage = artifacts.require("FireZardTagStorage");

const keccak256 = require('keccak256');

contract("FireZArdTagStorage", accounts => {


  it("Token deployed params", async () => {
    const tagStorage = await TagStorage.deployed();


  });


});
