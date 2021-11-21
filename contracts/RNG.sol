
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./FireZardUtil.sol";

import "./IRNG.sol";

contract RNG is IRNG, Ownable {
    uint256 public commitment_confirmation_cap = 10;
    bool public test_mode;

    mapping(bytes32 => uint256) commitments;
    mapping(bytes32 => uint256) rvalues;

/*    constructor(){
	test_mode = false;
    }*/

    constructor(bool _test_mode){
	test_mode = _test_mode;
    }

    function setCommitmentConfirmationCap(uint256 cap) external onlyOwner {
	commitment_confirmation_cap = cap;

	emit ConfirmationCap(cap);
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

    function _getRandomValue(uint256 block_num, bytes32 user_entropy) internal view returns (uint256) {
	require((block.number - block_num  > commitment_confirmation_cap),"The entropy must have been committed at least the commitment_confirmation_cap blocks earlier");
	return uint256(keccak256(abi.encodePacked(blockhash(block_num+commitment_confirmation_cap),user_entropy)));
    }

/*    function _deriveCommitment(uint256 user_entropy) internal pure returns (bytes32){
	return keccak256(abi.encodePacked(user_entropy));
    }*/

    function lock(bytes32 entropy) external{
	bytes32 commitment = FireZardUtil.deriveCommitment(entropy);
	require(rvalues[commitment] == 0, "The entropy should not have been locked before");
	uint256 block_num = commitments[commitment];
	require(block_num > 0, "The entropy must have been committed earlier");
	rvalues[commitment] = _getRandomValue(block_num,entropy);

	emit EntropyLock(commitment);
    }

    function read(bytes32 commitment) external view returns (uint256){
	return rvalues[commitment];
    }

    event ConfirmationCap(uint256 cap);
    event ResetCommitment(bytes32 commitment);
    event EntropyLock(bytes32 commitment);
    event Commit(bytes32 commitment);
}
