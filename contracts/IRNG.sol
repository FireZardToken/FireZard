/**
 * Interface for Random Number Generator
 */

pragma solidity ^0.8.0;

interface IRNG {

    function init(bytes32 commitment) public virtual;

    function open(bytes32 value) public virtual;

    function getRandomValue(bytes32 commitment) external view returns (uint256);

}
