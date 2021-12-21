/**
 * FireZard ERC1155 NFT for storinfg game characters and items (both stackable and unstackable)
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

//contract FireZardNFT is ERC1155PresetMinterPauser, ERC1155Supply, IERC721, IERC721Metadata {
contract FireZardNFT is ERC1155PresetMinterPauser, ERC1155Supply {

    mapping(uint256 => address) public ownership;

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
    ) internal virtual override(ERC1155PresetMinterPauser, ERC1155Supply) {
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

    function ownerOf(uint256 id) public view returns (address) {
	return ownership[id];
    }
    
    function updateOwnership(uint256[] memory ids, address owner) internal {
    	for(uint i=0;i<ids.length;i++){
    		if(totalSupply(ids[i]) != balanceOf(owner,ids[i]))
    			ownership[ids[i]] = address(0);
    		else
    			ownership[ids[i]] = owner;
    	}
    }
    
    /**
     * @dev Transfers `amount` tokens of token type `id` from `from` to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If the caller is not `from`, it must be have been approved to spend ``from``'s tokens via {setApprovalForAll}.
     * - `from` must have a balance of tokens of type `id` of at least `amount`.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public virtual override {
    	super.safeTransferFrom(from, to, id, amount, data);
    	updateOwnership(asSingletonArray(id), to);
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {safeTransferFrom}.
     *
     * Emits a {TransferBatch} event.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
     * acceptance magic value.
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) public virtual override {
    	super.safeBatchTransferFrom(from, to, ids, amounts, data);
    	updateOwnership(ids,to);
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
	super.mint(to, id, amount, data);
	updateOwnership(asSingletonArray(id), to);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
    	super.mintBatch(to, ids, amounts, data);
    	updateOwnership(ids, to);
    }
    
    /**
     * @dev Destroys `amount` tokens of token type `id` from `from`
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `from` must have at least `amount` tokens of token type `id`.
     */
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) public virtual override {
	super.burn(from, id, amount);
    	updateOwnership(asSingletonArray(id), from);
    }
    
    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_burn}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     */
    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual override {
	super.burnBatch(from, ids, amounts);
	updateOwnership(ids, from);
    }

    function asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155PresetMinterPauser, ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }


}
