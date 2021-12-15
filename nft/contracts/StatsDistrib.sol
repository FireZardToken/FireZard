
pragma solidity ^0.8.0;

contract StatsDistrib {

    uint256[] public dragonCardRarity;
    uint256   public dragonCardRarityPopulationSize;
    uint256[] public dragonCardType;
    uint256   public dragonCardTypePopulationSize;

    constructor() {
	dragonCardRarity = new uint256[](4);
	dragonCardRarity[0] = 1;
	dragonCardRarity[1] = 10;
	dragonCardRarity[2] = 20;
	dragonCardRarity[3] = 125;
	dragonCardRarityPopulationSize = 512;

	dragonCardType = new uint256[](4);
	dragonCardType[0] = 1;
	dragonCardType[1] = 1;
	dragonCardType[2] = 1;
	dragonCardType[3] = 1;
	dragonCardTypePopulationSize = 5;
    }

    function getDragonCardRarities() public view returns (uint256[] memory){
	return dragonCardRarity;
    }

    function getDragonCardTypes() public view returns (uint256[] memory){
	return dragonCardType;
    }

}