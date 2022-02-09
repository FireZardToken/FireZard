// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./CrossContractManListener.sol";
import "./Util.sol";
import "./IRNG.sol";

contract RNG is CrossContractManListener, IRNG {
    string  public contract_name = Util.RNG_CONTRACT_NAME;
    bytes32 public contract_id = Util.RNG_CONTRACT_ID;

    uint256 public commitment_confirmation_cap = 1;
    bool public test_mode;

    mapping(bytes32 => uint256) commitments;
    mapping(bytes32 => uint256) rvalues;

    mapping(uint256 => bytes32) block_hashes;
    uint256 public	latest_block;

    constructor(bool _test_mode){
	test_mode = _test_mode;
    }

    function getName() view external returns(string memory) {
	return contract_name;
    }

    function getId() view external returns(bytes32) {
	return contract_id;
    }

    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) external {}

    function onListenRemoved(bytes32 hname) external {}

    function onUpdate(address oldInstance, address _manager) external override {
	super._onUpdate(oldInstance, _manager);
	_setCommitmentConfirmationCap(RNG(oldInstance).commitment_confirmation_cap());
    }

    function updateBlockHashes() external virtual {
	if((block.number - latest_block) > 255)
	    latest_block = block.number - 255;
	for(uint i=latest_block;i<block.number;i++)
	    block_hashes[i] = blockhash(i);
	latest_block = block.number;
    }

    function _setCommitmentConfirmationCap(uint256 cap) internal {
	commitment_confirmation_cap = cap;

	emit ConfirmationCap(cap);
    }

    function setCommitmentConfirmationCap(uint256 cap) external onlyOwner {
	_setCommitmentConfirmationCap(cap);
    }

    function commit(bytes32 commitment) external {
	require((commitments[commitment] == 0),"The entropy should not have been commited before");
	commitments[commitment] = block.number;

	emit Commit(commitment);
    }

    function resetCommitment(bytes32 commitment) external onlyOwner {
	require(test_mode, "This method works in test mode only");
	commitments[commitment] = 0;
	rvalues[commitment] = 0;

	emit ResetCommitment(commitment);
    }

    function _getHash(uint256 _block_num) internal view returns (bytes32) {
	bytes32 _block_hash;
	if(block.number - _block_num > 255)
	    _block_hash = block_hashes[_block_num];
	else
	    _block_hash = blockhash(_block_num);
	return _block_hash;
    }

    function _getRandomValue(uint256 block_num, bytes32 user_entropy) internal view returns (uint256) {
	require((block.number - block_num  > commitment_confirmation_cap),"The entropy must have been committed at least the commitment_confirmation_cap blocks earlier");
	return uint256(keccak256(abi.encodePacked(_getHash(block_num+commitment_confirmation_cap), user_entropy)));
    }

    function lock(bytes32 entropy) external{
	bytes32 commitment = Util.deriveCommitment(entropy);
	require(rvalues[commitment] == 0, "The entropy should not have been locked before");
	uint256 block_num = commitments[commitment];
	require(block_num > 0, "The entropy must have been committed earlier");
	rvalues[commitment] = _getRandomValue(block_num,entropy);

	emit EntropyLock(commitment);
    }

    function read(bytes32 commitment) external view returns (uint256){
	return rvalues[commitment];
    }

    function getBlockConfirmationCap() external view returns (uint256){
	return commitment_confirmation_cap;
    }

    event ConfirmationCap(uint256 cap);
    event ResetCommitment(bytes32 commitment);
    event EntropyLock(bytes32 commitment);
    event Commit(bytes32 commitment);
}
