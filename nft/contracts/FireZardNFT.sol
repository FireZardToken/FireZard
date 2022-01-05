/**
 * FireZard ERC1155 NFT for storinfg game characters and items (both stackable and unstackable)
 */

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

//contract FireZardNFT is ERC1155PresetMinterPauser, ERC1155Supply, IERC721, IERC721Metadata {
contract FireZardNFT is ERC1155PresetMinterPauser, IERC1155MetadataURI, IERC721Enumerable, IERC721Metadata {

    // List of all token IDs
    uint256[] storage public tokens;

    // Token index mapping: toklen_id => token index in tokens list
    mapping(uint256 => uint256) public tokenIndex;

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

    // Approved transfer of token_id belonging to an owner for an operator
    mapping(uint256 => mapping(address => address)) private approved;

    // Approved transfer of a token_id to an operator. Applicable only for cases where tokens with token_id belong to a single owner
    mapping(uint256 => address) private singleApproved;

    // Token custom URIs
    mapping(uint256 => string) private uris;

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

    function _transferFrom(
	address from,
	address to,
	uint256 tokenId,
	bytes	data,
	safeTransfer,
	ERC721_mode
    ) internal {
	if(ERC721_mode)require(from != address(0));
	require(to != address(0));

	uint256[] memory ids = asSingletonArray(id);
	uint256[] memory amounts = asSingletonArray(amount);
	_transferFrom(
	    from,
	    to,
	    ids,
	    amounts,
	    data,
	    safeTransfer,
	    ERC721_mode
	);
    }

    function _transferFrom(
	address from,
	address to,
	uint256[] memory ids,
	uint256[] memory amounts,
	bytes	data,
	bool	safeTransfer,
	bool	ERC721_mode
    ) internal {
	require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        require(to != address(0), "ERC1155: transfer to the zero address");

        address operator = _msgSender();
	require(
            from == operator || isApprovedForAll(from, operator) || isApproved(ids, from),
            "ERC1155: caller is not owner nor approved"
        );

        _beforeTokenTransfer(operator, from, to, ids, amounts, data);

	uint256[] memory ids_to = idsToChange(ids,to);
        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 fromBalance = _balances[id][from];
            require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
            unchecked {
                _balances[id][from] = fromBalance - amount;
            }
            _balances[id][to] += amount;
	    for(uint i=0;i<ids.length;i++)
		delete approved[ids[i]][from];
	    delete singleApproved[ids[i]];
        }
	uint256[] memory ids_from = idsToChange(ids,from);

	addOwnership(ids_to,to);
	addToInventory(ids_to,to);
	removeOwnership(ids_from,from);
	removeFromInventory(ids_from,from);

	if(ids.length>1){
    	    emit TransferBatch(operator, from, to, ids, amounts);
	    for(uint i=0;i<ids.length;i++)
		emit Transfer(from, to, ids[i]);
	}
	else{
	    emit TransferSingle(operator, from, to, ids[0], amounts[0]);
	    emit Transfer(from, to, ids[0]);
	}

	if(!safeTransfer)return;
	if(!ERC721_mode)
	    _doERC1155TransferAcceptanceCheck(operator, from, to, ids, amounts, data);
	else
	    _doERC721TransferAcceptanceCheck(from, to, ids[0], data);
    }

    function isApproved(uint256[] memory ids, owner) internal view returns (bool) {
	for(uint i=0;i<ids.length;i++){
	    if(approved[ids[i][owner]] != msg.sender)
		return false;
	}
	return true;
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

    function addTokens(uint256[] memory ids) internal {
	for(uint i=0;i<ids.length;i++){
	    if(!exists(tokens[ids[i]])){
		tokenIndex[ids[i]] = tokens.length;
		tokens.push(ids[i]);
	    }
	}
    }

    function removeTokens(uint256[] memory ids) internal {
	for(uint i=0;i<ids.length;i++){
	    if(!exists(tokens[ids[i]])){
		uint256 token_index = tokenIndex[ids[i]];
		tokens[token_index] = tokens[tokens.length-1];
		delete tokenIndex[ids[i]];
		delete tokens[tokens.length-1];
		tokens.length--;
	    }
	}
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

    function _doERC1155TransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (to.isContract()) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, amounts, data) returns (
                bytes4 response
            ) {
                if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non ERC1155Receiver implementer");
            }
        }
    }

    function _doERC721TransferAcceptanceCheck(
	address from,
	address to,
	uint256 id,
	bytes memory data
    ) private {
	require(_checkOnERC721Received(from, to, tokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
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
	_transferFrom(from, to, tokenId, bytes(0), true, true);
    }

/**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external {
	_transferFrom(from, to, tokenId, data, true, true);
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
	_transferFrom(from, to, tokenId, bytes(0), false, true);
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
	_transferFrom(from, to, id, amount, data, true, false);
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
	_transferFrom(from, to, ids, amounts, data, true, false);
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
	addTokens(ids_to);

	if(ids.length == 1){
	    super.mint(to, ids[0], amounts[0], data);
	    emit Transfer(address(0), to, ids[0]);
	}
	else{
    	    super.mintBatch(to, ids, amounts, data);
	    for(uint i=0;i<ids.length;i++)
		emit Transfer(address(0), to, ids[i]);
	}

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
    	require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || isApproved(ids, from),
            "ERC1155: caller is not owner nor approved"
        );

	if(ids.length == 1){
	    super._burn(from, ids[0], amount);
	    emit Transfer(from, address(0), ids[0]);
	}
	else{
	    super._burnBatch(from, ids, amounts);
	    for(uint i=0;i<ids.length;i++)
		emit Transfer(from, address(0), ids[i]);
	}

	uint256[] memory ids_from = idsToChange(ids,from);

	removeOwnership(ids_from,from);
	removeFromInventory(ids_from,from);
	removeTokens(ids_from);
    }

    function typeOf(uint256 id) public view returns (bytes32) {
	return token_type[id];
    }

    function ownerOf(uint256 id) public view returns (address[] storage) {
	return ownership[id];
    }

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     * @see IERC721
     */
    function balanceOf(address owner) external view returns (uint256 balance){
	return inventory[owner].length;
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
	if(balanceOf(msg.sender, tokenId)>0){
	    approved[tokenId][msg.sender] = to;
	    singleApproved[tokenId] = to;
	}
	for(uint i=0;i<ownership[tokenId].length;i++){
	    address owner = ownership[tokenId][i];
	    if(approved[tokenId][owner] == msg.sender){
		approved[tokenId][owner] = to;
		singleApproved[tokenId] = to;
	    }
	}
	revert("The caller must own or be approved to spend tokenId");
    }

    /**
     * @dev Returns the account approved for `tokenId` token.
     * If there are more accounts holding token with same id
     * the function fails.
     *
     * @see IERC721
     *
     * Requirements:
     *
     * - `tokenId` must exist and belong to a single account
     */
    function getApproved(uint256 tokenId) external view returns (address operator){
	require(ownership[tokenId] == 1);
	return singleApproved[tokenId];
    }

    /**
     * @dev Indicates whether any token exist with a given id, or not.
     *
     * @see ERC1155Supply
     */
    function exists(uint256 id) public view virtual returns (bool) {
        return super.totalSupply(id) > 0;
    }

     /**
     * @dev Returns a token ID owned by `owner` at a given `index` of its token list.
     * Use along with {balanceOf} to enumerate all of ``owner``'s tokens.
     *
     * @see IERC721Enumerable
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId){
	return slot[owner][index];
    }

    /**
     * @dev Returns a token ID at a given `index` of all the tokens stored by the contract.
     * Use along with {totalSupply} to enumerate all tokens.
     *
     * @see IERC721Enumerable
     */
    function tokenByIndex(uint256 index) external view returns (uint256){
	return tokens[index];
    }

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token.
     * 
     * @see IERC721Enumerable
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
	return uri(tokenId);
    }

    /**
     * @dev Returns the URI for token type `id`.
     *
     * If the `\{id\}` substring is present in the URI, it must be replaced by
     * clients with the actual token type ID.
     */
    function uri(uint256 id) external view returns (string memory){
	string memory token_uri = uris[id];
	if(token_uri != string(0))
	    return token_uri;
	else
	    return _uri;
    }

    function setURI(string memory token_uri, uint256 token_id) public virtual hasRole(EFAULT_ADMIN_ROLE){
	uris[token_id] = token_uri;
	emit URI(token_uri, token_id);
    }

    function setURI(string memory token_uri) public virtual hasRole(EFAULT_ADMIN_ROLE){
	_setURI(token_uri);
	emit URI(token_uri, 0);
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
