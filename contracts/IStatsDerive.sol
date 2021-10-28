/**
 * Derives stats from card ID
 */

pragma solidity ^0.8.0;

import "FireZardUtil.sol";

interface IStatsDerive.sol {
    function rarity(uint256 id) public view returns (CardRarity);

    function getStatInt(uint256 id, string name) public view returns (uint256);

    function getStatString(uint256 id, string name) public view returns (string);

    function getStatByte32(uint256 id, string name) public view returns (byte32);

    function getStatBool(uint256 id, string name) public view returns (bool);

    function stats() public view returns (Stat[]);
}