/**
 * Interface for Random Number Generator
 */

pragma solidity ^0.8.0;

interface IRNG {

    function commit(bytes32 commitment) external;

    function lock(bytes32 entropy) external;

    function read(bytes32 commitment) external view returns (uint256);

}
