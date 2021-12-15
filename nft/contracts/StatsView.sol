
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IStatsDerive.sol";
import "./TagStorage.sol";
import {Util} from "./Util.sol";

contract StatsView is Ownable{

    address public	TAG_addr;
    address public	NFT_addr;
    mapping(bytes32 => address) public	stats_lib_addr;

    constructor(address tag_storage, address nft_container){
	TAG_addr = tag_storage;
	NFT_addr = nft_container;
    }

    /**
     * @notice Sets link to Tag Storage smart contract
    **/
    function linkTAG(address tag_storage) public virtual onlyOwner {
        TAG_addr = tag_storage;
        emit TAGLink(tag_storage);
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
    function linkStatsLib(address stats_lib, bytes32 nft_type) public virtual onlyOwner {
        stats_lib_addr[nft_type] = stats_lib;
        emit StatsLibLink(stats_lib, nft_type);
    }

    /**
     * @notice Defines a set of stats that can be derived
     *
     * @return An enumerable set (actually, an array) of stats that can be derived by the interface implementation
    **/
    function stats(bytes32 nft_type) external view returns (Util.Stat[] memory) {
	return IStatsDerive(stats_lib_addr[nft_type]).stats(nft_type);
	revert('Unknown NFT type');
    }

     /**
     * @notice Read an integer stat
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStat(bytes32 nft_type, uint256 id, string calldata name) external view returns (Util.StatValue memory){
	bytes32 h_name = keccak256(abi.encodePacked(name));

	Util.Stat[] memory _stats = this.stats(nft_type);
	for(uint i=0; i<_stats.length; i++){
	    bytes32 h_stats_name = keccak256(abi.encodePacked(_stats[i].name));
	    if(h_name != h_stats_name)continue;
	    if(_stats[i].is_mutable){
		bytes32 key = Util.getTagKey(id,name);
		if(_stats[i].statType == Util.StatType.Integer)
		    return (Util.StatValue(_stats[i].statType, TagStorage(TAG_addr).getIntValue(key), "", "", false));
		else if(_stats[i].statType == Util.StatType.String)
		    return (Util.StatValue(_stats[i].statType, 0, TagStorage(TAG_addr).getStringValue(key), "", false));
		else if(_stats[i].statType == Util.StatType.ByteArray)
		    return (Util.StatValue(_stats[i].statType, 0, "", TagStorage(TAG_addr).getByte32Value(key), false));
		else if(_stats[i].statType == Util.StatType.Boolean)
		    return (Util.StatValue(_stats[i].statType, 0, "", "", TagStorage(TAG_addr).getBooleanValue(key)));
		revert("Unknown mutable stat type");
	    }else{
		if(_stats[i].statType == Util.StatType.Integer)
		    return (Util.StatValue(_stats[i].statType, IStatsDerive(stats_lib_addr[nft_type]).getStatInt(nft_type, id, name), "", "", false));
		else if(_stats[i].statType == Util.StatType.String)
		    return (Util.StatValue(_stats[i].statType, 0, IStatsDerive(stats_lib_addr[nft_type]).getStatString(nft_type, id, name), "", false));
		else if(_stats[i].statType == Util.StatType.ByteArray)
		    return (Util.StatValue(_stats[i].statType, 0, "", IStatsDerive(stats_lib_addr[nft_type]).getStatByte32(nft_type, id, name), false));
		else if(_stats[i].statType == Util.StatType.Boolean)
		    return (Util.StatValue(_stats[i].statType, 0, "", "", IStatsDerive(stats_lib_addr[nft_type]).getStatBool(nft_type, id, name)));
		revert("Unknown mutable stat type");
	    }
	}
	revert("Requested integer tag not found");
    }

    event	TAGLink(address tag_addr);
    event	NFTLink(address nft_addr);
    event	StatsLibLink(address stats_lib_addr, bytes32 nft_type);

}