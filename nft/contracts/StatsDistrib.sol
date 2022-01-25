// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StatsDistrib is Ownable {

    uint256[] public dragonCardRarity;
    uint256   public dragonCardRarityPopulationSize;
    uint256[] public dragonCardType;
    uint256   public dragonCardTypePopulationSize;

    constructor() {
	dragonCardRarity = new uint256[](4);
	dragonCardRarity[0] = 1;
	dragonCardRarity[1] = 3;
	dragonCardRarity[2] = 6;
	dragonCardRarity[3] = 20;
	dragonCardRarityPopulationSize = 738;

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

    function setRarityDistrib(uint8 index, uint256 position) public onlyOwner {
	dragonCardRarity[index] = position;
    }

    function setRarityPopulationSize(uint256 size) public onlyOwner {
	dragonCardRarityPopulationSize = size;
    }
}