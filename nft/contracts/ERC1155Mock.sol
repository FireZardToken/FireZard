
pragma solidity ^0.8;

import "./FireZardNFT.sol";
//import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";

contract ERC1155Mock is FireZardNFT {
//contract ERC1155Mock is ERC1155PresetMinterPauser {

    constructor(string memory _uri, string memory name_, string memory symbol_) FireZardNFT(_uri, name_, symbol_){
//    constructor(string memory _uri, string memory name_, string memory symbol_) ERC1155PresetMinterPauser(_uri){

    }

}