// SPDX-License-Identifier: MIT
/**
 * Derives dragon card stats from card ID
 * @title  Deriving dragon card stats from its ID
 * @author CryptoHog
 * @notice Defines an interface for a contract deriving the stats from a randomly generated ID
 */

pragma solidity ^0.8.0;

import "./Util.sol";
import "./IStatsDerive.sol";
import "./StatsDistrib.sol";
import "./CrossContractManListener.sol";

contract DragonStats is CrossContractManListener, IStatsDerive {
    string  public constant contract_name = 'DragonStats';
    bytes32 public constant contract_id = keccak256(abi.encodePacked(contract_name));

    bytes32 public constant VERSION = keccak256(abi.encodePacked('DragonStats-v1'));
    string public constant RARITY_STR = 'rarity';
    string public constant RARITY_OVERRIDE_STR = 'rarity_override';
    string public constant HEALTH_STR = 'health';
    string public constant TYPE_STR   = 'type';
    string public constant ATTACK_STR = 'attack';
    string public constant DEFENSE_STR= 'defense';
    string public constant CHARACTER_STR= 'character';
    string public constant CHARACTER_NAME_STR= 'character_name';
    bytes32 public constant H_RARITY_STR = keccak256(abi.encodePacked(RARITY_STR));
    bytes32 public constant H_RARITY_OVERRIDE_STR = keccak256(abi.encodePacked(RARITY_OVERRIDE_STR));
    bytes32 public constant H_HEALTH_STR = keccak256(abi.encodePacked(HEALTH_STR));
    bytes32 public constant H_TYPE_STR = keccak256(abi.encodePacked(TYPE_STR));
    bytes32 public constant H_ATTACK_STR = keccak256(abi.encodePacked(ATTACK_STR));
    bytes32 public constant H_DEFENSE_STR = keccak256(abi.encodePacked(DEFENSE_STR));
    bytes32 public constant H_CHARACTER_STR = keccak256(abi.encodePacked(CHARACTER_STR));
    bytes32 public constant H_CHARACTER_NAME_STR = keccak256(abi.encodePacked(CHARACTER_NAME_STR));

    string public constant CHARACTER_FIREZARD_STR = 'FireZard';
    string public constant CHARACTER_FLAROZARD_STR = 'FlaroZard';
    string public constant CHARACTER_EMBERZARD_STR = 'EmberZard';
    string public constant CHARACTER_FLAMEBRYO_STR = 'Flamebryo';
    string public constant CHARACTER_BLIZARD_STR = 'BliZard';
    string public constant CHARACTER_FROZARD_STR = 'FroZard';
    string public constant CHARACTER_CHILLAZARD_STR = 'ChillaZard';
    string public constant CHARACTER_COOLBRYO_STR = 'Coolbryo';
    string public constant CHARACTER_FLORAZARD_STR = 'FloraZard';
    string public constant CHARACTER_BLOSZARD_STR = 'BlosZard';
    string public constant CHARACTER_SPROUTYZARD_STR = 'SproutyZard';
    string public constant CHARACTER_SEEDBRYO_STR = 'Seedbryo';
    string public constant CHARACTER_LECTRAZARD_STR = 'LectraZard';
    string public constant CHARACTER_VOLZARD_STR = 'VolZard';
    string public constant CHARACTER_SPARKYZARD_STR = 'SparkyZard';
    string public constant CHARACTER_ZAPBRYO_STR = 'Zapbryo';
    string public constant CHARACTER_HYDRAZARD_STR = 'HydraZard';
    string public constant CHARACTER_AQAZARD_STR = 'AqaZard';
    string public constant CHARACTER_DRIPLAZARD_STR = 'DriplaZard';
    string public constant CHARACTER_SPLASH_STR = 'Splashbryo';

    string[] public CHARACTER_NAMES = [
	CHARACTER_FIREZARD_STR,   // 000
	CHARACTER_FIREZARD_STR,   // 001
	CHARACTER_FLAROZARD_STR,  // 002
	CHARACTER_FLAROZARD_STR,  // 003
	CHARACTER_FLAROZARD_STR,  // 004
	CHARACTER_EMBERZARD_STR,  // 005
	CHARACTER_EMBERZARD_STR,  // 006
	CHARACTER_EMBERZARD_STR,  // 007
	CHARACTER_FLAMEBRYO_STR,  // 008
	CHARACTER_FLAMEBRYO_STR,  // 009
	CHARACTER_FLAMEBRYO_STR,  // 010
	CHARACTER_FLAMEBRYO_STR,  // 011
	CHARACTER_FLAMEBRYO_STR,  // 012
	CHARACTER_BLIZARD_STR,    // 013
	CHARACTER_BLIZARD_STR,    // 014
	CHARACTER_FROZARD_STR,    // 015
	CHARACTER_FROZARD_STR,    // 016
	CHARACTER_FROZARD_STR,    // 017
	CHARACTER_CHILLAZARD_STR, // 018
	CHARACTER_CHILLAZARD_STR, // 019
	CHARACTER_CHILLAZARD_STR, // 020
	CHARACTER_COOLBRYO_STR,   // 021
	CHARACTER_COOLBRYO_STR,   // 022
	CHARACTER_COOLBRYO_STR,   // 023
	CHARACTER_COOLBRYO_STR,   // 024
	CHARACTER_COOLBRYO_STR,   // 025
	CHARACTER_FLORAZARD_STR,  // 026
	CHARACTER_FLORAZARD_STR,  // 027
	CHARACTER_BLOSZARD_STR,   // 028
	CHARACTER_BLOSZARD_STR,   // 029
	CHARACTER_BLOSZARD_STR,   // 030
	CHARACTER_SPROUTYZARD_STR,// 031
	CHARACTER_SPROUTYZARD_STR,// 032
	CHARACTER_SPROUTYZARD_STR,// 033
	CHARACTER_SEEDBRYO_STR,   // 034
	CHARACTER_SEEDBRYO_STR,   // 035
	CHARACTER_SEEDBRYO_STR,   // 036
	CHARACTER_SEEDBRYO_STR,   // 037
	CHARACTER_SEEDBRYO_STR,   // 038
	CHARACTER_LECTRAZARD_STR, // 039
	CHARACTER_LECTRAZARD_STR, // 040
	CHARACTER_VOLZARD_STR,    // 041
	CHARACTER_VOLZARD_STR,    // 042
	CHARACTER_VOLZARD_STR,    // 043
	CHARACTER_SPARKYZARD_STR, // 044
	CHARACTER_SPARKYZARD_STR, // 045
	CHARACTER_SPARKYZARD_STR, // 046
	CHARACTER_ZAPBRYO_STR,    // 047
	CHARACTER_ZAPBRYO_STR,    // 048
	CHARACTER_ZAPBRYO_STR,    // 049
	CHARACTER_ZAPBRYO_STR,    // 050
	CHARACTER_ZAPBRYO_STR,    // 051
	CHARACTER_HYDRAZARD_STR,  // 052
	CHARACTER_HYDRAZARD_STR,  // 053
	CHARACTER_AQAZARD_STR,    // 054
	CHARACTER_AQAZARD_STR,    // 055
	CHARACTER_AQAZARD_STR,    // 056
	CHARACTER_DRIPLAZARD_STR, // 057
	CHARACTER_DRIPLAZARD_STR, // 058
	CHARACTER_DRIPLAZARD_STR, // 059
	CHARACTER_SPLASH_STR,	  // 060
	CHARACTER_SPLASH_STR,	  // 061
	CHARACTER_SPLASH_STR,	  // 062
	CHARACTER_SPLASH_STR,	  // 063
	CHARACTER_SPLASH_STR	  // 064
    ];

    uint256[] private  RARE_CHARACTER_DISTRIB = [1,1];
    uint256   private constant RARE_CHARACTER_DISTRIB_SIZE = 3;
    uint256[] private  UNCOMMON_CHARACTER_DISTRIB = [1,1];
    uint256   private constant UNCOMMON_CHARACTER_DISTRIB_SIZE = 3;
    uint256[] private  COMMON_CHARACTER_DISTRIB = [1,1,1,1];
    uint256   private constant COMMON_CHARACTER_DISTRIB_SIZE = 5;

    address public	statsDistrib;

/*    constructor(address _statsDistrib){
	linkStatsDistrib(_statsDistrib);
    }*/

    function getName() pure external returns(string memory) {
	return contract_name;
    }

    function getId() pure external returns(bytes32) {
	return contract_id;
    }

    function tokenTypeCode() external pure returns (bytes32){
	return Util.DRAGON_CARD_TYPE_CODE;
    }

    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) external onlyManager {
	if(hname == StatsDistrib(contractInstance).contract_id()){
    	    _linkStatsDistrib(contractInstance);
    	    return;
	}
    }

    function onListenRemoved(bytes32 hname) external onlyManager {
	if(hname == StatsDistrib(statsDistrib).contract_id()){
    	    _linkStatsDistrib(address(0));
    	    return;
	}
    }

    function _linkStatsDistrib(address _statsDistrib) internal {
	statsDistrib = _statsDistrib;
	emit StatsDistribLink(statsDistrib);
    }

    function linkStatsDistrib(address _statsDistrib) public virtual onlyOwner {
	_linkStatsDistrib(_statsDistrib);
    }

    function deriveRarity(uint256 id) internal view returns (Util.CardRarity) {
	uint256 rvalue = uint256(keccak256(abi.encode(id,RARITY_STR)));
	return Util.CardRarity(Util.getRandomItem(rvalue, StatsDistrib(statsDistrib).getDragonCardRarities(), StatsDistrib(statsDistrib).dragonCardRarityPopulationSize()));
    }

    function deriveType(uint256 id) internal view returns (Util.CardType) {
	uint256 rvalue = uint256(keccak256(abi.encode(id,TYPE_STR)));
	return Util.CardType(Util.getRandomItem(rvalue, StatsDistrib(statsDistrib).getDragonCardTypes(), StatsDistrib(statsDistrib).dragonCardTypePopulationSize()));
    }

    function deriveCharacter(uint256 id, Util.CardRarity rarity, Util.CardType c_type) public view returns (uint256) {
	uint8 offset;
	if(c_type == Util.CardType.Fire)     offset = 0;
	if(c_type == Util.CardType.Ice)      offset = 13;
	if(c_type == Util.CardType.Plant)    offset = 26;
	if(c_type == Util.CardType.Electric) offset = 39;
	if(c_type == Util.CardType.Water)    offset = 52;

	if(rarity == Util.CardRarity.Ultra_Rare)
	    return offset;
	if(rarity == Util.CardRarity.Super_Rare)
	    return offset+1;

	uint256 rvalue = uint256(keccak256(abi.encode(id,CHARACTER_STR)));

	if(rarity == Util.CardRarity.Rare)
	    return offset+2+Util.getRandomItem(rvalue, RARE_CHARACTER_DISTRIB, RARE_CHARACTER_DISTRIB_SIZE);

	if(rarity == Util.CardRarity.Uncommon)
	    return offset+5+Util.getRandomItem(rvalue, UNCOMMON_CHARACTER_DISTRIB, UNCOMMON_CHARACTER_DISTRIB_SIZE);

	if(rarity == Util.CardRarity.Common)
	    return offset+8+Util.getRandomItem(rvalue, COMMON_CHARACTER_DISTRIB, COMMON_CHARACTER_DISTRIB_SIZE);

	revert("DragonStats: Failed to derive the character");
    }

    function deriveCharacterName(uint256 character) public view returns (string memory) {
	return CHARACTER_NAMES[character];
    }

    /**
     * @notice Derive an integer stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatInt(bytes32 nft_type, uint256 id, string calldata name) external view returns (uint256){
	require(nft_type == Util.DRAGON_CARD_TYPE_CODE, "NFT must be of Dragon Card type");
	bytes32 h_name = keccak256(abi.encodePacked(name));
	if(h_name == H_RARITY_STR)
	    return uint256(deriveRarity(id));
	if(h_name == H_TYPE_STR)
	    return uint256(deriveType(id));
	if(h_name == H_CHARACTER_STR){
	    revert("DragonStats: call deriveCharacter explicitly");
/*	    Util.CardRarity rarity = deriveRarity(id);
	    Util.CardType   type   = deriveType(id);
	    uint256 character = deriveCharacter(id,rarity,type);
	    require(character <= 64, "DragonStats: chartacter number out of bounds (64)");
	    return character;*/
	}
	if((h_name == H_HEALTH_STR)||(h_name == H_ATTACK_STR)||(h_name == H_DEFENSE_STR))
	    return Util.MAX_UINT;
	revert("Unsupported stat");
    }

    /**
     * @notice Derive a string stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatString(bytes32 nft_type, uint256 id, string calldata name) external view returns (string calldata){
	require(nft_type == Util.DRAGON_CARD_TYPE_CODE, "NFT must be of Dragon Card type");
	bytes32 h_name = keccak256(abi.encodePacked(name));
	if(h_name == H_CHARACTER_NAME_STR){
	    revert("DragonStats: call deriveCharacterName explicitly");
	}
	
	revert("Unsupported stat");
    }

    /**
     * @notice Derive a 32 byte array stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatByte32(bytes32 nft_type, uint256 id, string calldata name) external view returns (bytes32){
	require(nft_type == Util.DRAGON_CARD_TYPE_CODE, "NFT must be of Dragon Card type");
	revert("Unsupported stat");
    }

    /**
     * @notice Derive a boolean stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatBool(bytes32 nft_type, uint256 id, string calldata name) external view returns (bool){
	require(nft_type == Util.DRAGON_CARD_TYPE_CODE, "NFT must be of Dragon Card type");
	bytes32 h_name = keccak256(abi.encodePacked(name));
	if(h_name == H_RARITY_OVERRIDE_STR)
	    return false;
	revert("Unsupported stat");
    }

    /**
     * @notice Defines a set of stats that can be derived
     *
     * @return An enumerable set (actually, an array) of stats that can be derived by the interface implementation
    **/
    function stats(bytes32 nft_type) external pure returns (Util.Stat[] memory) {
	require(nft_type == Util.DRAGON_CARD_TYPE_CODE, "NFT must be of Dragon Card type");
	Util.Stat[] memory stats_list = new Util.Stat[](8);
	stats_list[0] = Util.Stat(RARITY_STR, Util.StatType.Integer, false);
	stats_list[1] = Util.Stat(HEALTH_STR, Util.StatType.Integer, true);
	stats_list[2] = Util.Stat(TYPE_STR, Util.StatType.Integer, false);
	stats_list[3] = Util.Stat(ATTACK_STR, Util.StatType.Integer, true);
	stats_list[4] = Util.Stat(DEFENSE_STR, Util.StatType.Integer, true);
	stats_list[5] = Util.Stat(RARITY_OVERRIDE_STR, Util.StatType.Boolean, true);
	stats_list[6] = Util.Stat(CHARACTER_STR, Util.StatType.Integer, false);
	stats_list[7] = Util.Stat(CHARACTER_NAME_STR, Util.StatType.String, false);
	return stats_list;
    }

    event StatsDistribLink(address _statsDistrib);
}
