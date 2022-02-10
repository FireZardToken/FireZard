// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FireZardNFT.sol";
import "./StatsView.sol";
import "./DragonStats.sol";
import "./TagStorage.sol";
import "./CrossContractManListener.sol";
import {Util} from "./Util.sol";

contract Treasury is CrossContractManListener {
    string  public contract_name = Util.TREASURY_CONTRACT_NAME;
    bytes32 public contract_id = Util.TREASURY_CONTRACT_ID;

    address public	nft;
    address public	viewer;
    address public	stats;
    address public	TAG_addr;

    bytes32 public MINTER_ROLE;

    mapping(Util.CardRarity => uint256)	public	reward_table;

//    mapping(uint256 => bool)		public	claims;

    string rarity_str;
    string rarity_override_str;

    uint8 public group_id = 10;

    modifier onlyMinter() {
	require(hasRole(MINTER_ROLE, _msgSender()), "Treasury: must have minter role to claim rewards");
	_;
    }

/*    constructor(address _nft, address _viewer, address _stats) {
	nft = _nft;
	viewer = _viewer;
	stats = _stats;
	rarity_str  = DragonStats(stats).RARITY_STR();
	rarity_override_str  = DragonStats(stats).RARITY_OVERRIDE_STR();
	MINTER_ROLE = FireZardNFT(nft).MINTER_ROLE();

	super._setupRole(DEFAULT_ADMIN_ROLE,msg.sender);
    }*/

    function getName() view external returns(string memory) {
	return contract_name;
    }

    function getId() view external returns(bytes32) {
	return contract_id;
    }

    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) external onlyManager {
	if(hname == Util.NFT_CONTRACT_ID){
	    _linkNFT(contractInstance);
	    return;
	}
	if(hname == Util.DRAGON_STATS_CONTRACT_ID){
	    _linkStatsLib(contractInstance);
	    return;
	}
	if(hname == Util.STATS_VIEW_CONTRACT_ID){
	    _linkViewer(contractInstance);
	    return;
	}
	if(hname == Util.TAG_STORAGE_CONTRACT_ID){
	    _linkTAG(contractInstance);
	    return;
	}
    }

    function onListenRemoved(bytes32 hname) external {}

    function onUpdate(address oldInstance, address _manager) external override {
	super._onUpdate(oldInstance, _manager);

	address payable oldAddr = payable(oldInstance);

	uint256 UR_v = Treasury(oldAddr).getRewardValue(Util.CardRarity.Ultra_Rare);
	uint256 SR_v = Treasury(oldAddr).getRewardValue(Util.CardRarity.Super_Rare);
	uint256 R_v = Treasury(oldAddr).getRewardValue(Util.CardRarity.Rare);
	uint256 U_v = Treasury(oldAddr).getRewardValue(Util.CardRarity.Uncommon);
	uint256 C_v = Treasury(oldAddr).getRewardValue(Util.CardRarity.Common);

	_setReward(Util.CardRarity.Ultra_Rare, UR_v);
	_setReward(Util.CardRarity.Super_Rare, SR_v);
	_setReward(Util.CardRarity.Rare, R_v);
	_setReward(Util.CardRarity.Common, C_v);
    }

    function onReplaced(address newInstance) external virtual override {
	super._onReplaced(newInstance);

	uint256 balance = address(this).balance;

	_withdraw(newInstance, balance);
    }

    /**
     * @notice Sets link to ERC1155 NFT smart contract
    **/
    function _linkNFT(address _nft) internal {
        nft = _nft;
	MINTER_ROLE = FireZardNFT(nft).MINTER_ROLE();
        emit NFTLink(nft);
    }

    /**
     * @notice Sets link to Tag Storage smart contract
    **/
    function _linkViewer(address _viewer) internal {
        viewer = _viewer;
        emit ViewLink(viewer);
    }

    /**
     * @notice Sets link to the Stats deriving library
    **/
    function _linkStatsLib(address _stats) internal {
        stats = _stats;
	rarity_str  = DragonStats(stats).RARITY_STR();
	rarity_override_str  = DragonStats(stats).RARITY_OVERRIDE_STR();
        emit StatsLibLink(stats);
    }

    function _linkTAG(address tag_storage) internal {
	TAG_addr = tag_storage;
	emit TAGLink(tag_storage);
    }


    /**
     * @notice Sets link to ERC1155 NFT smart contract
    **/
    function linkNFT(address _nft) public virtual onlyOwner {
        _linkNFT(_nft);
    }

    /**
     * @notice Sets link to Tag Storage smart contract
    **/
    function linkViewer(address _viewer) public virtual onlyOwner {
	_linkViewer(_viewer);
    }

    /**
     * @notice Sets link to the Stats deriving library
    **/
    function linkStatsLib(address _stats) public virtual onlyOwner {
	_linkStatsLib(_stats);
    }

    /**
     * @notice Sets link to Tag Storage smart contract
    **/
    function linkTAG(address tag_storage) public virtual onlyOwner {
	_linkTAG(tag_storage);
    }

    // Deposit funds
    fallback() external payable {
	emit Deposit(msg.sender, msg.value);
    }

    function withdraw(address recipient, uint256 amount) external onlyOwner {
	_withdraw(recipient, amount);
    }

    function _withdraw(address recipient, uint256 amount) internal {
	(bool _res, bytes memory _data) = recipient.call{value: amount}("");
	require(_res, "Treasury: Failed to withdraw BNB");
	emit Withdraw(recipient, amount);
    }

    function claim(uint256 token_id) external {
	require(FireZardNFT(nft).totalSupply(token_id) == 1, "Treasury: The token must be present in single quantity");

	address to = FireZardNFT(nft).ownerOf(token_id);
	if(to != _msgSender())
	    if(!hasRole(MINTER_ROLE, _msgSender()))
		revert("Treasury: The reward must be claimed to the token owner");

	require(FireZardNFT(nft).typeOf(token_id) == Util.DRAGON_CARD_TYPE_CODE, "Treasury: The token must be of Dragon Card NFT type");
	require(!this.isClaimed(token_id), "Treasury: The card's reward has been already claimed");

//	claims[token_id] = true;
	_setClaimed(token_id);
	Util.CardRarity card_rarity;
	if(StatsView(viewer).getStat(Util.DRAGON_CARD_TYPE_CODE, token_id, rarity_override_str).bool_val)
	    card_rarity = Util.CardRarity.Uncommon;
	else
	    card_rarity = Util.CardRarity(StatsView(viewer).getStat(Util.DRAGON_CARD_TYPE_CODE, token_id, rarity_str).int_val);
	uint256 reward_value = reward_table[card_rarity];
	if(reward_value>0){
	    (bool _res, bytes memory _data) = to.call{value: reward_value}("");
	    require(_res, "Treasury: Failed to claim BNB");
	    emit Claimed(to, token_id, reward_value);
	}
    }

    function setClaimed(address to, uint256 token_id, uint256 reward_value) external onlyOwner {
	_setClaimed(token_id);
        emit Claimed(to, token_id, reward_value);
    }

    function _setClaimed(uint256 token_id) internal {
//	claims[token_id] = true;
	bytes32 tag_key = Util.getTagKey(token_id, DragonStats(stats).CARD_CLAIMED_STR());
        TagStorage(TAG_addr).setTag(group_id, tag_key, true);
    }


    function isClaimed(uint256 token_id) external view returns(bool) {
//	bytes32 tag_key = Util.getTagKey(token_id, DragonStats(stats).CARD_CLAIMED_STR());
	try StatsView(viewer).getStat(Util.DRAGON_CARD_TYPE_CODE, token_id, DragonStats(stats).CARD_CLAIMED_STR()) returns(Util.StatValue memory result){
	    return result.bool_val;
	}catch{
	    return false;
	}
    }

    function setReward(Util.CardRarity _rarity, uint256 _reward) external onlyOwner {
	_setReward(_rarity, _reward);
    }

    function _setReward(Util.CardRarity _rarity, uint256 _reward) internal {
	reward_table[_rarity] = _reward;
    }

    function getRewardValue(Util.CardRarity _rarity) external view returns (uint256) {
	return reward_table[_rarity];
    }

    event NFTLink(address contract_addr);
    event ViewLink(address contract_addr);
    event StatsLibLink(address contract_addr);
    event Deposit(address sender, uint256 amount);
    event Withdraw(address sender, uint256 amount);
    event Claimed(address sender, uint256 token_id, uint256 value);
    event TAGLink(address tag_storage);
}
