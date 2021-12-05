/**
 * FireZard utilities lib
 */

pragma solidity ^0.8.0;

//import "./TagStorage.sol";

library Util {
    uint256 public constant MAX_UINT = (~uint256(0)-1);
//    bytes32 public constant DRAGON_CARD_TYPE_CODE = abi.encodePacked(keccak256('DRAGON_CARD'));
    bytes32 public constant DRAGON_CARD_TYPE_CODE = keccak256('DRAGON_CARD');

    enum CardRarity{ Common, Uncommon, Rare, Super_Rare, Ultra_Rare }
    enum CardType{ Fire, Ice, Grass, Electric, Water }
    enum StatType{ Integer, String, ByteArray, Boolean }

    struct Stat{
	string name;
	StatType statType;
	bool is_mutable;
    }

    function getTagKey(uint256 nft_id, string calldata name) public pure returns(bytes32) {
	return keccak256(abi.encodePacked(nft_id, name));
    }

    function getRandomItem(uint256 rvalue, uint256[] calldata distribution, uint256 size) public pure returns(uint256) {
	uint256 ratio = MAX_UINT/size;
	uint256 svalue = 0;
	for(uint256 i=0;i<distribution.length;i++){
	    svalue+=ratio*distribution[i];
	    if(rvalue < svalue)
		return i;
	}
	return distribution.length;
    }

      function deriveCommitment(bytes32 entropy) public pure returns (bytes32){
        return keccak256(abi.encodePacked(entropy));
    }

}
