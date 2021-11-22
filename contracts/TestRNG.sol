
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

    function tossCoin1(uint256 rvalue) public pure returns(uint256){
	uint256[] memory distrib = new uint256[](1);
	distrib[0] = 1;
	
	return FireZardUtil.getRandomItem(rvalue, distrib, 4);
    }

    function tossCoin2(uint256 rvalue) public pure returns(uint256){
	uint256[] memory distrib = new uint256[](1);
	distrib[0] = 3;
	
	return FireZardUtil.getRandomItem(rvalue, distrib, 4);
    }

    function throwDice(uint256 rvalue) public pure returns(uint256){
	uint256[] memory distrib = new uint256[](5);
	distrib[0] = 1;
	distrib[1] = 1;
	distrib[2] = 1;
	distrib[3] = 1;
	distrib[4] = 1;
	return FireZardUtil.getRandomItem(rvalue, distrib, 6);
    }

}