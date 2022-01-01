/**
 * FireZard ERC1155 NFT for storinfg game characters and items (both stackable and unstackable)
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

//contract FireZardNFT is ERC1155PresetMinterPauser, ERC1155Supply, IERC721, IERC721Metadata {
contract FireZardNFT is ERC1155PresetMinterPauser, ERC1155Supply, IERC721Enumerable, IERC721Metadata {

    // Token ownership mapping: token_id ==> array of token_owner_address
    mapping(uint256 => address[]) public ownership;

    // Owner's address position in ownership list for token_id
    mapping(address => mapping(uint256 => uint256)) private ownershipIndex;

    // Token type mapping: token_id ==> token_type (like, DRAGON_CARD_TYPE_CODE, etc.)
    mapping(uint256 => bytes32) public token_type;

    // Inventory: owner_address => array_of_token_ids
    mapping(address => uint256[]) public inventory;

    // Slot: slot position of token_id in owner_address inventory
    mapping(address => mapping(uint256 => uint256)) private slot;


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

    function ownerOf(uint256 id) public view returns (address[] storage) {
	return ownership[id];
    }
    
    function addOwnership(uint256[] memory ids, address owner) internal {
	for(uint i=0;i<ids.length;i++){
	    ownershipIndex[owner][ids[i]] = ownership[ids[i]].length;
	    ownership[ids[i]].push(owner);
	}
    }

    function removeOwnership(uint256[] memory ids, address owner) internal {
	for(uint i=0;i<ids.length;i++){
	    uint256 owner_index = ownershipIndex[owner][ids[i]];
	    ownership[owner_index] = ownership[ownership.length-1-i];
	    ownershipIndex[owner][ownership[owner_index]] = owner_index;
	    delete ownershipIndex[owner][ids[i]];
	    delete ownership[ownership.length-1-i];
	}
	ownership.length-=ids.length;
    }
    
    function addToInventory(uint256[] memory ids, address owner) internal {
	for(uint i=0;i<ids.length;i++){
	    slot[owner][ids[i]] = inventory[owner].length;
	    inventory[owner].push(ids[i]);
	}
    }

    function removeFromInventory(uint256[] memory ids, address owner) internal {
	for(uint i=0;i<ids.length;i++){
	    uint256 token_index = slot[owner][ids[i]];
	    inventory[token_index] = inventory[inventory.length-1-i];
	    slot[owner][inventory[token_index]] = token_index;
	    delete slot[owner][ids[i]];
	    delete inventory[inventory.length-1-i];
	}
	inventory.length-=ids.length;
    }

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     * @see IERC721
     */
    function balanceOf(address owner) external view returns (uint256 balance){
	return ownership[owner].length;
    }

    /**
     * @dev Returns the owner of the `tokenId` token.
     * @see IERC721
     *
     * Requirements:
     *
     * - `tokenId` must exist and belong to a single owner
     */
    function ownerOf(uint256 tokenId) external view returns (address owner){
	require(ownership[tokenId].length == 1);
	return ownership[tokenId][0];
    }

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * @see IERC721
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external {
	_transferFrom(from, to, tokenId);
	require(_checkOnERC721Received(from, to, tokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * @see IERC721
     *
     * WARNING: Usage of this method is discouraged, use {safeTransferFrom} whenever possible.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external {
	_transferFrom(from, to, tokenId);
    }

    function _transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) internal {
	safeTransferFrom(from, 
	    to, 
	    tokenId, 
	    balanceOf(from, tokenId),
	    bytes(0)
	);
    }

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * @see IERC721
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external {
	
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
	uint256[] memory ids = asSingletonArray(id);
	uint256[] memory amount = asSingletonArray(amount);
	safeBatchTransferFrom(from,to,ids,amounts,data);
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

	uint256[] memory ids_to = idsToChange(ids,to);
	    super.safeTransferFrom(from, to, ids[0], amounts[0], data);
	else
    	    super.safeBatchTransferFrom(from, to, ids, amounts, data);
	uint256[] memory ids_from = idsToChange(ids,from);

	addOwnership(ids_to,to);
	addToInventory(ids_to,to);
	removeOwnership(ids_from,from);
	removeFromInventory(ids_from,from);
    }

    function idsToChange(uint256[] memory ids, address owner) internal view returns (uint256[] memory){
	uint256[] memory ids_tmp = new uint256[](ids.length);
	uint256 index=0;
	for(uint i=0;i<ids.length;i++){
	    if(balanceOf(to,ids)==0)
		ids_tmp[index++]=ids[i];
	}
	uint256[] memory filtered_ids = new uint256[](index);
	for(uint i=0;i<index;i++)
	    filtered_ids[i] = ids_tmp[i];
	return filtered_ids;
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
	uint256[] memory ids = asSingletonArray(id);
	uint256[] memory amounts = asSingletonArray(amount);
	mintBatch(to, ids, amounts, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
	uint256[] memory ids_to = idsToChange(ids,to);

	if(ids.length == 1)
	    super.mint(to, ids[0], amounts[0], data);
	else
    	    super.mintBatch(to, ids, amounts, data);

	addOwnership(ids_to,to);
	addToInventory(ids_to,to);
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
	uint256[] memory ids = asSingletonArray(id);
	uint256[] memory amounts = asSingletonArray(amount);
	burnBatch(from, ids, amounts);
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
	if(ids.length == 1)
	    super.burn(from, id, amount);
	else
	    super.burnBatch(from, ids, amounts);

	uint256[] memory ids_from = idsToChange(ids,from);

	removeOwnership(ids_from,from);
	removeFromInventory(ids_from,from);
    }

    function asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }

    function asSingletonAddressArray(address element) private pure returns (address[] memory) {
        address[] memory array = new address[](1);
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
