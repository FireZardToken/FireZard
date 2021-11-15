/**
 * Interface for Random Number Generator
 */

pragma solidity ^0.8.0;

interface IRNG {

    function init(bytes32 commitment) external;

    function open(bytes32 value) external;

    function getRandomValue(bytes32 commitment, uint256 user_entropy) external view returns (uint256);

}
