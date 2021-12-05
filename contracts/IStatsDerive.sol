/**
 * Derives stats from card ID
 * @title  Interface for deriving dragon card stats from its ID
 * @author CryptoHog
 * @notice Defines an interface for a contract deriving the stats from a randomly generated ID
 */

pragma solidity ^0.8.0;

import "./Util.sol";

interface IStatsDerive {

    /**
     * @notice Derive an integer stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatInt(bytes32 nft_type, uint256 id, string calldata name) external view returns (uint256);

    /**
     * @notice Derive a string stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatString(bytes32 nft_type, uint256 id, string calldata name) external view returns (string calldata);

    /**
     * @notice Derive a 32 byte array stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatByte32(bytes32 nft_type, uint256 id, string calldata name) external view returns (bytes32);

    /**
     * @notice Derive a boolean stat from the card's ID by the stats' name
     *
     * @param id An id generated by an RNG
     * @param name The stats' name
     * @return The stats' value
    **/
    function getStatBool(bytes32 nft_type, uint256 id, string calldata name) external view returns (bool);

    /**
     * @notice Defines a set of stats that can be derived
     *
     * @return An enumerable set (actually, an array) of stats that can be derived by the interface implementation
    **/
    function stats(bytes32 nft_type) external view returns (Util.Stat[] memory);
}
