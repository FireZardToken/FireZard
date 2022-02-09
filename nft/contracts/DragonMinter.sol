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
import "./dependencies/IBEP20.sol";
import "./FireZardNFT.sol";
import "./IRNG.sol";
import "./RNG.sol";
import "./IStatsDerive.sol";
import "./DragonStats.sol";
import "./StatsView.sol";
import "./TagStorage.sol";
import "./CrossContractManListener.sol";
import {Util} from "./Util.sol";

contract DragonMinter is CrossContractManListener {
    string  public contract_name = Util.DRAGON_MINTER_CONTRACT_NAME;
    bytes32 public contract_id = Util.DRAGON_MINTER_CONTRACT_ID;
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    address public      RNG_addr;
    address public	TAG_addr;
    address public	NFT_addr;
    address public	FLAME_addr;
    address public	stats_lib_addr;

    uint8 public 	group_id;
    Util.Stat[] public stats;
    uint256 public	stats_length;

    bool public		testMode=true;

    mapping(uint256 => uint256) public	price_list;

    modifier isMinter() {
	_;
    }

    function getName() view external returns(string memory) {
	return contract_name;
    }

    function getId() view external returns(bytes32) {
	return contract_id;
    }

    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) external onlyManager {
	if(hname == Util.RNG_CONTRACT_ID){
    	    _linkRNG(contractInstance);
    	    return;
	}
	if(hname == Util.TAG_STORAGE_CONTRACT_ID){
    	    _linkTAG(contractInstance);
    	    return;
	}
	if(hname == Util.NFT_CONTRACT_ID){
    	    _linkNFT(contractInstance);
    	    return;
	}
	if(hname == Util.DRAGON_STATS_CONTRACT_ID){
    	    _linkStatsLib(contractInstance);
    	    return;
	}
	if(hname == Util.FLAME_CONTRACT_ID){
    	    _linkFLAME(contractInstance);
    	    return;
	}
    }

    function onListenRemoved(bytes32 hname) external onlyManager {
	if(hname == Util.RNG_CONTRACT_ID){
    	    _linkRNG(address(0));
    	    return;
	}
	if(hname == Util.TAG_STORAGE_CONTRACT_ID){
    	    _linkTAG(address(0));
    	    return;
	}
	if(hname == Util.NFT_CONTRACT_ID){
    	    _linkNFT(address(0));
    	    return;
	}
	if(hname == Util.DRAGON_STATS_CONTRACT_ID){
    	    _linkStatsLib(address(0));
    	    return;
	}
	if(hname == Util.FLAME_CONTRACT_ID){
    	    _linkFLAME(address(0));
    	    return;
	}
    }

    function onUpdate(address oldInstance, address _manager) external override {
	super._onUpdate(oldInstance, _manager);
	_setTagGroupId(DragonMinter(oldInstance).group_id());
	if(DragonMinter(oldInstance).testMode())
	    _disableMintFee();
	else
	    _enableMintFee();
	_setPrice(1,  DragonMinter(oldInstance).getPrice(1));
	_setPrice(10, DragonMinter(oldInstance).getPrice(10));
    }

    function _linkRNG(address rng_contract) internal {
	RNG_addr = rng_contract;
	emit RNGLink(rng_contract);
    }

    function _linkTAG(address tag_storage) internal {
	TAG_addr = tag_storage;
	emit TAGLink(tag_storage);
    }

    function _linkNFT(address nft_container) internal {
	NFT_addr = nft_container;
	emit NFTLink(nft_container);
    }

    function _linkFLAME(address _flame) internal {
	FLAME_addr = _flame;
	emit FLAMELink(_flame);
    }

    function _linkStatsLib(address stats_lib) internal {
	stats_lib_addr = stats_lib;
	if(stats_lib != address(0)){
	    Util.Stat[] memory _stats = IStatsDerive(stats_lib_addr).stats(Util.DRAGON_CARD_TYPE_CODE);
	    saveStats(_stats);
	}else
	    saveStats(new Util.Stat[](0));
	emit StatsLibLink(stats_lib);
    }

    function saveStats(Util.Stat[] memory _stats) internal {
	delete stats;
	for(uint256 i=0;i<_stats.length;i++){
	    stats.push(_stats[i]);
	}
	stats_length = _stats.length;
    }

    /**
     * @notice Sets link to RNG smart contract
    **/
    function linkRNG(address rng_contract) public virtual onlyOwner {
	_linkRNG(rng_contract);
    }

    /**
     * @notice Sets link to Tag Storage smart contract
    **/
    function linkTAG(address tag_storage) public virtual onlyOwner {
	_linkTAG(tag_storage);
    }

    /**
     * @notice Sets link to ERC1155 NFT smart contract
    **/
    function linkNFT(address nft_container) public virtual onlyOwner {
	_linkNFT(nft_container);
    }

    /**
     * @notice Sets link to BEP20 FLAME smart contract
    **/
    function linkFLAME(address _flame) public virtual onlyOwner {
	_linkFLAME(_flame);
    }

    /**
     * @notice Sets link to the Stats deriving library
    **/
    function linkStatsLib(address stats_lib) public virtual onlyOwner {
	_linkStatsLib(stats_lib);
    }

    /**
     * @notice Sets group ID for the Dragon card minter within Tag Storage
    **/
    function setTagGroupId(uint8 _group_id) public virtual onlyOwner {
	_setTagGroupId(_group_id);
    }

    function _setTagGroupId(uint8 _group_id) internal {
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

    function enableMintFee() public virtual onlyOwner {
	_enableMintFee();
    }

    function _enableMintFee() internal {
	testMode = false;
	emit EnableMintFee();
    }

    function disableMintFee() public virtual onlyOwner {
	_disableMintFee();
    }

    function _disableMintFee() internal {
	testMode = true;
	emit DisableMintFee();
    }

    function setPrice(uint256 size, uint256 price) public virtual onlyOwner {
	_setPrice(size, price);
    }

    function _setPrice(uint256 size, uint256 price) internal {
	price_list[size] = price;
	emit SetPrice(size, price);
    }


    function getPrice(uint256 size) public virtual view returns (uint256) {
	return price_list[size];
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
	if(!testMode){
	    uint256 price = getPrice(commitment.length);
	    require(price > 0, "Unacceptable card package size");
	    IBEP20(FLAME_addr).transferFrom(_msgSender(),address(this),price);
	}
	for(uint i=0;i<commitment.length;i++)
	    IRNG(RNG_addr).commit(commitment[i]);
    }

    /**
     * @notice Lock an array of client's entropies that have been commited earlier
     *
     * @param entropy The array of client's entropies
    **/
    function lockPackage(bytes32[] calldata entropy) external virtual {
	for(uint i=0;i<entropy.length;i++){
	    IRNG(RNG_addr).lock(entropy[i]);
	}
    }

    /**
     * @notice Reveales new dragon cards unique IDs basing on the entropy's commitments from user's side.
     * Mints respective NFT ERC1155 tokens, derives the cards' stats and stores them into the Tag Storage
     * @dev See IRNG.sol for details on how random unique IDs are generated from the user's entropy commitments
     *
     * @param commitment Array of commitments of user's entropy for all new cards to create.
    **/
    function openPackage(address recipient, bytes32[] calldata commitment) external virtual {
	bool non_common_found = false;
	string memory rarity = DragonStats(stats_lib_addr).RARITY_STR();
	for(uint i=0;i<commitment.length;i++){
	    uint256 nft_id=IRNG(RNG_addr).read(commitment[i]);
	    require(FireZardNFT(NFT_addr).totalSupply(nft_id) == 0, "Same dragon card can be openned at most once");
	    FireZardNFT(NFT_addr).mint(
		recipient,
		nft_id,
		1,
		abi.encodePacked(Util.DRAGON_CARD_TYPE_CODE)
	    );
	    Util.CardRarity rarity_val = Util.CardRarity(IStatsDerive(stats_lib_addr).getStatInt(Util.DRAGON_CARD_TYPE_CODE, nft_id, rarity));
	    if(rarity_val != Util.CardRarity.Common)
		non_common_found = true;
	    for(uint j=0;j<stats_length;j++){
		if(!stats[j].is_mutable)continue;
		bytes32 tag_key = Util.getTagKey(nft_id,stats[j].name);
		Util.StatType statType = stats[j].statType;
		if(statType == Util.StatType.Integer){
		    uint256 tag_value = IStatsDerive(stats_lib_addr).getStatInt(Util.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    TagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}else if(statType == Util.StatType.String){
		    string memory tag_value = IStatsDerive(stats_lib_addr).getStatString(Util.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    TagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}else if(statType == Util.StatType.ByteArray){
		    bytes32 tag_value = IStatsDerive(stats_lib_addr).getStatByte32(Util.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    TagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}else if(statType == Util.StatType.Boolean){
		    bool tag_value = IStatsDerive(stats_lib_addr).getStatBool(Util.DRAGON_CARD_TYPE_CODE, nft_id, stats[j].name);
		    TagStorage(TAG_addr).setTag(group_id, tag_key, tag_value);
		}
	    }
	}
	if((commitment.length == 10)&&(!non_common_found)){
	    uint256 nft_id=IRNG(RNG_addr).read(commitment[4]);
	    bytes32 tag_key = Util.getTagKey(nft_id, DragonStats(stats_lib_addr).RARITY_OVERRIDE_STR());
	    TagStorage(TAG_addr).setTag(group_id, tag_key, true);
	}
    }

    function readPackage(bytes32[] calldata commitment) external virtual view returns (uint256[] memory) {
	uint256[] memory	ids = new uint256[](commitment.length);
	for(uint i=0;i<commitment.length;i++)
	    ids[i] = IRNG(RNG_addr).read(commitment[i]);
	return ids;
    }

    function getBlockConfirmationCap() external view returns (uint256){
	return RNG(RNG_addr).getBlockConfirmationCap();
    }

    event RNGLink(address rng_contract);
    event StatsLibLink(address stats_lib);
    event TAGGroupID(uint8 group_id);
    event TAGLink(address tag_storage);
    event NFTLink(address nft_container);
    event FLAMELink(address _flame);
    event EnableMintFee();
    event DisableMintFee();
    event SetPrice(uint256 size, uint256 price);
}
