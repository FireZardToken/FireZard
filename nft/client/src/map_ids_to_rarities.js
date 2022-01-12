var { enableEth, getRValue } = require("./helper.js");

//const mnemonic="exhibit adjust hamster cabbage guilt develop also velvet strategy alpha organ almost";

const mnemonic = "crouch tell brick vacuum kid stone program useful mechanic hour valve hover";

const url="http://127.0.0.1:9545/";

const filled = (rarity_ids) => {
    if(rarity_ids.length < 5)return false;
    for(var i=0;i<5;i++){
	if(typeof rarity_ids[i] === 'undefined')return false;
	if(rarity_ids[i] == 0) return false;
    }
    return true;
}

const search = async (stats,util) => {
    var rarity_ids = [0];

    var DRAGON_CARD_TYPE_CODE = await util.methods.DRAGON_CARD_TYPE_CODE().call();
    console.log('DRAGON_CARD_TYPE_CODE: '+DRAGON_CARD_TYPE_CODE);

    while(!filled(rarity_ids)){
	var id = Math.floor(Math.random()*(10**12));
	var rarity = await stats.methods.getStatInt(DRAGON_CARD_TYPE_CODE,id,'rarity').call();
	console.log(id+" - "+rarity);
	rarity_ids[rarity] = id;
    }
    return rarity_ids;
}


const run = async () => {
    var eth_instance = await enableEth(mnemonic,url,false);
    var web3 = eth_instance.web3;
    var accounts = eth_instance.accounts;
    var util = eth_instance.util;
    var RNG = eth_instance.RNG;
    var Stats = eth_instance.Stats;

    var ids = await search(Stats, util);

    console.log("==============================================");
    console.log(ids);
}

run();

