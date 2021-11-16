
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IRNG.sol";

contract RNG is IRNG, Ownable {
    uint256 public commitment_confirmation_cap = 10;
    bool public test_mode;

    mapping(bytes32 => uint256) commitments;
//    mapping(bytes32 => uint256) rvalues;

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

    function init(bytes32 commitment) external {
	require((commitments[commitment] == 0),"The commitment should not have been initialized before");
	commitments[commitment] = block.number;
    }

    function resetCommitment(bytes32 commitment) external onlyOwner {
	require(test_mode, "This method works in test mode only");
	commitments[commitment] = 0;
//	rvalues[commitment] = 0;

	emit ResetCommitment(commitment);
    }

    function getRandomValue(uint256 user_entropy) external view returns (uint256) {
	bytes32 commitment = keccak256(abi.encodePacked(user_entropy));
/*	uint256 rvalue = rvalues[commitment];
	if(rvalue != 0)
	    return rvalue;*/
	uint256 block_num  = commitments[commitment];
	require((block.number - block_num  > commitment_confirmation_cap),"The entropy must have been committed at least the commitment_confirmation_cap blocks earlier");
	return uint256(keccak256(abi.encodePacked(blockhash(block_num),commitment_confirmation_cap)));
//	rvalues[commitment] = rvalue;
//	return rvalue;
    }

    event ConfirmationCap(uint256 cap);
    event ResetCommitment(bytes32 commitment);
}