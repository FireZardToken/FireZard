/**
 * FireZard ERC1155 NFT for storinfg game characters and items (both stackable and unstackable)
 */

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";

contract FireZardNFT is ERC1155PresetMinterPauser {
    
    constructor(string memory uri) ERC1155PresetMinterPauser(uri) {

    }

}
