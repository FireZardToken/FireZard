
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FireZardNFT.sol";
import "./StatsView.sol";
import "./DragonStats.sol";
import {Util} from "./Util.sol";

contract Treasury is Ownable, AccessControlEnumerable {
    address public	nft;
    address public	viewer;
    address public	stats;

    bytes32 public MINTER_ROLE;

    mapping(Util.CardRarity => uint256)	public	reward_table;

    mapping(uint256 => bool)		public	claims;

    string rarity_str;
    string rarity_override_str;

    modifier onlyMinter() {
	require(hasRole(MINTER_ROLE, _msgSender()), "Treasury: must have minter role to claim rewards");
	_;
    }

    constructor(address _nft, address _viewer, address _stats) {
	nft = _nft;
	viewer = _viewer;
	stats = _stats;
	rarity_str  = DragonStats(stats).RARITY_STR();
	rarity_override_str  = DragonStats(stats).RARITY_OVERRIDE_STR();
	MINTER_ROLE = FireZardNFT(nft).MINTER_ROLE();

	super._setupRole(DEFAULT_ADMIN_ROLE,msg.sender);
    }

    /**
     * @notice Sets link to ERC1155 NFT smart contract
    **/
    function linkNFT(address _nft) public virtual onlyOwner {
        nft = _nft;
	MINTER_ROLE = FireZardNFT(nft).MINTER_ROLE();
        emit NFTLink(nft);
    }

    /**
     * @notice Sets link to Tag Storage smart contract
    **/
    function linkViewer(address _viewer) public virtual onlyOwner {
        viewer = _viewer;
        emit ViewLink(viewer);
    }

    /**
     * @notice Sets link to the Stats deriving library
    **/
    function linkStatsLib(address _stats) public virtual onlyOwner {
        stats = _stats;
	rarity_str  = DragonStats(stats).RARITY_STR();
        emit StatsLibLink(stats);
    }

    // Deposit funds
    fallback() external payable {
	emit Deposit(msg.sender, msg.value);
    }

    function withdraw(address recipient, uint256 amount) external onlyOwner {
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
	require(!claims[token_id], "Treasury: The card's reward has been already claimed");

	claims[token_id] = true;
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

    function setReward(Util.CardRarity _rarity, uint256 _reward) external onlyOwner {
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
}
