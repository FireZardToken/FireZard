
pragma solidity ^0.8.0;

import "./FireZardUtil.sol";

contract TestRNG {

    uint256 public data;

    function writeSomeData(uint256 _data) public virtual {
	data = _data;
    }

    function tossCoin(uint256 rvalue) public pure returns(uint256){
	uint256[] memory distrib = new uint256[](1);
	distrib[0] = 1;
	
	return FireZardUtil.getRandomItem(rvalue, distrib, 2);
    }

}