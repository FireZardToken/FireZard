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

contract DragonStats is IStatsDerive {
    bytes32 public constant VERSION = keccak256(abi.encodePacked('DragonStats-v1'));
    string public constant RARITY_STR = 'rarity';
    string public constant HEALTH_STR = 'health';
    string public constant TYPE_STR   = 'type';
    string public constant ATTACK_STR = 'attack';
    string public constant DEFENSE_STR= 'defense';
    bytes32 public constant H_RARITY_STR = keccak256(abi.encodePacked(RARITY_STR));
    bytes32 public constant H_HEALTH_STR = keccak256(abi.encodePacked(HEALTH_STR));
    bytes32 public constant H_TYPE_STR = keccak256(abi.encodePacked(TYPE_STR));
    bytes32 public constant H_ATTACK_STR = keccak256(abi.encodePacked(ATTACK_STR));
    bytes32 public constant H_DEFENSE_STR = keccak256(abi.encodePacked(DEFENSE_STR));

    struct DragonStatsView{
	bytes32 nft_type;
	bytes32 version;

	uint256 rarity;
	uint256 health;
	uint256 type;
	uint256 attack;
	uint256 defense;
    }

    address public	statsDistrib;

    constructor(address _statsDistrib){
	linkStatsDistrib(_statsDistrib);
    }

    function linkStatsDistrib(address _statsDistrib) public {
	statsDistrib = _statsDistrib;
	emit StatsDistribLink(statsDistrib);
    }

    function deriveRarity(uint256 id) internal view returns (Util.CardRarity) {
	uint256 rvalue = uint256(keccak256(abi.encode(id,RARITY_STR)));
	return Util.CardRarity(Util.getRandomItem(rvalue, StatsDistrib(statsDistrib).getDragonCardRarities(), StatsDistrib(statsDistrib).dragonCardRarityPopulationSize()));
    }

    function deriveType(uint256 id) internal view returns (Util.CardType) {
	uint256 rvalue = uint256(keccak256(abi.encode(id,TYPE_STR)));
	return Util.CardType(Util.getRandomItem(rvalue, StatsDistrib(statsDistrib).getDragonCardTypes(), StatsDistrib(statsDistrib).dragonCardTypePopulationSize()));
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
	revert("Unsupported stat");
    }

    /**
     * @notice Defines a set of stats that can be derived
     *
     * @return An enumerable set (actually, an array) of stats that can be derived by the interface implementation
    **/
    function stats(bytes32 nft_type) external pure returns (Util.Stat[] memory) {
	require(nft_type == Util.DRAGON_CARD_TYPE_CODE, "NFT must be of Dragon Card type");
	Util.Stat[] memory stats_list = new Util.Stat[](5);
	stats_list[0] = Util.Stat(RARITY_STR, Util.StatType.Integer, false);
	stats_list[1] = Util.Stat(HEALTH_STR, Util.StatType.Integer, true);
	stats_list[2] = Util.Stat(TYPE_STR, Util.StatType.Integer, false);
	stats_list[3] = Util.Stat(ATTACK_STR, Util.StatType.Integer, true);
	stats_list[4] = Util.Stat(DEFENSE_STR, Util.StatType.Integer, true);
	return stats_list;
    }

    event StatsDistribLink(address _statsDistrib);
}
