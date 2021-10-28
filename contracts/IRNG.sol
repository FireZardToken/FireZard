/**
 * Interface for Random Number Generator
 */

pragma solidity ^0.8.0;

interface IRNG {

    function init(byte32 commitment) public virtual;

    function open(byte32 value) public virtual;

    function getRandomValue(byte32 commitment) external view returns (uint256);

}
