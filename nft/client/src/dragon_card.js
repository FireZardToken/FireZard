
const { keccak256 } = require("@ethersproject/keccak256");

const toHex = (num) => {
    var hexS = num.toString(16);
    const length = 32;

    while (hexS.length < length) hexS = '0'+hexS;
    return '0x'+hexS;
}

const hash = (nonce) => {
      return Buffer.from(keccak256(toHex(nonce)).replace('0x',''), 'hex');
}

const generateNonce = () => {
    return hash(Math.floor(Math.random()*(10**12)));
}

const sleep = (time) => {
    return new Promise(res => setTimeout(res, time));
}

const waitBeforeUnlock = async(web3, minter) => {
    const start = await web3.eth.getBlockNumber();
    const confirmation_cap = await minter.methods.getBlockConfirmationCap().call();
    var current = start;
    do{
	await sleep(3000);
	current = await web3.eth.getBlockNumber();
    }while(current-start > confirmation_cap);
}

const sendLoop = (method, tries) => {
    return method().catch( (err) => {
	console.error(err);
	if(tries>10)throw Error("Failed after 10 tries. Giving up.");
	console.log(tries+": retrying...");
	sendLoop(method, tries+1);
    });
}

const lockPackage = async(minter, account, nonces) => {
    method = () => {return minter.methods.lockPackage(nonces).send({from: account});}
    return await sendLoop(method, 0);
}

const openPackage = async(minter, account, commitments) => {
    method = () => {return minter.methods.openPackage(account, commitments).send({from: account});}
    return await sendLoop(method, 0);
}

const mint = async(web3, minter, account, size) => {
    // do some magic here
    // return token id
    var nonces = [];
    var commitments = [];
    if(typeof size === 'undefined')
	size = 1;
    for(var i=0;i<size;i++){
	nonces[i] = generateNonce();
	commitments[i] = keccak256('0x'+nonces[i].toString('hex'));
    }
    console.log("commitments: "+commitments);
    console.log("account: "+account);
    var cap = await minter.methods.getBlockConfirmationCap().call();
    console.log("cap: "+cap);
    await minter.methods.initPackage(commitments).send({from: account, gas: 1500000});
    await waitBeforeUnlock(web3);
/*    await lockPackage(minter, account, nonces);
    await openPackage(minter, account, commitments);
    return await minter.methods.readPackage(commitments).call();*/
    return nonces;
}

const getView = async(viewer, id) => {
    return await viewer.methods.getView(id).call();
}

module.exports = { mint, getView }
