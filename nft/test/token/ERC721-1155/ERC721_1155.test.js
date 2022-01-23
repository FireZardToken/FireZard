const {
  shouldBehaveLikeERC721andERC1155,
  shouldBehaveLikeERC721andERC1155Metadata,
} = require('./ERC721_1155.behavior');

const ERC721Mock = artifacts.require('ERC721Mock');

contract('FireZardNFT', function (accounts) {
  const name = 'Stackable Token, supports both ERC721 and ERC1155';
  const symbol = 'STACK';
  const uri = "https://token-cdn-domain/{id}.json";

  beforeEach(async function () {
    this.token = await ERC721Mock.new(uri, name, symbol);
  });

  shouldBehaveLikeERC721andERC1155('ERC721-ERC1155', ...accounts);
//  shouldBehaveLikeERC721andERC1155Metadata('ERC721-ERC1155', name, symbol, ...accounts);
});
