
pragma solidity ^0.8.0;

import "./FireZardUtil.sol";

contract TestRNG {

    function tossCoin(uint256 rvalue) public pure returns(uint256){
	uint256[] memory distrib;
	distrib[0] = 1;
	return FireZardUtil.getRandomItem(rvalue, distrib, 2);
    }

}