const {
  shouldBehaveLikeERC721andERC1155,
  shouldBehaveLikeERC721andERC1155Metadata,
  shouldBehaveLikeERC721andERC1155Enumerable,
} = require('./ERC721_1155.behavior');

const ERC721Mock = artifacts.require('ERC721EnumerableMock');

contract('FireZardNFT', function (accounts) {
  const name = 'FireZardNFT supports both ERC721 and ERC1155';
  const symbol = 'NFT';
  const uri = 'https://token-cdn-domain/{id}.json';

  beforeEach(async function () {
    this.token = await ERC721Mock.new(uri, name, symbol);
  });

  shouldBehaveLikeERC721andERC1155('ERC721_1155', ...accounts);
//  shouldBehaveLikeERC721Metadata('ERC721_1155', name, symbol, ...accounts);
//  shouldBehaveLikeERC721Enumerable('ERC721_1155', ...accounts);
});
