/**
 * Dragon card minter logic. Creates Unique dragon NFTs with unique IDs and all necessary data tags
 * SPDX-License-Identifier: MIT
 * @title Dragon Cards Minter
 * @author CryptoHog
 * @notice This smart contract implements core dragon cards minting logic.
 * @dev The smart contract performs the following functions
 *  - accepts orders to create a given number of new dragon cards
 *  - talks to RNG to generate unique card IDs
 *  - derives from card ID its static and iniotial dynamic stats
 *  - talks to the NFT1155 to create card's NFT
 *  - talks to the Tag Storage to store the dynamic stats
**/

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FireZardNFT.sol";
import "./IRNG.sol";
import "./IStatsDerive.sol";
import {FireZardUtil} from "./FireZardUtil.sol";

contract DragonMinter is Context, Ownable, AccessControlEnumerable {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    address public      RNG_addr;
    address public	TAG_addr;
    address public	NFT_addr;
    address public	stats_lib_addr;

    uint8 public 	group_id;
    FireZardUtil.Stat[] public stats;
    uint256 public	stats_length;

    modifier isMinter() {
	_;
    }

    /**
     * @notice Initializes the Dragon Cards minter.
     * @dev    Needs RNG smart contract address.
     * The constructor will link the dragon minter to the given RNG smart contract.
     * The onwer can relink the dragon minter to a different RNG smart contract later on.
     *
     * @param rng_contract The address of the RNG contract implementing IRNG interface.
    **/
    constructor(address rng_contract, address tag_storage, address nft_container, address stats_lib) {
	RNG_addr = rng_contract;
	TAG_addr = tag_storage;
	NFT_addr = nft_container;
	stats_lib_addr = stats_lib;
	FireZardUtil.Stat[] memory _stats = IStatsDerive(stats_lib_addr).stats(FireZardUtil.DRAGON_CARD_TYPE_CODE);
	saveStats(_stats);
//	_setupRole(MINTER_ROLE, _msgSender());
    }

    function saveStats(FireZardUtil.Stat[] memory _stats) internal {
	for(uint256 i=0;i<_stats.length;i++){
	    stats[i] = _stats[i];
	}
	stats_length = _stats.length;
    }

    function changeRNG(address rng_contract) public virtual onlyOwner {
	RNG_addr = rng_contract;
	emit RNGChange(rng_contract);
    }

    function changeTAG(address tag_storage) public virtual onlyOwner {
	TAG_addr = tag_storage;
	emit TAGChange(tag_storage);
    }

    function changeNFT(address nft_container) public virtual onlyOwner {
	NFT_addr = nft_container;
	emit NFTChange(nft_container);
    }

    function changeStatsLib(address stats_lib) public virtual onlyOwner {
	stats_lib_addr = stats_lib;
	FireZardUtil.Stat[] memory _stats = IStatsDerive(stats_lib_addr).stats(FireZardUtil.DRAGON_CARD_TYPE_CODE);
	saveStats(_stats);
	emit StatsLibChange(stats_lib);
    }

    function setTagGroupId(uint8 _group_id) public virtual onlyOwner {
	group_id = _group_id;
	emit TAGGroupID(_group_id);
    }

    /**
     * @notice Adds minter's role
     * 
     * @param entity An address of a contract or external
    **/
    function addMinter(address entity) public virtual onlyOwner {
	_setupRole(MINTER_ROLE, entity);
    }

    /**
     * @notice Removes minter's role
     * 
     * @param entity An address of a contract or external
    **/
    function removeMinter(address entity) public virtual onlyOwner {
	revokeRole(MINTER_ROLE, entity);
    }

    /**
     * @notice Initializes RNG with an array of entropy's commitments from user's side.
     * This should be called before revealing the cards.
     * The size of the array equals the number of cards to create. Cards are not revealed so far.
     * At this point the cards are hidden. It is only known how many cards will be revealed/created.
     * The cards can be revealed after certain amount of time specific to the RNG.
     * @dev    Calls RNG's init procedure for every card. Read more about generating randomness in IRNG.sol
     *
     * @param commitment Array of commitments of user's entropy for all new cards to create.
    **/
    function initPackage(bytes32[] calldata commitment) external virtual {
	for(uint i=0;i<commitment.length;i++)
	    IRNG(RNG_addr).init(commitment[i]);
    }

    /**
     * @notice Reveales new dragon cards unique IDs basing on the entropy's commitments from user's side.
     * Mints respective NFT ERC1155 tokens, derives the cards' stats and stores them into the Tag Storage
     * @dev See IRNG.sol for details on how random unique IDs are generated from the user's entropy commitments
     *
     * @param commitment Array of commitments of user's entropy for all new cards to create.
    **/
    function mintPackage(address recipient, bytes32[] calldata commitment, uint256[] calldata user_entropy) external virtual isMinter {
	for(uint i=0;i<commitment.length;i++){
	    IRNG(RNG_addr).open(commitment[i]);
	    uint256 nft_id=IRNG(RNG_addr).getRandomValue(commitment[i], user_entropy[i]);
	    FireZardNFT(NFT_addr).mint(
		recipient,
		nft_id,
		1,
		FireZardUtil.DRAGON_CARD_TYPE_CODE
	    );
	    for(uint j=0;j<stats.length;j++){
		if(!stats[j].is_mutable)continue;
		bytes32 tag_key = FireZardUtil.getTagKey(nft_id,stats[j].name);
		FireZardUtil.StatType statType = stats[j].statType;
		if(statType == FireZardUtil.StatType.Integer){
		    uint256 tag_value = IStatsDerive(stats_lib_addr).getStatInt(FireZardUtil.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    FireZardTagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}else if(statType == FireZardUtil.StatType.String){
		    string memory tag_value = IStatsDerive(stats_lib_addr).getStatString(FireZardUtil.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    FireZardTagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}else if(statType == FireZardUtil.StatType.ByteArray){
		    bytes32 tag_value = IStatsDerive(stats_lib_addr).getStatByte32(FireZardUtil.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    FireZardTagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}else if(statType == FireZardUtil.StatType.Boolean){
		    bool tag_value = IStatsDerive(stats_lib_addr).getStatBool(FireZardUtil.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    FireZardTagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}
	    }
	}
    }

    event RNGChange(address rng_contract);
    event StatsLibChange(address stats_lib);
    event TAGGroupID(uint8 group_id);
    event TAGChange(address tag_storage);
    event NFTChange(address nft_container);
}