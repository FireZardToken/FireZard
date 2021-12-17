
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FireZardNFT.sol";
import "./StatsView.sol";
import "./DragonStats.sol";
import {Util} from "./Util.sol";

contract DragonStatsView is Ownable{

    address public	viewer_addr;
    address public	NFT_addr;

    struct DragonStatsView{
	address owner;
	address stacked;

	bytes32 nft_type;
	bytes32 version;

	uint256 rarity;
	uint256 health;
	Util.CardType card_type;
	uint256 attack;
	uint256 defense;
    }

//    constructor()

}
