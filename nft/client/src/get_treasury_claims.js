const Web3 = require('web3');
const Teasury_ABI = require('./contracts/Treasury.json');

const getTreasuryInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	Treasury_ABI.abi,
	'0x2D31eD860Adf96960678F88f427E279A2736c37D'
    );
}

const iterateOverClaims = (treasury) => {
    treasury.getPastEvents('withdraw',
	{
	    fromBlock: 14660101,
	    toBlock: 'latest'
	},
	async function(err, events){
	    console.log(events);
	}
    );
}

const main = () {
    const web3 = new Web3('http://127.0.0.1:9545/');
    const treasury = getTreasuryInstance(web3);
    iterateOverClaims();
}
