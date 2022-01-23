
pragma solidity ^0.8;

import "../FireZardNFT.sol";

contract ERC1155SupplyMock is FireZardNFT {

    constructor(string memory _uri, string memory name_, string memory symbol_) FireZardNFT(_uri, name_, symbol_){

    }

}