const {
  ether,
  send,
  BN,           
  constants,    
  expectEvent,  
  expectRevert, 
} = require('@openzeppelin/test-helpers');

const Manager = artifacts.require('CrossContractMan');
const ListenerMock1 = artifacts.require('ListenerMock1');
const ListenerMock2 = artifacts.require('ListenerMock2');

contract("CrossContractMan", function() {

    beforeEach(async function(){
	this.manager   = await Manager.new();
	this.mock1     = await ListenerMock1.new();
	this.mock2     = await ListenerMock2.new();
	this.mock2_alt = await ListenerMock2.new();
	this.MANAGER_ROLE = await this.mock1.MANAGER_ROLE();
    });

    describe("joining", function(){

	beforeEach(async function(){
	    await this.mock1.grantRole(this.MANAGER_ROLE,this.manager.address);
	    await this.manager.addContract('ListenerMock1',this.mock1.address);
	    await this.manager.addContract('ListenerMock2',this.mock2.address);
	});

	context('Mock1 queries Mock2', function() {
	
	    it("Mock1 gets value from Mock2 after Mock2's first addition", async function() {
		var value = await this.mock1.getValue();

		expect(value).to.be.bignumber.equal(1);
	    });

	    it("Mock1 gets value from Mock2 after Mock2's replacement, new Mock2 reads and updates the value from the old Mock2", async function() {

		await this.manager.addContract('ListenerMock2',this.mock2.address);

		var value = await this.mock1.getValue();

		expect(value).to.be.bignumber.equal(4);
	    });

	});

    });

});