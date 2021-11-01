/**
 * Dragon card minter logic. Creates Unique dragon NFTs with unique IDs and all necessary data tags
 * SPDX-License-Identifier: MIT
 * @title Dragon Cards Minter
 * @author CryptoHog
 * @notice This smart contract implements core dragon cards minting logic.
 * @dev The smart contract performs the following functions
 *  - accepts orders to create a given number of new dragon cards
 *  - talks to RNG to generate unique card IDs
 *  - derives from card ID its static and iniotial dynamic stats
 *  - talks to the NFT1155 to create card's NFT
 *  - talks to the Tag Storage to store the dynamic stats
**/

pragma solidity ^0.8.0;

import "IRNG.sol";

contract DragonMinter is Context, Ownable, AccessControlEnumerable {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    address public          RNG_addr;

    /**
     * @notice Initializes the Dragon Cards minter.
     * @dev    Needs RNG smart contract address.
     * The constructor will link the dragon minter to the given RNG smart contract.
     * The onwer can relink the dragon minter to a different RNG smart contract later on.
     *
     * @param rng_contract The address of the RNG contract implementing IRNG interface.
    **/
    constructor(address rng_contract) {
	this.RNG_addr = rng_contract;
//	_setupRole(MINTER_ROLE, _msgSender());
    }

    /**
     * @notice Adds minter's role
     * 
     * @param entity An address of a contract or external
    **/
    addMinter(address entity) public virtual onlyOwner {
	_setupRole(MINTER_ROLE, entity);
    }

    /**
     * @notice Removes minter's role
     * 
     * @param entity An address of a contract or external
    **/
    removeMinter(address entity) public virtual onlyOwner {
	_revokeRole(MINTER_ROLE, entity);
    }

    /**
     * @notice Initializes RNG with an array of entropy's commitments from user's side.
     * This should be called before revealing the cards.
     * The size of the array equals the number of cards to create. Cards are not revealed so far.
     * At this point the cards are hidden. It is only known how many cards will be revealed/created.
     * The cards can be revealed after certain amount of time specific to the RNG.
     * @dev    Calls RNG's init procedure for every card. Read more about generating randomness in IRNG.sol
     *
     * @param commitment Array of commitments of user's entropy for all new cards to create.
    **/
    initPackage(byte32[] calldata commitment) external virtual {
	for(i=0;i<commitment.length;i++)
	    IRNG(RNG_addr).init(commitment[i]);
    }

    /**
     * @notice Reveales new dragon cards unique IDs basing on the entropy's commitments from user's side.
     * Mints respective NFT ERC1155 tokens, derives the cards' stats and stores them into the Tag Storage
     * @dev See IRNG.sol for details on how random unique IDs are generated from the user's entropy commitments
     *
     * @param commitment Array of commitments of user's entropy for all new cards to create.
    **/
    mintPackage(byte32[] calldata commitment) external virtual isMinter {
	for(i=0;i<commitment.length;i++){
	    IRNG(RNG_addr).open(commitment[i]);
	    rvalue=IRNG(RNG_addr).getRandomValue(commitment[i]);
	    
	}
    }
}