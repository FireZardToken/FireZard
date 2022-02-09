pragma solidity 0.8.9;

// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../dependencies/IBEP20.sol";
import "../dependencies/BEP20.sol";

interface Token {
    function transfer(address, uint256) external returns (bool);
}

contract FLAME_MOCK is BEP20, Ownable {
    
    mapping (address => bool) public minters;
    
    bool public canAddMinter = true;
    
    constructor() BEP20("FLAME", "$FLAME") {
        _mint(msg.sender, 10000000 *10**18);
    }
    
    /// @notice Creates `_amount` token to `_to`. Must only be called by the Minter.
    function mint(address _to, uint256 _amount) public onlyMinter {
        _mint(_to, _amount);
    }

    function addMinter(address account) public onlyOwner {
        require(canAddMinter, "No more minter");
        minters[account] = true;
    }
    
    function StopAddingMinter() public onlyOwner {
        canAddMinter = false;
    }

    function removeMinter(address account) public onlyOwner {
        minters[account] = false;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Restricted to minters.");
        _;
    }
    
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }
    
    // function to allow admin to transfer *any* BEP20 tokens from this contract
    function transferAnyBEP20Tokens(address tokenAddress, address recipient, uint256 amount) public onlyOwner {
        require(amount > 0, "BEP20: amount must be greater than 0");
        require(recipient != address(0), "BEP20: recipient is the zero address");
        Token(tokenAddress).transfer(recipient, amount);
    }
}
