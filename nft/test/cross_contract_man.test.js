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

const { expect } = require('chai');

const mock1QueriesMock2 = function() {
	
	    it("Mock1 gets value from Mock2 after Mock2's first addition", async function() {
		var value = await this.mock1.getValue();

		expect(value).to.be.bignumber.equal('1');
	    });

	    it("Mock1 gets value from Mock2 after Mock2's replacement, new Mock2 reads and updates the value from the old Mock2", async function() {

		await this.mock2_alt.grantRole(this.MANAGER_ROLE,this._manager.address);
//		await this._manager.addContract('ListenerMock2',this.mock2_alt.address);
		await this._manager.addContract(this.mock2_alt.address);

		var value = await this.mock1.getValue();

		expect(value).to.be.bignumber.equal('4');
	    });

	}

contract("CrossContractMan", function(accounts){

    beforeEach(async function(){
	this.manager   = await Manager.new();
	this.manager2  = await Manager.new();
	this.mock1     = await ListenerMock1.new();
	this.mock2     = await ListenerMock2.new();
	this.mock2_alt = await ListenerMock2.new();
	this.MANAGER_ROLE = await this.mock1.MANAGER_ROLE();
	this.DEFAULT_ADMIN_ROLE = await this.mock1.DEFAULT_ADMIN_ROLE();
	this.RETIRING_MANAGER_ROLE = await this.manager.RETIRING_MANAGER_ROLE();
/*	console.log("ADMIN: "+accounts[0]);
	console.log("MANAGER: "+this.manager.address);
	console.log("MANAGER2: "+this.manager2.address);
	console.log("MOCK1: "+this.mock1.address);
	console.log("MOCK2: "+this.mock2.address);
	console.log("MOCK2_ALT: "+this.mock2_alt.address);
	console.log("MANAGER_ROLE: "+this.MANAGER_ROLE);
	console.log("DEFAULT_ADMIN_ROLE: "+this.DEFAULT_ADMIN_ROLE);
	console.log("RETIRING_MANAGER_ROLE: "+this.RETIRING_MANAGER_ROLE);*/
    });

    describe("joining", function(){

	beforeEach(async function(){
	    await this.mock1.grantRole(this.MANAGER_ROLE,this.manager.address);
	    await this.mock2.grantRole(this.MANAGER_ROLE,this.manager.address);
//	    await this.manager.addContract('ListenerMock1',this.mock1.address);
//	    await this.manager.addContract('ListenerMock2',this.mock2.address);
	    await this.manager.addContract(this.mock1.address);
	    await this.manager.addContract(this.mock2.address);

	    this._manager = this.manager;
	});

	context('Mock1 queries Mock2', mock1QueriesMock2 );

    });

    describe("joining in reverse order", function(){

	beforeEach(async function(){
	    await this.mock1.grantRole(this.MANAGER_ROLE,this.manager.address);
	    await this.mock2.grantRole(this.MANAGER_ROLE,this.manager.address);
//	    await this.manager.addContract('ListenerMock2',this.mock2.address);
//	    await this.manager.addContract('ListenerMock1',this.mock1.address);
	    await this.manager.addContract(this.mock2.address);
	    await this.manager.addContract(this.mock1.address);
	    this._manager = this.manager;
	});

	context('Mock1 queries Mock2',  mock1QueriesMock2 );

    });

    describe("Updating manager", function(){

	beforeEach(async function(){
	    await this.mock1.grantRole(this.MANAGER_ROLE,this.manager.address);
	    await this.mock2.grantRole(this.MANAGER_ROLE,this.manager.address);
	    await this.mock1.grantRole(this.DEFAULT_ADMIN_ROLE,this.manager.address);
	    await this.mock2.grantRole(this.DEFAULT_ADMIN_ROLE,this.manager.address);
//	    await this.manager.addContract('ListenerMock1',this.mock1.address);
//	    await this.manager.addContract('ListenerMock2',this.mock2.address);
	    await this.manager.addContract(this.mock1.address);
	    await this.manager.addContract(this.mock2.address);
	    await this.manager2.grantRole(this.RETIRING_MANAGER_ROLE,this.manager.address);
	    await this.manager.switchManager(this.manager2.address);
	    this._manager = this.manager2;
//	    this.manager = this.manager2;
	});

	context('Mock1 queries Mock2', mock1QueriesMock2);

    });

    describe("Updating manager, joining in reverse order", function(){

	beforeEach(async function(){
	    await this.mock1.grantRole(this.MANAGER_ROLE,this.manager.address);
	    await this.mock2.grantRole(this.MANAGER_ROLE,this.manager.address);
	    await this.mock1.grantRole(this.DEFAULT_ADMIN_ROLE,this.manager.address);
	    await this.mock2.grantRole(this.DEFAULT_ADMIN_ROLE,this.manager.address);
//	    await this.manager.addContract('ListenerMock2',this.mock2.address);
//	    await this.manager.addContract('ListenerMock1',this.mock1.address);
	    await this.manager.addContract(this.mock2.address);
	    await this.manager.addContract(this.mock1.address);
	    await this.manager2.grantRole(this.RETIRING_MANAGER_ROLE,this.manager.address);
	    await this.manager.switchManager(this.manager2.address);
	    this._manager = this.manager2;
//	    this.manager = this.manager2;
	});

	context('Mock1 queries Mock2', mock1QueriesMock2);

    });



});