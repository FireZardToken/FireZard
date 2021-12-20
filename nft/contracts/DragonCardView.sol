
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FireZardNFT.sol";
import "./StatsView.sol";
import "./DragonStats.sol";
import {Util} from "./Util.sol";

contract DragonCardView is Ownable{

    address public	viewer_addr;
    address public	NFT_addr;
    address public	dragon_stats_addr;

    bytes32 public constant VERSION=keccak256(abi.encodePacked('DragonCard-v1'));

    struct DragonStatsView{
	address owner;
	uint256 stacked;

	bytes32 nft_type;
	bytes32 version;

	uint256 rarity;
	uint256 health;
	Util.CardType card_type;
	uint256 attack;
	uint256 defense;
    }

    constructor(address viewer, address nft_container, address dragon_stats){
	viewer_addr = viewer;
	NFT_addr = nft_container;
	dragon_stats_addr = dragon_stats;
    }

    /**
     * @notice Sets link to Tag Storage smart contract
    **/
    function linkViewer(address viewer) public virtual onlyOwner {
        viewer_addr = viewer;
        emit ViewLink(viewer);
    }

    /**
     * @notice Sets link to ERC1155 NFT smart contract
    **/
    function linkNFT(address nft_container) public virtual onlyOwner {
        NFT_addr = nft_container;
        emit NFTLink(nft_container);
    }

    /**
     * @notice Sets link to the Stats deriving library
    **/
    function linkStatsLib(address dragon_stats) public virtual onlyOwner {
        dragon_stats_addr = dragon_stats;
        emit StatsLibLink(dragon_stats);
    }


    function getView(uint256 id) public view returns (DragonStatsView memory) {
	bytes32 nft_type = FireZardNFT(NFT_addr).typeOf(id);
	string memory	rarity  = DragonStats(dragon_stats_addr).RARITY_STR();
	string memory	health  = DragonStats(dragon_stats_addr).HEALTH_STR();
	string memory	type_s  = DragonStats(dragon_stats_addr).TYPE_STR();
	string memory	attack  = DragonStats(dragon_stats_addr).ATTACK_STR();
	string memory	defense = DragonStats(dragon_stats_addr).DEFENSE_STR();
	return DragonStatsView(
	    FireZardNFT(NFT_addr).ownerOf(id),
	    FireZardNFT(NFT_addr).totalSupply(id),
	    nft_type,
	    VERSION,
	    StatsView(viewer_addr).getStat(nft_type, id, rarity).int_val,
	    StatsView(viewer_addr).getStat(nft_type, id, health).int_val,
	    Util.CardType(StatsView(viewer_addr).getStat(nft_type, id, type_s).int_val),
	    StatsView(viewer_addr).getStat(nft_type, id, attack).int_val,
	    StatsView(viewer_addr).getStat(nft_type, id, defense).int_val
	);
    }

    event	ViewLink(address tag_addr);
    event	NFTLink(address nft_addr);
    event	StatsLibLink(address dragon_stats);
}
