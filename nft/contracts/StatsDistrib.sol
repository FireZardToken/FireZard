// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CrossContractManListener.sol";
import {Util} from "./Util.sol";

contract StatsDistrib is CrossContractManListener {
    string  public contract_name = Util.STATS_DISTRIB_CONTRACT_NAME;
    bytes32 public contract_id = Util.STATS_DISTRIB_CONTRACT_ID;

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

    function getName() view external returns(string memory) {
	return contract_name;
    }

    function getId() view external returns(bytes32) {
	return contract_id;
    }

    function onListenAdded(bytes32 hname, address contractInstance, bool isNew) external {}

    function onListenRemoved(bytes32 hname) external {}

    function onUpdate(address oldInstance, address _manager) external override {
	super._onUpdate(oldInstance, _manager);
	uint256[] memory _dragonCardRarity = StatsDistrib(oldInstance).getDragonCardRarities();
	dragonCardRarity = new uint256[](_dragonCardRarity.length);
	for(uint8 i=0;i<_dragonCardRarity.length;i++)
	    setRarityDistrib(i,_dragonCardRarity[i]);
	setRarityPopulationSize(StatsDistrib(oldInstance).dragonCardRarityPopulationSize());
	uint256[] memory _dragonCardType = StatsDistrib(oldInstance).getDragonCardTypes();
	dragonCardType = new uint256[](_dragonCardType.length);
	for(uint i=0;i<_dragonCardType.length;i++)
	    dragonCardType[i] = _dragonCardType[i];
	dragonCardTypePopulationSize = StatsDistrib(oldInstance).dragonCardRarityPopulationSize();
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
