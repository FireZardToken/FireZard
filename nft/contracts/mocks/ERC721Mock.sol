// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../FireZardNFT.sol";

/**
 * @title ERC721Mock
 * This mock just provides a public safeMint, mint, and burn functions for testing purposes
 */
contract ERC721Mock is FireZardNFT {
    constructor(string memory _uri, string memory name, string memory symbol) FireZardNFT(_uri, name, symbol) {}

/*    function baseURI() public view returns (string memory) {
        return super.baseURI();
    }*/
/*
    function exists(uint256 tokenId) public view returns (bool) {
        return super.exists(tokenId);
    }*/

/*    function mint(address to, uint256 tokenId) public {
        super.mint(to, tokenId);
    }

    function safeMint(address to, uint256 tokenId) public {
        super.safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        super.safeMint(to, tokenId, _data);
    }*/
/*
    function burn(uint256 tokenId) public {
        super.burn(tokenId);
    }*/
}
