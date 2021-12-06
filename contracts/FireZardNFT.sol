/**
 * FireZard ERC1155 NFT for storinfg game characters and items (both stackable and unstackable)
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";

contract FireZardNFT is ERC1155PresetMinterPauser {

    mapping(uint256 => bytes32) public token_type;

    constructor(string memory uri) ERC1155PresetMinterPauser(uri) {
	
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
	if(from == address(0)){
	    bytes32 _token_type;

	    for(uint i=0;i<32;i++)
		_token_type |= bytes32(data[i] & 0xFF) >> (i*8);

	    for(uint i=0;i<ids.length;i++)
		token_type[ids[i]] = _token_type;
	}
	super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function typeOf(uint256 id) public view returns (bytes32) {
	return token_type[id];
    }

}
