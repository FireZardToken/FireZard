var { eth_instance } = require("./helper.js");

const pick_itme = async(distrib,size) => {
    
}

const pick_items = async(size,tries) => {
    var distrib = [];
    for(var i=0;i<size-1;i++)
	distrib[i]=1;
    for(var i=0;i<tries;i++)
	console.log(await pick_item(distrib,size));
}

const run = async () => {
    var eth_instance = enableEth();
    var web3 = eth_instance.web3;
    var util = eth_instance.util;
    var RNG = eth_instance.RNG;
}

run();

