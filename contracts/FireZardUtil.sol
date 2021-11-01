/**
 * FireZard utilities lib
 */

pragma solidity ^0.8.0;

library FireZardUtil {
    enum CardRarity { Common, Uncommon, Rare, Super_Rare, Ultra_Rare };
    enum StatType { Integer, String, ByteArray, Boolean };

    struct Stat{
	string: name,
	StatType: type,
	bool: is_mutable
    }

    function saveStat(address storage, Stat stat, name) public virtual {
	
    }
}