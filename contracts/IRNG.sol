/**
 * Interface for Random Number Generator
 */

pragma solidity ^0.8.0;

interface IRNG {

    function commit(bytes32 commitment) external;

    function deriveRandomValue(uint256 user_entropy) external view returns (uint256);

    function getRandomValue(uint256 user_entropy) public returns (uint256);

}
