const {
  ether,
  send,
  BN,           
  constants,    
  expectEvent,  
  expectRevert, 
} = require('@openzeppelin/test-helpers');

const BadiumERC20 = artifacts.require("BadiumERC20");

const { checkBalance, mine_pow, mine_pos, testMinePos, testDeterministicStakerChoice, checkAllowance, checkStake } = require("./test_helper.js");

const keccak256 = require('keccak256');

const { toHex, generateChallengeSolution } = require('../client/src/miner.js');

contract("BadiumERC20", accounts => {

    const total_supply1 = (10**7)-4000+6000+3000+1000;
    const total_supply2 = total_supply1+32*4;

  it("Token deployed params", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();

    // Get token name
    const name = await BadiumERC20Instance.name.call();
    assert.equal(name,"Badium","Name must be Badium, but it is "+name);

    // Get token symbol
    const symbol = await BadiumERC20Instance.symbol.call();
    assert.equal(symbol,"BAD","Symbol must be BAD, but it is "+symbol);

    // Get token decimals
    const decimals = await BadiumERC20Instance.decimals.call();
    assert.equal(decimals,18,"Decimals must be 18, but it is "+decimals);

    // Check token total supply and owner's balance
    await checkBalance(BadiumERC20Instance,accounts[0],ether("10000000"),ether("10000000"));

  });

  it("Owner's extended ERC20 operations: burn, mint, transfer", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();


    // Onwer burns 4000
    await BadiumERC20Instance.burn(ether("4000"), {from: accounts[0]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000).toString(10)),ether(((10**7)-4000).toString(10)));


    // Onwer mints 6000 to account1
    await BadiumERC20Instance.mint(accounts[1], ether("6000"), {from: accounts[0]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000).toString(10)),ether(((10**7)-4000+6000).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("6000"),-1);

    // Onwer mints 3000 to account0
    await BadiumERC20Instance.mint(accounts[0], ether("3000"), {from: accounts[0]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000).toString(10)),ether(((10**7)-4000+6000+3000).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("6000"),-1);

    // Owner transfers 2000 from account1 to account2
    await BadiumERC20Instance.transferFrom(accounts[1],accounts[2],ether("2000"), {from: accounts[0]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000).toString(10)),ether(((10**7)-4000+6000+3000).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("2000"),-1);

// Owner transfers 1000 from account2 to account3
    await BadiumERC20Instance.transferFrom(accounts[2],accounts[3],ether("1000"), {from: accounts[0]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000).toString(10)),ether(((10**7)-4000+6000+3000).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("1000"),-1);

// Owner transfers 2000 from account2 to account4
    await expectRevert(
        BadiumERC20Instance.transferFrom(accounts[2],accounts[4],ether("2000"), {from: accounts[0]}),
        'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.'
    );

// Owner transfers 500 from account3 to account0
    await BadiumERC20Instance.transferFrom(accounts[3],accounts[0],ether("500"), {from: accounts[0]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500).toString(10)),ether(((10**7)-4000+6000+3000).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);

  });

  it("User's extended ERC20 operations: buy, transfer, burn. Owner withdraws invested eth", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();

    // Adding eligible users
    await BadiumERC20Instance.addBuyer(accounts[5]);
    await BadiumERC20Instance.addBuyer(accounts[6]);
    await BadiumERC20Instance.addBuyer(accounts[7]);
    await BadiumERC20Instance.addBuyer(accounts[8]);
    await BadiumERC20Instance.addBuyer(accounts[9]);

    // Account5 buyes 1000 BADs
    await send.ether(accounts[5], BadiumERC20Instance.address, ether("10"));
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("0"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("0"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("0"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("0"),-1);

    // Account5 sends 500 to account6
    await BadiumERC20Instance.transfer(accounts[6],ether("500"), {from: accounts[5]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("0"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("0"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("0"),-1);

    // Account5 authorizes account8 to spend 440
    await BadiumERC20Instance.approve(accounts[8],ether("440"), {from: accounts[5]});
    await checkAllowance(BadiumERC20Instance,accounts[5],accounts[8],ether("440"));

    // Account8 sends 400 to account7 from account5
    await BadiumERC20Instance.transferFrom(accounts[5],accounts[7],ether("400"), {from: accounts[8]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("100"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("0"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("0"),-1);
    await checkAllowance(BadiumERC20Instance,accounts[5],accounts[8],ether("40"));


    // Account8 tries to exceed the allowance from account5
    await expectRevert(
        BadiumERC20Instance.transferFrom(accounts[5],accounts[9],ether("50"), {from: accounts[8]}),
        'ERC20: transfer amount exceeds allowance -- Reason given: ERC20: transfer amount exceeds allowance.'
    );

    // Account8 sends 40 to account8 from account5
    await BadiumERC20Instance.transferFrom(accounts[5],accounts[8],ether("40"), {from: accounts[8]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("60"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("0"),-1);
    await checkAllowance(BadiumERC20Instance,accounts[5],accounts[8],ether("0"));

    // Account8 tries to exceed the allowance from account5 again
    await expectRevert(
        BadiumERC20Instance.transferFrom(accounts[5],accounts[8],1, {from: accounts[8]}),
        'ERC20: transfer amount exceeds allowance -- Reason given: ERC20: transfer amount exceeds allowance.'
    );

    // Account5 tries to overspend
    await expectRevert(
        BadiumERC20Instance.transfer(accounts[6],ether("61"), {from: accounts[5]}),
        'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.'
    );

    // Account5 tries to burn 40 
    await expectRevert(
        BadiumERC20Instance.burn(ether("40"), {from: accounts[5]}),
        'BadiumERC20: Not an eligible burner -- Reason given: BadiumERC20: Not an eligible burner.'
    );

    // Account5 authorizes account7 to spend 100
    await BadiumERC20Instance.approve(accounts[7],ether("100"), {from: accounts[5]});
    await checkAllowance(BadiumERC20Instance,accounts[5],accounts[7],ether("100"));

    // Account7 tries to overspend from account5
    await expectRevert(
        BadiumERC20Instance.transferFrom(accounts[5],accounts[9],ether("90"), {from: accounts[7]}),
        'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.'
    );

    // Account7 sends 10 to account9 from account5
    await BadiumERC20Instance.transferFrom(accounts[5],accounts[9],ether("10"), {from: accounts[7]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("50"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("10"),-1);
    await checkAllowance(BadiumERC20Instance,accounts[5],accounts[7],ether("90"));

    // Account6 sends 5 to account5
    await BadiumERC20Instance.transfer(accounts[5],ether("5"), {from: accounts[6]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("55"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("10"),-1);

    // Account7 sends 100 to account0, account0 should be also elligible
    await BadiumERC20Instance.transfer(accounts[0], ether("100"), {from: accounts[7]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("55"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("300"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("10"),-1);

    // Account7 authorizes account8 to spend 100
    await BadiumERC20Instance.approve(accounts[8],ether("100"), {from: accounts[7]});
    await checkAllowance(BadiumERC20Instance,accounts[7],accounts[8],ether("100"));

    // Account8 tries to burn 50 from account7
    await expectRevert(
        BadiumERC20Instance.burnFrom(accounts[7], ether("50"), {from: accounts[8]}),
        'BadiumERC20: Not an eligible burner -- Reason given: BadiumERC20: Not an eligible burner.'
    );

    // Account8 tries to exceed allowance while burning from account7
    await expectRevert(
        BadiumERC20Instance.burnFrom(accounts[7], ether("51"), {from: accounts[8]}),
        'BadiumERC20: Not an eligible burner -- Reason given: BadiumERC20: Not an eligible burner.'
    );

    // Account7 adds 1000 extra allowance to account8
    await BadiumERC20Instance.increaseAllowance(accounts[8],ether("1000"), {from: accounts[7]});
    await checkAllowance(BadiumERC20Instance,accounts[7],accounts[8],ether("1100"));

    // Account8 transfers 100 from account7 to account9
    await BadiumERC20Instance.transferFrom(accounts[7], accounts[9], ether("100"), {from: accounts[8]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("500"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("55"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);
    await checkAllowance(BadiumERC20Instance,accounts[7],accounts[8],ether("1000"));

    // Account7 removes 849 allowance for account8
    await BadiumERC20Instance.decreaseAllowance(accounts[8],ether("849"), {from: accounts[7]});
    await checkAllowance(BadiumERC20Instance,accounts[7],accounts[8],ether("151"));

    // Account8 tries to exceed allowance while transfering from account7 to account9
    await expectRevert(
        BadiumERC20Instance.transferFrom(accounts[7], accounts[9], ether("200"), {from: accounts[8]}),
        'ERC20: transfer amount exceeds allowance -- Reason given: ERC20: transfer amount exceeds allowance.'
    );

    // Illicit account3 sends 100 to eligible account5
    await BadiumERC20Instance.transfer(accounts[5], ether("100"), {from: accounts[3]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("1000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("155"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);

    // Illicit account2 adds 200 allowance for account9
    await BadiumERC20Instance.increaseAllowance(accounts[9],ether("200"), {from: accounts[2]});
    await checkAllowance(BadiumERC20Instance,accounts[2],accounts[9],ether("200"));

    // Elligible account9 transfers 100 from illicit account2 to elligible account5
    await BadiumERC20Instance.transferFrom(accounts[2], accounts[5], ether("100"), {from: accounts[9]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("4000"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("900"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("255"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);
    await checkAllowance(BadiumERC20Instance,accounts[2],accounts[9],ether("100"));

    // Illicit account1 adds 200 allowance for illicit account4
    await BadiumERC20Instance.increaseAllowance(accounts[4],ether("200"), {from: accounts[1]});
    await checkAllowance(BadiumERC20Instance,accounts[1],accounts[4],ether("200"));

    // Illicit account4 transfers 100 from illicit account1 to elligible account5
    await BadiumERC20Instance.transferFrom(accounts[1], accounts[5], ether("100"), {from: accounts[4]});
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("3900"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("900"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("355"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);
    await checkAllowance(BadiumERC20Instance,accounts[1],accounts[4],ether("100"));

    // Owner withdraws invested ETH from Badium contract into accounts 0 and 1
    const totalSupply1 = await BadiumERC20Instance.totalSupply.call();
    const balance0_0 = new BN(await web3.eth.getBalance(accounts[0]));
    const balance1_0 = new BN(await web3.eth.getBalance(accounts[1]));
    await BadiumERC20Instance.withdrawEth(accounts[1], ether('5'));
    const balance0_1 = new BN(await web3.eth.getBalance(accounts[0]));
    const balance1_1 = new BN(await web3.eth.getBalance(accounts[1]));
    balance1_1.sub(balance1_0).should.be.a.bignumber.equal(ether('5'));

    await expectRevert(
        BadiumERC20Instance.withdrawEth(accounts[0], ether('6')),
        'revert'
    );

    await expectRevert(
        BadiumERC20Instance.withdrawEth(accounts[0], ether('3'), {from: accounts[1]}),
        'revert'
    );

    await BadiumERC20Instance.withdrawEth(accounts[0], ether('5'));
    const balance0_2 = new BN(await web3.eth.getBalance(accounts[0]));
    const balance1_2 = new BN(await web3.eth.getBalance(accounts[1]));
    const totalSupply2 = await BadiumERC20Instance.totalSupply.call();
    assert(balance0_2.sub(balance0_1).gt(ether('4.998')), 'Account0 should receive 5 ETH minus gas price for the withdrawEth transaction');

    totalSupply2.should.be.a.bignumber.equal(totalSupply1);

  });

  it("Badium token authorization tests", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();
    const BURNER_ROLE = keccak256('BURNER_ROLE');
    const TRANSFEROR_ROLE = keccak256('TRANSFEROR_ROLE');
    const BUYER_ROLE = keccak256('BUYER_ROLE');

    // Account6 tries to add account4 to burners
    await expectRevert(
        BadiumERC20Instance.grantRole(BURNER_ROLE, accounts[4], {from: accounts[6]}),
        "AccessControl: account "+accounts[6].toLowerCase()+
            " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account "+
            accounts[6].toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000."
    );

    // Account6 tries to add account4 to transferors
    await expectRevert(
        BadiumERC20Instance.grantRole(TRANSFEROR_ROLE, accounts[4], {from: accounts[6]}),
        "AccessControl: account "+accounts[6].toLowerCase()+
            " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account "+
            accounts[6].toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000."
    );

    // Account6 tries to add account4 to buyers
    await expectRevert(
        BadiumERC20Instance.grantRole(BUYER_ROLE, accounts[4], {from: accounts[6]}),
        "AccessControl: account "+accounts[6].toLowerCase()+
            " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account "+
            accounts[6].toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000."
    );

    // Account6 tries to remove account5 from buyers
    await expectRevert(
        BadiumERC20Instance.revokeRole(BUYER_ROLE, accounts[5], {from: accounts[6]}),
        "AccessControl: account "+accounts[6].toLowerCase()+
            " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account "+
            accounts[6].toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000."
    );

    // Account5 tries to mint to account8
    await expectRevert(
        BadiumERC20Instance.mint(accounts[8], ether("100"), {from: accounts[5]}),
        'ERC20PresetMinterPauser: must have minter role to mint -- Reason given: ERC20PresetMinterPauser: must have minter role to mint.'
    );

    // Account5 tries to mint to account5
    await expectRevert(
        BadiumERC20Instance.mint(accounts[5], ether("100"), {from: accounts[5]}),
        'ERC20PresetMinterPauser: must have minter role to mint -- Reason given: ERC20PresetMinterPauser: must have minter role to mint.'
    );

    // Account5 tries to mint to account4
    await expectRevert(
        BadiumERC20Instance.mint(accounts[4], ether("100"), {from: accounts[5]}),
        'ERC20PresetMinterPauser: must have minter role to mint -- Reason given: ERC20PresetMinterPauser: must have minter role to mint.'
    );

    // Account5 tries to mint to account0
    await expectRevert(
        BadiumERC20Instance.mint(accounts[0], ether("100"), {from: accounts[5]}),
        'ERC20PresetMinterPauser: must have minter role to mint -- Reason given: ERC20PresetMinterPauser: must have minter role to mint.'
    );

    // Account1 tries to mint to account1
    await expectRevert(
        BadiumERC20Instance.mint(accounts[1], ether("100"), {from: accounts[1]}),
        'ERC20PresetMinterPauser: must have minter role to mint -- Reason given: ERC20PresetMinterPauser: must have minter role to mint.'
    );

    // Account4 tries to purchase 1000 BADs
    await expectRevert(
        send.ether(accounts[4], BadiumERC20Instance.address, ether("10")),
        'BadiumERC20: Not an eligible buyer'
    );

    // Eligible account6 tries to transfer to illicit account4
    await expectRevert(
        BadiumERC20Instance.transfer(accounts[4], ether("100"), {from: accounts[6]}),
        'BadiumERC20: Not an eligible buyer'
    );

    // Elligible account5 adds 200 allowance for elligible account6
    await BadiumERC20Instance.increaseAllowance(accounts[6],ether("200"), {from: accounts[5]});
    await checkAllowance(BadiumERC20Instance,accounts[5],accounts[6],ether("200"));

    // Eligible account6 tries to transfer from eligible account5 to illicit account4
    await expectRevert(
        BadiumERC20Instance.transferFrom(accounts[5], accounts[4], ether("100"), {from: accounts[6]}),
        'BadiumERC20: Not an eligible buyer'
    );

    // Illicit account3 adds 200 allowance for elligible account6
    await BadiumERC20Instance.increaseAllowance(accounts[6],ether("200"), {from: accounts[3]});
    await checkAllowance(BadiumERC20Instance,accounts[3],accounts[6],ether("200"));

    // Eligible account6 tries to transfer from illicit account3 to illicit account4
    await expectRevert(
        BadiumERC20Instance.transferFrom(accounts[3], accounts[4], ether("100"), {from: accounts[6]}),
        'BadiumERC20: Not an eligible buyer'
    );

    // Account5 becomes illicit
    await BadiumERC20Instance.removeBuyer(accounts[5], {from: accounts[0]});

    // Account5 tries to purchase 1000 BADs
    await expectRevert(
        send.ether(accounts[5], BadiumERC20Instance.address, ether("10")),
        'BadiumERC20: Not an eligible buyer'
    );

    // Eligible account6 tries to transfer to illicit account5
    await expectRevert(
        BadiumERC20Instance.transfer(accounts[5], ether("100"), {from: accounts[6]}),
        'BadiumERC20: Not an eligible buyer'
    );

    await expectRevert(
        BadiumERC20Instance.disableMining({from: accounts[6]}),
        'Not a mining admin -- Reason given: Not a mining admin.'
    );

    await expectRevert(
        BadiumERC20Instance.resetPoW(30,{from: accounts[6]}),
        'Not a mining admin -- Reason given: Not a mining admin.'
    );

  });

  it("PoW mining", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();


    await BadiumERC20Instance.resetPoW(10, {from: accounts[0]});

    await BadiumERC20Instance.addBuyer(accounts[4]);

    const difficulty1 = await BadiumERC20Instance.difficulty.call();
    assert.equal(difficulty1, 10, "Difficulty should be 10, but it is "+difficulty1);

    await BadiumERC20Instance.disableMining({from: accounts[0]});

    await expectRevert(
        mine_pow(BadiumERC20Instance, accounts[4]),
        'Not in PoW mining mode -- Reason given: Not in PoW mining mode.'
    );

    await BadiumERC20Instance.resetPoW(10, {from: accounts[0]});

    const difficulty1a = await BadiumERC20Instance.difficulty.call();
    assert.equal(difficulty1a, 10, "Difficulty should be 10, but it is "+difficulty1a);

    for(var i=1;i<=10;i++){ // Run 10 solutions for every block in a row. Should cause difficulty readjustment towards increase
        await mine_pow(BadiumERC20Instance, accounts[4]);
        await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1+i*4).toString(10)));
        await checkBalance(BadiumERC20Instance,accounts[1],ether("3900"),-1);
        await checkBalance(BadiumERC20Instance,accounts[2],ether("900"),-1);
        await checkBalance(BadiumERC20Instance,accounts[3],ether("400"),-1);
        await checkBalance(BadiumERC20Instance,accounts[4],ether(Number(i*4).toString()),-1);
        await checkBalance(BadiumERC20Instance,accounts[5],ether("355"),-1);
        await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
        await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
        await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
        await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);
    }

    const difficulty2 = await BadiumERC20Instance.difficulty.call();
    assert.equal(difficulty2, 11, "Difficulty should be 11, but it is "+difficulty2);

    for(var i=11;i<=20;i++){ // Run 10 solutions for every second block in a row. Difficulty should stay the same
        await send.ether(accounts[0], accounts[1], 1); // do some TX to skip one block
        await mine_pow(BadiumERC20Instance, accounts[4]);
        await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1+i*4).toString(10)));
        await checkBalance(BadiumERC20Instance,accounts[1],ether("3900"),-1);
        await checkBalance(BadiumERC20Instance,accounts[2],ether("900"),-1);
        await checkBalance(BadiumERC20Instance,accounts[3],ether("400"),-1);
        await checkBalance(BadiumERC20Instance,accounts[4],ether(Number(i*4).toString()),-1);
        await checkBalance(BadiumERC20Instance,accounts[5],ether("355"),-1);
        await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
        await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
        await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
        await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);
    }

    const difficulty3 = await BadiumERC20Instance.difficulty.call();
    assert.equal(difficulty3, 11, "Difficulty should be 11, but it is "+difficulty3);

        await send.ether(accounts[0], accounts[1], 1); // do some TX to skip one block
        await send.ether(accounts[0], accounts[1], 1); // do some TX to skip one block


    for(var i=21;i<=30;i++){ // Run 10 solutions for every third block in a row. Difficulty readjusts towards decrease

        await send.ether(accounts[0], accounts[1], 1); // do some TX to skip one block
        await send.ether(accounts[0], accounts[1], 1); // do some TX to skip one block
        await mine_pow(BadiumERC20Instance, accounts[4]);
        await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1+i*4).toString(10)));
        await checkBalance(BadiumERC20Instance,accounts[1],ether("3900"),-1);
        await checkBalance(BadiumERC20Instance,accounts[2],ether("900"),-1);
        await checkBalance(BadiumERC20Instance,accounts[3],ether("400"),-1);
        await checkBalance(BadiumERC20Instance,accounts[4],ether(Number(i*4).toString()),-1);
        await checkBalance(BadiumERC20Instance,accounts[5],ether("355"),-1);
        await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
        await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
        await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
        await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);
    }

    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply1+30*4).toString(10)));

    const difficulty4 = await BadiumERC20Instance.difficulty.call();
    assert.equal(difficulty4, 10, "Difficulty should be 10, but it is "+difficulty4);

    // Trying to double mine
    const nonce1 = await mine_pow(BadiumERC20Instance, accounts[4]);
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply2-4).toString(10)));
    await expectRevert(
        BadiumERC20Instance.powMine(nonce1, {from: accounts[4]}),
        'BadiumERC20: Wrong mining solution, it has less prefix zeros than current difficulty. -- Reason given: BadiumERC20: Wrong mining solution, it has less prefix zeros than current difficulty..'
    );
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply2-4).toString(10)));

    await BadiumERC20Instance.addBuyer(accounts[5]);

    // Trying to mine with other's nonce
    const difficulty5 = await BadiumERC20Instance.difficulty.call();
    const prevBlock5  = await BadiumERC20Instance.prevBlock.call();
    const start5      = Math.floor(Math.random()*(10**12));
    const nonce5      = generateChallengeSolution(difficulty5, prevBlock5, accounts[5], start5, start5+10**9);
    await expectRevert(
        BadiumERC20Instance.powMine(nonce1, {from: accounts[4]}),
        'BadiumERC20: Wrong mining solution, it has less prefix zeros than current difficulty. -- Reason given: BadiumERC20: Wrong mining solution, it has less prefix zeros than current difficulty..'
    );
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply2-4).toString(10)));

    // Account5 mines with his/her nonce
    await BadiumERC20Instance.powMine(nonce5, {from: accounts[5]}),
    await checkBalance(BadiumERC20Instance,accounts[0],ether(((10**7)-4000+3000+500+100).toString(10)),ether((total_supply2).toString(10)));
    await checkBalance(BadiumERC20Instance,accounts[1],ether("3900"),-1);
    await checkBalance(BadiumERC20Instance,accounts[2],ether("900"),-1);
    await checkBalance(BadiumERC20Instance,accounts[3],ether("400"),-1);
    await checkBalance(BadiumERC20Instance,accounts[4],ether(Number(31*4).toString()),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("359"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("495"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("200"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("40"),-1);
    await checkBalance(BadiumERC20Instance,accounts[9],ether("110"),-1);


  });

  it("PoS mining, initial tests, staking", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();

    // Trying PoS mining while ine PoW mode
    await expectRevert(
        mine_pos(BadiumERC20Instance, accounts[4]),
        'Not in PoS mining mode -- Reason given: Not in PoS mining mode.'
    );

    // Switching to PoS
    await BadiumERC20Instance.resetEpoch({from: accounts[0]});
    
    // Trying to mine without any total stake
    await expectRevert(
        mine_pos(BadiumERC20Instance, accounts[4]),
        'Nothing staked so far -- Reason given: Nothing staked so far.'
    );

    // Account4 puts 40 BAD to stake
    await BadiumERC20Instance.stake(ether('40'), {from: accounts[4]});
    await checkStake(BadiumERC20Instance,accounts[4],ether((31*4-40).toString(10)),ether((total_supply2).toString(10)),ether('40'),ether('40'));

    // Account4 puts 10 more BAD to stake
    await BadiumERC20Instance.stake(ether('10'), {from: accounts[4]});
    await checkStake(BadiumERC20Instance,accounts[4],ether((31*4-40-10).toString(10)),ether((total_supply2).toString(10)),ether('50'),ether('50'));

    // Account4 withdraws 15 BAD back from stake
    await BadiumERC20Instance.withdrawStake(ether('15'), {from: accounts[4]});
    await checkStake(BadiumERC20Instance,accounts[4],ether((31*4-40-10+15).toString(10)),ether((total_supply2).toString(10)),ether('35'),ether('35'));

    // Account4 withdraws 35 BAD back from stake, getting all the stake back
    await BadiumERC20Instance.withdrawStake(ether('35'), {from: accounts[4]});
    await checkStake(BadiumERC20Instance,accounts[4],ether((31*4).toString(10)),ether((total_supply2).toString(10)),ether('0'),ether('0'));

    // Setting balance of accounts4,5,6,7,8 to 100 BAD
    await BadiumERC20Instance.transfer(accounts[9], ether("24"),  {from: accounts[4]});
    await BadiumERC20Instance.transfer(accounts[9], ether("259"), {from: accounts[5]});
    await BadiumERC20Instance.transfer(accounts[9], ether("395"), {from: accounts[6]});
    await BadiumERC20Instance.transfer(accounts[9], ether("100"),  {from: accounts[7]});
    await BadiumERC20Instance.transfer(accounts[8], ether("60"),  {from: accounts[9]});

    await checkBalance(BadiumERC20Instance,accounts[4],ether('100'),-1);
    await checkBalance(BadiumERC20Instance,accounts[5],ether("100"),-1);
    await checkBalance(BadiumERC20Instance,accounts[6],ether("100"),-1);
    await checkBalance(BadiumERC20Instance,accounts[7],ether("100"),-1);
    await checkBalance(BadiumERC20Instance,accounts[8],ether("100"),-1);

    // Resetting the epoch
    await BadiumERC20Instance.resetEpoch({from: accounts[0]}); // slot0



  });

  it("PoS mining: account5", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();

    // Account5 stakes 30 BAD
    await BadiumERC20Instance.stake(ether('30'), {from: accounts[5]}); // slot0
    await checkStake(BadiumERC20Instance,accounts[5],ether('70'),ether(total_supply2.toString(10)),ether('30'),ether('30'));

    // Account5 mines one slot
    await mine_pos(BadiumERC20Instance, accounts[5]); // slot0
    await checkStake(BadiumERC20Instance,accounts[5],ether('74'),ether((total_supply2+4).toString(10)),ether('30'),ether('30'));

    // Account5 mines 14 slots
    await testDeterministicStakerChoice(BadiumERC20Instance, 3);
    await testMinePos(BadiumERC20Instance, 14, accounts[1]); // slot1 - slot4
    await checkStake(BadiumERC20Instance,accounts[5],ether('130'),ether((total_supply2+60).toString(10)),ether('30'),ether('30'));


  });

  it("PoS mining: account 5 and 6", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();

    // Account6 stakes 40 BAD
    await BadiumERC20Instance.stake(ether('20'), {from: accounts[6]});
    await BadiumERC20Instance.stake(ether('10'), {from: accounts[6]});
    await BadiumERC20Instance.stake(ether('10'), {from: accounts[6]});
    await checkStake(BadiumERC20Instance,accounts[6],ether('60'),ether((total_supply2+60).toString(10)),ether('40'),ether('70'));

    var stake5_1 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake6_1 = await BadiumERC20Instance.stakeOf.call(accounts[6]);

    // Accounts 5 and 6 mine 18 slots
    await testMinePos(BadiumERC20Instance, 18, accounts[1]);

    var stake5_2 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake6_2 = await BadiumERC20Instance.stakeOf.call(accounts[6]);
    
    assert(stake5_2.sub(stake5_1).lte(stake6_2.sub(stake6_1)), "Account6 should mine more than account5 due to account6 staked more than account5");

  });

  it("PoS mining: accounts 5, 6 and 7", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();

    // Account7 stakes 50 BAD
    await BadiumERC20Instance.stake(ether('20'), {from: accounts[7]});
    await BadiumERC20Instance.stake(ether('10'), {from: accounts[7]});
    await BadiumERC20Instance.stake(ether('20'), {from: accounts[7]});
    await checkStake(BadiumERC20Instance,accounts[7],ether('50'),ether((total_supply2+60+72).toString(10)),ether('50'),ether('120'));

    var stake5_3 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake6_3 = await BadiumERC20Instance.stakeOf.call(accounts[6]);
    var stake7_3 = await BadiumERC20Instance.stakeOf.call(accounts[7]);

    // Accounts 5, 6 and 7 mine 25 slots
    await testDeterministicStakerChoice(BadiumERC20Instance, 10);
    await testMinePos(BadiumERC20Instance, 25, accounts[1]);

    var stake5_4 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake6_4 = await BadiumERC20Instance.stakeOf.call(accounts[6]);
    var stake7_4 = await BadiumERC20Instance.stakeOf.call(accounts[7]);
    
    assert(stake5_4.sub(stake5_3).lte(stake6_4.sub(stake6_3)), "Account6 should mine more than account5 due to account6 staked more than account5");
    assert(stake6_4.sub(stake6_3).lte(stake7_4.sub(stake7_3)), "Account7 should mine more than account6 due to account7 staked more than account6");



  });

  it("PoS mining: accounts 5, 6, 7 and 8", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();


    // Account8 stakes 60 BAD
    await BadiumERC20Instance.stake(ether('20'), {from: accounts[8]});
    await BadiumERC20Instance.stake(ether('20'), {from: accounts[8]});
    await BadiumERC20Instance.stake(ether('20'), {from: accounts[8]});
    await checkStake(BadiumERC20Instance,accounts[8],ether('40'),ether((total_supply2+60+72+100).toString(10)),ether('60'),ether('180'));

    var stake5_5 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake6_5 = await BadiumERC20Instance.stakeOf.call(accounts[6]);
    var stake7_5 = await BadiumERC20Instance.stakeOf.call(accounts[7]);
    var stake8_5 = await BadiumERC20Instance.stakeOf.call(accounts[8]);

    // Accounts 5, 6, 7 and 8 mine 31 slots
    await testDeterministicStakerChoice(BadiumERC20Instance, 30);
    await testMinePos(BadiumERC20Instance, 31, accounts[1]);

    var stake5_6 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake6_6 = await BadiumERC20Instance.stakeOf.call(accounts[6]);
    var stake7_6 = await BadiumERC20Instance.stakeOf.call(accounts[7]);
    var stake8_6 = await BadiumERC20Instance.stakeOf.call(accounts[8]);
    
    assert(stake5_6.sub(stake5_5).lte(stake6_6.sub(stake6_5)), "Account6 should mine more than account5 due to account6 staked more than account5");
    assert(stake6_6.sub(stake6_5).lte(stake7_6.sub(stake7_5)), "Account7 should mine more than account6 due to account7 staked more than account6");
    assert(stake7_6.sub(stake7_5).lte(stake8_6.sub(stake8_5)), "Account8 should mine more than account6 due to account7 staked more than account7");

  });

  it("PoS mining: accounts 5, 7 and 8", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();

    var balance6_7a = await BadiumERC20Instance.balanceOf.call(accounts[6]);

    // Account6 removes all his/her stake
    await BadiumERC20Instance.withdrawStake(ether('10'), {from: accounts[6]});
    await BadiumERC20Instance.withdrawStake(ether('20'), {from: accounts[6]});
    await BadiumERC20Instance.withdrawStake(ether('10'), {from: accounts[6]});
    await checkStake(BadiumERC20Instance,accounts[6],balance6_7a.add(ether('40')),ether((total_supply2+60+72+100+124).toString(10)),ether('0'),ether('140'));

    var stake5_7 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake7_7 = await BadiumERC20Instance.stakeOf.call(accounts[7]);
    var stake8_7 = await BadiumERC20Instance.stakeOf.call(accounts[8]);

    // Accounts 5, 7 and 8 mine 22 slots
    await testMinePos(BadiumERC20Instance, 22, accounts[1]);

    var stake5_8 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake7_8 = await BadiumERC20Instance.stakeOf.call(accounts[7]);
    var stake8_8 = await BadiumERC20Instance.stakeOf.call(accounts[8]);
    
    assert(stake5_8.sub(stake5_7).lte(stake7_8.sub(stake7_7)), "Account7 should mine more than account5 due to account7 staked more than account5");
    assert(stake7_8.sub(stake7_7).lte(stake8_8.sub(stake8_7)), "Account8 should mine more than account6 due to account7 staked more than account7");

  });

  it("PoS mining: accounts 5 and 7", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();


    var balance8_9a = await BadiumERC20Instance.balanceOf.call(accounts[8]);

    // Account8 removes all his/her stake
    await BadiumERC20Instance.withdrawStake(ether('10'), {from: accounts[8]});
    await BadiumERC20Instance.withdrawStake(ether('20'), {from: accounts[8]});
    await BadiumERC20Instance.withdrawStake(ether('30'), {from: accounts[8]});
    await checkStake(BadiumERC20Instance,accounts[8],balance8_9a.add(ether('60')),ether((total_supply2+60+72+100+124+88).toString(10)),ether('0'),ether('80'));

    var stake5_9 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake7_9 = await BadiumERC20Instance.stakeOf.call(accounts[7]);

    // Accounts 5 and 7 mine 32 slots
    await testMinePos(BadiumERC20Instance, 32, accounts[1]);

    var stake5_10 = await BadiumERC20Instance.stakeOf.call(accounts[5]);
    var stake7_10 = await BadiumERC20Instance.stakeOf.call(accounts[7]);
    
    assert(stake5_10.sub(stake5_9).lte(stake7_10.sub(stake7_9)), "Account7 should mine more than account5 due to account7 staked more than account5");

  });

  it("PoS mining: account7", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();


    var balance5_11a = await BadiumERC20Instance.balanceOf.call(accounts[5]);

    // Account5 removes all his/her stake
    await BadiumERC20Instance.withdrawStake(ether('10'), {from: accounts[5]});
    await BadiumERC20Instance.withdrawStake(ether('10'), {from: accounts[5]});
    await BadiumERC20Instance.withdrawStake(ether('10'), {from: accounts[5]});
    await checkStake(BadiumERC20Instance,accounts[5],balance5_11a.add(ether('30')),ether((total_supply2+60+72+100+124+88+128).toString(10)),ether('0'),ether('50'));

    var stake7_11 = await BadiumERC20Instance.stakeOf.call(accounts[7]);

    // Account7 mine 15 slots
    await testMinePos(BadiumERC20Instance, 15, accounts[1]);

    });

  it("PoS mining with empty stake", async () => {
    const BadiumERC20Instance = await BadiumERC20.deployed();


    var balance7_13a = await BadiumERC20Instance.balanceOf.call(accounts[7]);

    // Account5 removes all his/her stake
    await BadiumERC20Instance.withdrawStake(ether('25'), {from: accounts[7]});
    await BadiumERC20Instance.withdrawStake(ether('20'), {from: accounts[7]});
    await BadiumERC20Instance.withdrawStake(ether('5'), {from: accounts[7]});
    await checkStake(BadiumERC20Instance,accounts[7],balance7_13a.add(ether('50')),ether((total_supply2+60+72+100+124+88+128+60).toString(10)),ether('0'),ether('0'));

    await expectRevert(
        testMinePos(BadiumERC20Instance, 15, accounts[1]),
        'Nothing staked so far'
    );

    });

});
