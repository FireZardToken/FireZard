const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

const ERC721ReceiverMock = artifacts.require('ERC721ReceiverMock');

const Error = [ 'None', 'RevertWithMessage', 'RevertWithoutMessage', 'Panic' ]
  .reduce((acc, entry, idx) => Object.assign({ [entry]: idx }, acc), {});

const firstTokenId = new BN('5042');
const secondTokenId = new BN('79217');
const thirdTokenId = new BN('82644');
const nonExistentTokenId = new BN('13');
const fourthTokenId = new BN(4);
const baseURI = 'https://api.example.com/v1/';

const RECEIVER_MAGIC_VALUE = '0x150b7a02';

function shouldBehaveLikeERC721andERC1155 (errorPrefix, owner, newOwner, approved, anotherApproved, operator, other,
					    owner2, newOwner2, approved2, other2) {
  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
    'ERC1155'
  ]);

  context('with minted tokens', function () {

    before(function(){
	console.log("owner: "+owner);
	console.log("newOwner: "+newOwner);
	console.log("approved: "+approved);
	console.log("anotherApproved: "+anotherApproved);
	console.log("operator: "+operator);
	console.log("other: "+other);
	console.log("owner2: "+owner2);
	console.log("newOwner2: "+newOwner2);
	console.log("approved2: "+approved2);
	console.log("other2: "+other2);
    });

    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, 100, '0x');
      await this.token.mint(owner, secondTokenId, 100, '0x');
//      await this.token.mint(owner2, firstTokenId, 200, '0x');
      await this.token.mint(owner2, secondTokenId, 200, '0x');
      await this.token.mint(owner, thirdTokenId, 1, '0x');
      this.toWhom = other; // default to other for toWhom in context-dependent tests
      this.other2 = other2;
    });

    describe('balanceOf', function () {
      context('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('3');
          expect(await this.token.balanceOf(owner2)).to.be.bignumber.equal('1');
        });
      });

      context('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
        });
      });

      context('when querying the zero address', function () {
        it('throws', async function () {
          await expectRevert(
            this.token.balanceOf(ZERO_ADDRESS), 'ERC721: balance query for the zero address',
          );
        });
      });
    });

    describe('ownerOf', function () {
      context('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId;

        it('returns the owner of the given token ID', async function () {
	    expect(await this.token.ownerOf(firstTokenId)).to.be.equal(owner);
	    await expectRevert(
        	this.token.ownerOf(secondTokenId),
		'FireZardNFT: this query may serve only single token owner'
	    );
	    expect(await this.token.ownerOf(thirdTokenId)).to.be.equal(owner);
        });
      });

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = nonExistentTokenId;

        it('reverts', async function () {
          await expectRevert(
            this.token.ownerOf(tokenId), 'ERC721: owner query for nonexistent token',
          );
        });
      });
    });

    describe('transfers', function () {
      const tokenId = firstTokenId;
      const data = '0x42';

      let logs = null;

      beforeEach(async function () {
        await this.token.approve(approved, tokenId, { from: owner });
        await this.token.setApprovalForAll(operator, true, { from: owner });
//        await this.token.approve(approved, firstTokenId, { from: owner });
        await this.token.approve(approved2, secondTokenId, { from: owner2 });
      });

      const isOwnerOf = async(token, user,token_id) => {
	var owners = await token.ownersOf(token_id);
	for(var i=0;i<owners.length;i++)
	    if(owners[i] == user)
		return true;
	return false;
      }

      const transferWasSuccessful = function ({ operator, owner, tokenId, approved, amount, beforeOwnerBalance }) {
        it('transfers the ownership of the given token ID to the given address', async function () {
	  expect(await isOwnerOf(this.token, this.toWhom,tokenId) == true);
	  expect(await isOwnerOf(this.token, owner,tokenId) == false);
//	  if((await this.token.ownersOf(tokenId)).length == 1){
            expect(await this.token.ownerOf(tokenId)).to.be.equal(this.toWhom);
/*	  }
	  else{
	    await expectRevert(
		this.token.ownerOf(tokenId),
		'epic fail'
	    );
	  }*/
        });

        it('emits a Transfer event', async function () {
          expectEvent.inLogs(logs, 'Transfer', { from: owner, to: this.toWhom, tokenId: tokenId });
	  console.log("operator: "+operator+", amount: "+amount);
          expectEvent.inLogs(logs, 'TransferSingle', { operator: operator, from: owner, to: this.toWhom, id: tokenId, value: amount });
        });

        it('clears the approval for the token ID', async function () {
//	  if(this.token.ownersOf(tokenId).length == 1)
            expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
        });

        it('emits an Approval event', async function () {
          expectEvent.inLogs(logs, 'Approval', { owner, approved: ZERO_ADDRESS, tokenId: tokenId });
        });

        it('adjusts owners balances', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal((new BN(beforeOwnerBalance)).sub(new BN('1')));
          expect(await this.token.balanceOf(owner,tokenId)).to.be.bignumber.equal('0');
        });

        it('adjusts owners tokens by index', async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          expect(await this.token.tokenOfOwnerByIndex(this.toWhom, 0)).to.be.bignumber.equal(tokenId);

          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.not.equal(tokenId);
        });
      };

      const partialTransferWasSuccessful = function ({ operator, owner, tokenId, approved, amount, beforeOwnerBalance, beforeOwnerTokenBalance, beforeRecipientBalance }) {
        it('transfers the ownership of the given token ID to the given address', async function () {
	  expect((await isOwnerOf(this.token, this.toWhom,tokenId)) == true);
	  if(typeof this.other_recipient != 'undefined')
	    expect((await isOwnerOf(this.token, this.other_recipient,tokenId)) == true);
	  expect((await isOwnerOf(this.token, owner,tokenId)) == true);
//	  console.log("ownerOf: "+(await this.token.ownerOf(tokenId)));
	  console.log("ownersOf: "+(await this.token.ownersOf(tokenId)));
/*	  await expectRevert(
		this.token.ownerOf(tokenId),
		'epic fail'
	  );*/
        });

        it('emits a Transfer event', async function () {
          expectEvent.inLogs(logs, 'Transfer', { from: owner, to: this.toWhom, tokenId: tokenId });
          expectEvent.inLogs(logs, 'TransferSingle', { operator: operator, from: owner, to: this.toWhom, id: tokenId, value: amount });
        });

        it('clears the approval for the token ID', async function () {
	  if(this.token.ownersOf(tokenId).length == 1)
            expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
        });

        it('Emits an Approval event', async function () {
          expectEvent.inLogs(logs, 'Approval', { owner, approved: ZERO_ADDRESS, tokenId: tokenId });
        });

        it('adjusts owners balances', async function () {
	  expect(await this.token.balanceOf(owner)).to.be.bignumber.equal((new BN(beforeOwnerBalance)).sub(new BN('1')));
	  expect(await this.token.balanceOf(this.toWhom)).to.be.bignumber.equal((new BN(beforeRecipientBalance)).add(new BN('1')));
	  if(typeof this.other_recipient != 'undefined')
	    expect(await this.token.balanceOf(this.other_recipient)).to.be.bignumber.equal((new BN('1')));
          expect(await this.token.balanceOf(owner,tokenId)).to.be.bignumber.equal('0');
	  if(typeof this.other_recipient != 'undefined')
            expect(await this.token.balanceOf(this.toWhom,tokenId)).to.be.bignumber.equal('90');
	  else
	    expect(await this.token.balanceOf(this.toWhom,tokenId)).to.be.bignumber.equal('100');
	  expect(await this.token.exists(tokenId));
        });

        it('adjusts owners tokens by index', async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          expect(await this.token.tokenOfOwnerByIndex(this.toWhom, 0)).to.be.bignumber.equal(tokenId);

          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.not.equal(tokenId);

	  if(typeof this.other_recipient != 'undefined')
            expect(await this.token.tokenOfOwnerByIndex(this.other_recipient, 0)).to.be.bignumber.equal(tokenId);

        });
      };


      const testConditionsAfterPartialTransfer = function () {
	    it('ERC721 view methods work correctly after ERC1155 partial transfer', async function () {
//		it("success", async function () {
		    var token = this.token;
		    var token_id = this.token_id;
		    var user = this.user;
		    var recipient = this.recipient;
		    var recipient_balance = this.recipient_balance;
		    var other_recipient = this.other_recipient;
		    console.log("2-other_recipient: "+other_recipient);
//		    console.log("3-token: "+token);
		    expect(await token.balanceOf(user)).to.be.bignumber.equal('3');
		    console.log("BALANCE_OF("+recipient+"): "+(await token.balanceOf(recipient)));
		    console.log("EXPECTED BALANCE: "+recipient_balance);
		    expect(await token.balanceOf(recipient)).to.be.bignumber.equal(recipient_balance);
		    expect(await token.tokenOfOwnerByIndex(user, 0)).to.be.bignumber.equal(token_id);
		    var owners = await token.ownersOf(token_id);
		    expect(owners[0]).to.be.equal(user);
		    if(owners.length == 1){
			expect(await token.getApproved(token_id)).to.be.not.equal(ZERO_ADDRESS);
			expect(await token.ownerOf(token_id)).to.be.equal(user);
		    }
		    else{
			await expectRevert(
				token.getApproved(token_id),
				'FireZardNFT: this query may serve only single token owner'
			);
			await expectRevert(
			    token.ownerOf(token_id),
			    'FireZardNFT: this query may serve only single token owner'
			);
			if(typeof other_recipient != 'undefined'){
			    expect(owners[1]).to.be.equal(other_recipient);
			    if(owners.length == 3)
				expect(owners[2]).to.be.equal(recipient);
			}else
			    expect(owners[1]).to.be.equal(recipient);
		    }
//		});
	    });
      }

      const prepareParams = async function ( { this_context, tokenId, owner, self, other_recipient } ) {
	 this_context.token_id = tokenId;
	 this_context.user = owner;
	 console.log("User: "+this_context.user);
	 this_context.recipient = this_context.toWhom;
	 if(self)
	    this_context.recipient_balance = (new BN(await this_context.token.balanceOf(this_context.toWhom)));
	 else
	    this_context.recipient_balance = (new BN(await this_context.token.balanceOf(this_context.toWhom))).add(new BN('1'));
	console.log("1-other_recipient: "+other_recipient);
	if(typeof other_recipient != 'undefined')
	    this_context.other_recipient = other_recipient;
      }

      const shouldTransferTokensByUsers = function (transferFunction) {
        context('when called by the owner', function () {
          beforeEach(async function () {
//	    (this.beforeRecipientBalance = await this.token.balanceOf(this.toWhom));
	    await prepareParams({ this_context: this, tokenId, owner });
            ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: owner }));
          });
          partialTransferWasSuccessful({ operator: owner, owner: owner, tokenId: tokenId, approved: approved, amount: '100', beforeOwnerBalance: '3', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
        });


        context('when called by the owner with partial transfer to same destination first', function () {
//	  if(await this.token.totalSupply(tokenId) == 1)return;
          beforeEach(async function () {
//	    this.beforeRecipientBalance = await this.token.balanceOf(this.toWhom);
	    await prepareParams({ this_context: this, tokenId, owner });
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer({ token: this.token, token_id: tokenId, user: owner, recipient: this.toWhom, recipient_balance: 
	    this.beforeRecipientBalance });
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
    		({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: owner }));
	    });
	    partialTransferWasSuccessful({ operator: owner, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100',
		beforeRecipientBalance: this.beforeRecipientBalance   });
	  });
        });

        context('when called by the owner with partial transfer to different destination first', function () {
//	  if(this.token.totalSupply(tokenId) == 1)return;
          beforeEach(async function () {
	    console.log("other2: "+this.other2);
	    await prepareParams({ this_context: this, tokenId, owner, self: true, other_recipient: this.other2 });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: owner }));
	    });
            partialTransferWasSuccessful({ operator: owner, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100',
		beforeRecipientBalance: this.beforeRecipientBalance   });
	  });
        });

        context('when called by the owner with partial transfer to same and different destination first', function () {
//	  if(this.token.totalSupply(tokenId) == 1)return;
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2 });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: owner }));
	    });
            partialTransferWasSuccessful({ operator: owner, owner: owner, tokenId: tokenId, approved: approved, amount: '80', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100' });
	  });
        });

        context('when called by the approved individual', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
            ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
          });
          partialTransferWasSuccessful({ operator: approved, owner: owner, tokenId: tokenId, approved: approved, amount: '100', beforeOwnerBalance: '3', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
        });

        context('when called by the approved individual with partial transfer to same destination first', function () {
//	  if(this.token.totalSupply(tokenId) == 1)return;
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.toWhom, tokenId, '10', '0x', { from: approved });
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
	    });
            partialTransferWasSuccessful({ operator: approved, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the approved individual with partial transfer to different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, self: true, other_recipient: this.other2 });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.other2, tokenId, '10', '0x', { from: approved });
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
	    });
            partialTransferWasSuccessful({ operator: approved, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the approved individual with partial transfer to same and different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2 });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.other2, tokenId, '10', '0x', { from: approved });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.toWhom, tokenId, '10', '0x', { from: approved });
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
	    });
            partialTransferWasSuccessful({ operator: approved, owner: owner, tokenId: tokenId, approved: approved, amount: '80', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner with partial transfer to same destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
	    });
            partialTransferWasSuccessful({ operator: approved, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner with partial transfer to different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, self: true, other_recipient: this.other2  });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
	    });
            partialTransferWasSuccessful({ operator: approved, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner with partial transfer to same and different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2 });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
	    });
            partialTransferWasSuccessful({ operator: approved, owner: owner, tokenId: tokenId, approved: approved, amount: '80', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the operator', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
            ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
          });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: approved, amount: '100', beforeOwnerBalance: '3', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
        });

        context('when called by the operator with partial transfer to same destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.toWhom, tokenId, '10', '0x', { from: operator });
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the operator with partial transfer to different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, self: true, other_recipient: this.other2  });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.other2, tokenId, '10', '0x', { from: operator });
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the operator with partial transfer to same different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2 });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.other2, tokenId, '10', '0x', { from: operator });
	    await this.token.methods['safeTransferFrom(address,address,uint256,uint256,bytes)'](owner, this.toWhom, tokenId, '10', '0x', { from: operator });
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: approved, amount: '80', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner with partial transfer to same destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner with partial transfer to different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, self: true, other_recipient: this.other2  });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: approved, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner with partial transfer to same and different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2 });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: approved, amount: '80', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner without an approved user', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
          });
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: null, amount: '100', beforeOwnerBalance: '3', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner without an approved user. Partial transfer to same destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: null, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner without an approved user. Partial transfer to different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, self: true, other_recipient: this.other2  });
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: null, amount: '90', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when called by the owner without an approved user. Partial transfer to same and different destination first', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2 });
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
	    await this.token.safeTransferFrom(owner, this.toWhom, tokenId, '10', '0x');
          });
	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);
	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
	    });
            partialTransferWasSuccessful({ operator: operator, owner: owner, tokenId: tokenId, approved: null, amount: '80', beforeOwnerBalance: '3', beforeOwnerTokenBalance: '100', 
	    beforeRecipientBalance: this.beforeRecipientBalance });
	  });
        });

        context('when sent to the owner', function () {
          beforeEach(async function () {
	    await prepareParams({ this_context: this, tokenId, owner });
            ({ logs } = await transferFunction.call(this, owner, owner, tokenId, { from: owner }));
          });

          it('keeps ownership of the token', async function () {
            expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
          });

          it('clears the approval for the token ID', async function () {
            expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });

          it('emits only a transfer event', async function () {
            expectEvent.inLogs(logs, 'Transfer', {
              from: owner,
              to: owner,
              tokenId: tokenId,
            });
          });

	  it('keeps the owner balance', async function () {
            expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('3');
          });

          it('keeps same tokens by index', async function () {
            if (!this.token.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all(
              [0, 1, 2].map(i => this.token.tokenOfOwnerByIndex(owner, i)),
            );
            expect(tokensListed.map(t => t.toNumber())).to.have.members(
              [firstTokenId.toNumber(), secondTokenId.toNumber(), thirdTokenId.toNumber()],
            );
          });
        });

      context('when sent to the owner. Partial self-transfer first', function () {
          beforeEach(async function () {
	    var temp_addr = this.toWhom;
	    this.toWhom = owner;
	    await prepareParams({ this_context: this, tokenId, owner, self: true });
	    this.toWhom = temp_addr;
	    await this.token.safeTransferFrom(owner, owner, tokenId, '10', '0x');
          });

	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);

	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, owner, tokenId, { from: owner }));
	    });

            it('keeps ownership of the token', async function () {
        	expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
            });

            it('clears the approval for the token ID', async function () {
        	expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
            });

            it('emits only a transfer event', async function () {
        	expectEvent.inLogs(logs, 'Transfer', {
            	    from: owner,
            	    to: owner,
            	    tokenId: tokenId,
        	});
            });

	    it('keeps the owner balance', async function () {
        	expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('3');
            });

            it('keeps same tokens by index', async function () {
        	if (!this.token.tokenOfOwnerByIndex) return;
        	const tokensListed = await Promise.all(
            	    [0, 1, 2].map(i => this.token.tokenOfOwnerByIndex(owner, i)),
        	);
        	expect(tokensListed.map(t => t.toNumber())).to.have.members(
            	    [firstTokenId.toNumber(), secondTokenId.toNumber(), thirdTokenId.toNumber()],
        	);
            });
	  });
        });

        context('when sent to the owner. Partial transfer to other first', function () {
          beforeEach(async function () {
	    var temp_addr = this.toWhom;
	    this.toWhom = owner;
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2, self: true });
	    this.toWhom = temp_addr;
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
          });

	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);

	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
        	({ logs } = await transferFunction.call(this, owner, owner, tokenId, { from: owner }));
	    });

            it('keeps ownership of the token', async function () {
//            expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
        	await expectRevert(
		    this.token.ownerOf(tokenId),
		    'FireZardNFT: this query may serve only single token owner'
		);
		var owners = await this.token.ownersOf(tokenId);
		console.log("OWNERS: "+owners);
		expect(owners[0]).to.be.equal(owner);
		expect(owners[1]).to.be.equal(this.other2);
//		expect(owners[2]).to.be.equal(other);
//	    console.log("OWNERS: "+owners);
            });

            it('clears the approval for the token ID', async function () {
		await expectRevert(
		    this.token.getApproved(tokenId),
		    'FireZardNFT: this query may serve only single token owner'
		);
            });

            it('emits only a transfer event', async function () {
        	expectEvent.inLogs(logs, 'Transfer', {
            	    from: owner,
            	    to: owner,
            	    tokenId: tokenId,
        	});
            });

	    it('keeps the owner balance', async function () {
        	expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('3');
            });

            it('keeps same tokens by index', async function () {
        	if (!this.token.tokenOfOwnerByIndex) return;
        	const tokensListed = await Promise.all(
            	    [0, 1, 2].map(i => this.token.tokenOfOwnerByIndex(owner, i)),
        	);
        	expect(tokensListed.map(t => t.toNumber())).to.have.members(
            	    [firstTokenId.toNumber(), secondTokenId.toNumber(), thirdTokenId.toNumber()],
        	);
            });
	  });
        });

        context('when sent to the owner. Partial transfer to self and other first', function () {
          beforeEach(async function () {
	    var temp_addr = this.toWhom;
	    this.toWhom = owner;
	    await prepareParams({ this_context: this, tokenId, owner, other_recipient: this.other2, self: true });
	    this.toWhom = temp_addr;
	    await this.token.safeTransferFrom(owner, owner, tokenId, '10', '0x');
	    await this.token.safeTransferFrom(owner, this.other2, tokenId, '10', '0x');
          });

	  testConditionsAfterPartialTransfer(this.token, tokenId, owner);

	  context('transfering the rest in ERC721 mode', function () {
	    beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, owner, tokenId, { from: owner }));
	    });

            it('keeps ownership of the token', async function () {
        	await expectRevert(
		    this.token.ownerOf(tokenId),
		    'FireZardNFT: this query may serve only single token owner'
		);
		var owners = await this.token.ownersOf(tokenId);
		expect(owners[0]).to.be.equal(owner);
		expect(owners[1]).to.be.equal(this.other2);
//		expect(owners[2]).to.be.equal(other);
            });

            it('clears the approval for the token ID', async function () {
        	await expectRevert(
		    this.token.getApproved(tokenId),
		    'FireZardNFT: this query may serve only single token owner'
		);
            });

            it('emits only a transfer event', async function () {
        	expectEvent.inLogs(logs, 'Transfer', {
            	    from: owner,
            	    to: owner,
            	    tokenId: tokenId,
        	});
            });

	    it('keeps the owner balance', async function () {
        	expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('3');
            });

            it('keeps same tokens by index', async function () {
        	if (!this.token.tokenOfOwnerByIndex) return;
        	const tokensListed = await Promise.all(
            	    [0, 1, 2].map(i => this.token.tokenOfOwnerByIndex(owner, i)),
        	);
        	expect(tokensListed.map(t => t.toNumber())).to.have.members(
            	    [firstTokenId.toNumber(), secondTokenId.toNumber(), thirdTokenId.toNumber()],
        	);
	    });
          });
        });

/*        context('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, other, other, tokenId, { from: owner }),
              'ERC721: transfer from incorrect owner',
            );
          });
        });

        context('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, owner, other, tokenId, { from: other }),
              'ERC721: transfer caller is not owner nor approved',
            );
          });
        });

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, owner, other, nonExistentTokenId, { from: owner }),
              'ERC721: operator query for nonexistent token',
            );
          });
        });

        context('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, owner, ZERO_ADDRESS, tokenId, { from: owner }),
              'ERC721: transfer to the zero address',
            );
          });
        });*/
      };

      describe('via transferFrom', function () {
        shouldTransferTokensByUsers(function (from, to, tokenId, opts) {
          return this.token.transferFrom(from, to, tokenId, opts);
        });
      });

      describe('via safeTransferFrom', function () {
        const safeTransferFromWithData = function (from, to, tokenId, opts) {
          return this.token.methods['safeTransferFrom(address,address,uint256,bytes)'](from, to, tokenId, data, opts);
        };

        const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
          return this.token.methods['safeTransferFrom(address,address,uint256)'](from, to, tokenId, opts);
        };

        const shouldTransferSafely = function (transferFun, data) {
          describe('to a user account', function () {
            shouldTransferTokensByUsers(transferFun);
          });

          describe('to a valid receiver contract', function () {
            beforeEach(async function () {
              this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
              this.toWhom = this.receiver.address;
            });

//            shouldTransferTokensByUsers(transferFun);
/*
            it('calls onERC721Received', async function () {
              const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: owner });

              await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
                operator: owner,
                from: owner,
                tokenId: tokenId,
                data: data,
              });
            });

            it('calls onERC721Received from approved', async function () {
              const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: approved });

              await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
                operator: approved,
                from: owner,
                tokenId: tokenId,
                data: data,
              });
            });*/

/*            describe('with an invalid token id', function () {
              it('reverts', async function () {
                await expectRevert(
                  transferFun.call(
                    this,
                    owner,
                    this.receiver.address,
                    nonExistentTokenId,
                    { from: owner },
                  ),
                  'ERC721: operator query for nonexistent token',
                );
              });
            });*/
          });
        };

        describe('with data', function () {
          shouldTransferSafely(safeTransferFromWithData, data);
        });

        describe('without data', function () {
          shouldTransferSafely(safeTransferFromWithoutData, null);
        });

/*        describe('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new('0x42', Error.None);
            await expectRevert(
              this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner }),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        describe('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
            await expectRevert(
              this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
              'ERC721ReceiverMock: reverting',
            );
          });
        });

        describe('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
            await expectRevert(
              this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        describe('to a receiver contract that panics', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.Panic);
	    await expectRevert(
              this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
		'out of gas'
            );
          });
        });

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const nonReceiver = this.token;
            await expectRevert(
              this.token.safeTransferFrom(owner, nonReceiver.address, tokenId, { from: owner }),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });*/
      });
    });

/*    describe('safe mint', function () {
      const tokenId = fourthTokenId;
      const data = '0x42';

// We mint as ERC1155 only. safeMint expects ERC1155 only. We do not test for safe minting with ERC721!
      describe('via safeMint', function () { // regular minting is tested in ERC721Mintable.test.js and others
        it('calls onERC721Received — with data', async function () {
          this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
//          const receipt = await this.token.safeMint(this.receiver.address, tokenId, 100, data);
          const receipt = await this.token.mint(this.receiver.address, tokenId, 100, data);

          await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            from: ZERO_ADDRESS,
            tokenId: tokenId,
            data: data,
          });
        });

        it('calls onERC721Received — without data', async function () {
          this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
//          const receipt = await this.token.safeMint(this.receiver.address, tokenId, 100, '0x');
          const receipt = await this.token.mint(this.receiver.address, tokenId, 100, '0x');

          await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            from: ZERO_ADDRESS,
            tokenId: tokenId,
          });
        });

        context('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new('0x42', Error.None);
            await expectRevert(
//              this.token.safeMint(invalidReceiver.address, tokenId, 100, '0x'),
              this.token.mint(invalidReceiver.address, tokenId, 100, '0x'),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        context('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
            await expectRevert(
//              this.token.safeMint(revertingReceiver.address, tokenId, 100, '0x'),
              this.token.mint(revertingReceiver.address, tokenId, 100, '0x'),
              'ERC721ReceiverMock: reverting',
            );
          });
        });

        context('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
            await expectRevert(
//              this.token.safeMint(revertingReceiver.address, tokenId, 100, '0x'),
              this.token.mint(revertingReceiver.address, tokenId, 100, '0x'),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        context('to a receiver contract that panics', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.Panic);
            await expectRevert.unspecified(
//              this.token.safeMint(revertingReceiver.address, tokenId, 100, '0x'),
              this.token.mint(revertingReceiver.address, tokenId, 100, '0x'),
            );
          });
        });

        context('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const nonReceiver = this.token;
            await expectRevert(
//              this.token.safeMint(nonReceiver.address, tokenId, 100, '0x'),
              this.token.mint(nonReceiver.address, tokenId, 100, '0x'),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });
      });
    });*/

/*    describe('approve', function () {
      const tokenId = firstTokenId;

      let logs = null;

      const itClearsApproval = function () {
        it('clears approval for the token', async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
        });
      };

      const itApproves = function (address) {
        it('sets the approval for the target address', async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(address);
        });
      };

      const itEmitsApprovalEvent = function (address) {
        it('emits an approval event', async function () {
          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            approved: address,
            tokenId: tokenId,
          });
        });
      };

      context('when clearing approval', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });

        context('when there was a prior approval', function () {
          beforeEach(async function () {
            await this.token.approve(approved, tokenId, { from: owner });
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });
      });

      context('when approving a non-zero address', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(approved, tokenId, { from: owner }));
          });

          itApproves(approved);
          itEmitsApprovalEvent(approved);
        });

        context('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            await this.token.approve(approved, tokenId, { from: owner });
            ({ logs } = await this.token.approve(approved, tokenId, { from: owner }));
          });

          itApproves(approved);
          itEmitsApprovalEvent(approved);
        });

        context('when there was a prior approval to a different address', function () {
          beforeEach(async function () {
            await this.token.approve(anotherApproved, tokenId, { from: owner });
            ({ logs } = await this.token.approve(anotherApproved, tokenId, { from: owner }));
          });

          itApproves(anotherApproved);
          itEmitsApprovalEvent(anotherApproved);
        });
      });

      context('when the address that receives the approval is the owner', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.approve(owner, tokenId, { from: owner }), 'ERC721: approval to current owner',
          );
        });
      });

      context('when the sender does not own the given token ID', function () {
        it('reverts', async function () {
          await expectRevert(this.token.approve(approved, tokenId, { from: other }),
            'ERC721: approve caller is not owner nor approved');
        });
      });

      context('when the sender is approved for the given token ID', function () {
        it('reverts', async function () {
          await this.token.approve(approved, tokenId, { from: owner });
// No exception should be here!!!
//          await expectRevert(this.token.approve(anotherApproved, tokenId, { from: approved }),
//            'ERC721: approve caller is not owner nor approved for all');
	  await this.token.approve(anotherApproved, tokenId, { from: approved })
        });
      });

      context('when the sender is an operator', function () {
        beforeEach(async function () {
          await this.token.setApprovalForAll(operator, true, { from: owner });
          ({ logs } = await this.token.approve(approved, tokenId, { from: operator }));
        });

        itApproves(approved);
        itEmitsApprovalEvent(approved);
      });

      context('when the given token ID does not exist', function () {
        it('reverts', async function () {
          await expectRevert(this.token.approve(approved, nonExistentTokenId, { from: operator }),
//            'ERC721: owner query for nonexistent token'
		'ERC721: operator query for nonexistent token -- Reason given: ERC721: operator query for nonexistent token.'
	  );
        });
      });
    });*/

/*    describe('setApprovalForAll', function () {
      context('when the operator willing to approve is not the owner', function () {
        context('when there is no operator approval set by the sender', function () {
          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent.inLogs(logs, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });
        });

        context('when the operator was set as not approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, false, { from: owner });
          });

          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent.inLogs(logs, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });

          it('can unset the operator approval', async function () {
            await this.token.setApprovalForAll(operator, false, { from: owner });

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(false);
          });
        });

        context('when the operator was already approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });
          });

          it('keeps the approval to the given address', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent.inLogs(logs, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });
        });
      });

      context('when the operator is the owner', function () {
        it('reverts', async function () {
          await expectRevert(this.token.setApprovalForAll(owner, true, { from: owner }),
//            'ERC721: approve to caller'
	    'ERC1155: setting approval status for self -- Reason given: ERC1155: setting approval status for self.'
	  );
        });
      });
    });*/

/*    describe('getApproved', async function () {
      context('when token is not minted', async function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.getApproved(nonExistentTokenId),
            'ERC721: approved query for nonexistent token',
          );
        });
      });

      context('when token has been minted ', async function () {
        it('should return the zero address', async function () {
          expect(await this.token.getApproved(firstTokenId)).to.be.equal(
            ZERO_ADDRESS,
          );
        });

        context('when account has been approved', async function () {
          beforeEach(async function () {
            await this.token.approve(approved, firstTokenId, { from: owner });
          });

          it('returns approved account', async function () {
            expect(await this.token.getApproved(firstTokenId)).to.be.equal(approved);
          });
        });
      });
    });*/
  });

/*  describe('_mint(address, uint256)', function () {
    it('reverts with a null destination address', async function () {
      await expectRevert(
        this.token.mint(ZERO_ADDRESS, firstTokenId, 100, '0x'), 
//	    'ERC721: mint to the zero address',
	    'FireZardNFT: mint to the zero address -- Reason given: FireZardNFT: mint to the zero address.'
      );
    });

    context('with minted token', async function () {
      beforeEach(async function () {
        ({ logs: this.logs } = await this.token.mint(owner, firstTokenId, 100, '0x'));
      });

      it('emits a Transfer event', function () {
        expectEvent.inLogs(this.logs, 'Transfer', { from: ZERO_ADDRESS, to: owner, tokenId: firstTokenId });
      });

      it('creates the token', async function () {
        expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
        expect(await this.token.ownerOf(firstTokenId)).to.equal(owner);
      });

    });
  });*/

/*  describe('_burn', function () {
    it('reverts when burning a non-existent token id', async function () {
      await expectRevert(
        this.token.burn(owner, nonExistentTokenId, 100), 
//	    'ERC721: owner query for nonexistent token',
	    'ERC1155: burn amount exceeds balance -- Reason given: ERC1155: burn amount exceeds balance.'
      );
    });

    context('with minted tokens', function () {
      beforeEach(async function () {
        await this.token.mint(owner, firstTokenId, 100, '0x');
        await this.token.mint(owner, secondTokenId, 100, '0x');
      });

      context('with burnt token', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.burn(owner, firstTokenId, 100));
        });

        it('emits a Transfer event', function () {
          expectEvent.inLogs(this.logs, 'Transfer', { from: owner, to: ZERO_ADDRESS, tokenId: firstTokenId });
        });

        it('emits an Approval event', function () {
          expectEvent.inLogs(this.logs, 'Approval', { owner, approved: ZERO_ADDRESS, tokenId: firstTokenId });
        });

        it('deletes the token', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
          await expectRevert(
            this.token.ownerOf(firstTokenId), 'ERC721: owner query for nonexistent token',
          );
        });

        it('reverts when burning a token id that has been deleted', async function () {
          await expectRevert(
            this.token.burn(owner, firstTokenId, 100), 
//		'ERC721: owner query for nonexistent token',
		'ERC1155: burn amount exceeds balance -- Reason given: ERC1155: burn amount exceeds balance.'
          );
        });
      });
    });
  });*/
}

function shouldBehaveLikeERC721andERC1155Enumerable (errorPrefix, owner, newOwner, approved, anotherApproved, operator, other) {
  shouldSupportInterfaces([
    'ERC721Enumerable',
  ]);

  context('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, 100, '0x');
      await this.token.mint(owner, secondTokenId, 100, '0x');
      this.toWhom = other; // default to other for toWhom in context-dependent tests
      this.other2 = other2;
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('2');
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        it('returns the token ID placed at the given index', async function () {
          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.tokenOfOwnerByIndex(owner, 2), 
//		'ERC721Enumerable: owner index out of bounds',
		'FireZardNFT: owner index out of bounds'
          );
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.tokenOfOwnerByIndex(other, 0), 
//		'ERC721Enumerable: owner index out of bounds',
		'FireZardNFT: owner index out of bounds'
          );
        });
      });

      describe('after transferring all tokens to another user', function () {
        beforeEach(async function () {
          await this.token.transferFrom(owner, other, firstTokenId, { from: owner });
          await this.token.transferFrom(owner, other, secondTokenId, { from: owner });
        });

        it('returns correct token IDs for target', async function () {
          expect(await this.token.balanceOf(other)).to.be.bignumber.equal('2');
          const tokensListed = await Promise.all(
            [0, 1].map(i => this.token.tokenOfOwnerByIndex(other, i)),
          );
          expect(tokensListed.map(t => t.toNumber())).to.have.members([firstTokenId.toNumber(),
            secondTokenId.toNumber()]);
        });

        it('returns empty collection for original owner', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('0');
          await expectRevert(
            this.token.tokenOfOwnerByIndex(owner, 0), 
//		'ERC721Enumerable: owner index out of bounds',
		'FireZardNFT: owner index out of bounds'
          );
        });
      });
    });

    describe('tokenByIndex', function () {
      it('returns all tokens', async function () {
        const tokensListed = await Promise.all(
          [0, 1].map(i => this.token.tokenByIndex(i)),
        );
        expect(tokensListed.map(t => t.toNumber())).to.have.members([firstTokenId.toNumber(),
          secondTokenId.toNumber()]);
      });

      it('reverts if index is greater than supply', async function () {
        await expectRevert(
          this.token.tokenByIndex(2), 'ERC721Enumerable: global index out of bounds',
        );
      });

      [firstTokenId, secondTokenId].forEach(function (tokenId) {
        it(`returns all tokens after burning token ${tokenId} and minting new tokens`, async function () {
          const newTokenId = new BN(300);
          const anotherNewTokenId = new BN(400);

          await this.token.burn(owner, tokenId, 100);
          await this.token.mint(newOwner, newTokenId, 100, '0x');
          await this.token.mint(newOwner, anotherNewTokenId, 100, '0x');

          expect(await this.token.totalSupply()).to.be.bignumber.equal('3');

          const tokensListed = await Promise.all(
            [0, 1, 2].map(i => this.token.tokenByIndex(i)),
          );
          const expectedTokens = [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(
            x => (x !== tokenId),
          );
          expect(tokensListed.map(t => t.toNumber())).to.have.members(expectedTokens.map(t => t.toNumber()));
        });
      });
    });
  });

  describe('_mint(address, uint256)', function () {
    it('reverts with a null destination address', async function () {
      await expectRevert(
        this.token.mint(ZERO_ADDRESS, firstTokenId, 100, '0x'), 
//	    'ERC721: mint to the zero address',
	    'FireZardNFT: mint to the zero address -- Reason given: FireZardNFT: mint to the zero address.'
      );
    });

    context('with minted token', async function () {
      beforeEach(async function () {
        ({ logs: this.logs } = await this.token.mint(owner, firstTokenId, 100, '0x'));
      });

      it('adjusts owner tokens by index', async function () {
        expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(firstTokenId);
      });

      it('adjusts all tokens list', async function () {
        expect(await this.token.tokenByIndex(0)).to.be.bignumber.equal(firstTokenId);
      });
    });
  });

  describe('_burn', function () {
    it('reverts when burning a non-existent token id', async function () {
      await expectRevert(
        this.token.burn(owner, firstTokenId, 100), 
//	    'ERC721: owner query for nonexistent token',
	    'ERC1155: burn amount exceeds balance -- Reason given: ERC1155: burn amount exceeds balance.'
      );
    });

    context('with minted tokens', function () {
      beforeEach(async function () {
        await this.token.mint(owner, firstTokenId, 100, '0x');
        await this.token.mint(owner, secondTokenId, 100, '0x');
      });

      context('with burnt token', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.burn(owner, firstTokenId, 100));
        });

        it('removes that token from the token list of the owner', async function () {
          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(secondTokenId);
        });

        it('adjusts all tokens list', async function () {
          expect(await this.token.tokenByIndex(0)).to.be.bignumber.equal(secondTokenId);
        });

        it('burns all tokens', async function () {
          await this.token.burn(owner, secondTokenId, 100, { from: owner });
          expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
          await expectRevert(
            this.token.tokenByIndex(0), 'ERC721Enumerable: global index out of bounds',
          );
        });
      });
    });
  });
}

function shouldBehaveLikeERC721andERC1155Metadata (errorPrefix, name, symbol, owner) {
  shouldSupportInterfaces([
    'ERC721Metadata',
  ]);

  describe('metadata', function () {
    it('has a name', async function () {
      expect(await this.token.name()).to.be.equal(name);
    });

    it('has a symbol', async function () {
      expect(await this.token.symbol()).to.be.equal(symbol);
    });

    describe('token URI', function () {
      beforeEach(async function () {
        await this.token.mint(owner, firstTokenId, 100, '0x');
      });

//      it('return empty string by default', async function () {
      it('return default URI', async function () {
        expect(await this.token.tokenURI(firstTokenId)).to.be.equal('https://token-cdn-domain/{id}.json');
      });

      it('reverts when queried for non existent token id', async function () {
        await expectRevert(
          this.token.tokenURI(nonExistentTokenId), 
//	    'ERC721Metadata: URI query for nonexistent token',
	    'FireZardNFT: URI query for non-existent token'
        );
      });

      describe('base URI', function () {
        beforeEach(function () {
          if (this.token.setBaseURI === undefined) {
            this.skip();
          }
        });

        it('base URI can be set', async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.baseURI()).to.equal(baseURI);
        });

        it('base URI is added as a prefix to the token URI', async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(baseURI + firstTokenId.toString());
        });

        it('token URI can be changed by changing the base URI', async function () {
          await this.token.setBaseURI(baseURI);
          const newBaseURI = 'https://api.example.com/v2/';
          await this.token.setBaseURI(newBaseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(newBaseURI + firstTokenId.toString());
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721andERC1155,
  shouldBehaveLikeERC721andERC1155Enumerable,
  shouldBehaveLikeERC721andERC1155Metadata,
};
