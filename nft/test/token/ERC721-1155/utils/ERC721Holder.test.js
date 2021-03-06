const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC721Holder = artifacts.require('ERC721Holder');
const ERC721Mock = artifacts.require('ERC721Mock');

contract('ERC721Holder', function (accounts) {
  const [ owner ] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const uri = 'https://token-cdn-domain/{id}.json';

  it('receives an ERC721 token', async function () {
    const token = await ERC721Mock.new(uri, name, symbol);
    const tokenId = new BN(1);
    await token.mint(owner, tokenId, 100, '0x');

    const receiver = await ERC721Holder.new();
    await token.safeTransferFrom(owner, receiver.address, tokenId, { from: owner });

    expect(await token.ownerOf(tokenId)).to.be.equal(receiver.address);
  });
});
