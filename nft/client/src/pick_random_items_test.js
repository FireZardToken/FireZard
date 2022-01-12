var { enableEth, getRValue } = require("./helper.js");

//const mnemonic="exhibit adjust hamster cabbage guilt develop also velvet strategy alpha organ almost";
const mnemonic = "crouch tell brick vacuum kid stone program useful mechanic hour valve hover";
const url="http://127.0.0.1:9545/";

const commit_period = 1;

const pick_item = async(rng, test_rng, account) => {
    console.log("Getting rvalue...");
    const rvalue = await getRValue(rng, test_rng, commit_period, account);
    console.log(rvalue.toString(10));
    const sample = await test_rng.methods.getSample512(rvalue).call();
    return sample;
}

const pick_items = async(rng, test_rng, tries, account) => {
    for(var i=0;i<tries;i++)
	console.log(await pick_item(rng, test_rng, account));
}

const init_distrib512 = async(test_rng, account) => {
    for(var p=0; p<=448; p+=64)
	await test_rng.methods.fillDistrib512(p).send({from: account});
}

const run = async () => {
    var eth_instance = await enableEth(mnemonic,url,false);
    var web3 = eth_instance.web3;
    var accounts = eth_instance.accounts;
    var util = eth_instance.util;
    var RNG = eth_instance.RNG;
    var TestRNG = eth_instance.TestRNG;

//    console.log(JSON.stringify(eth_instance));
    console.log("Doing distrib init...");
    await init_distrib512(TestRNG, accounts[0]);
    console.log("Distrib init done");
    await pick_items(RNG, TestRNG, 512, accounts[0]);

}

run();

