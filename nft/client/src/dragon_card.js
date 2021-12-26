
const DragonMinterABI = require('./contracts/DragonMinter.json');
const DragonViewerABI = require('./contracts/DragonCardView.json');
const RNG_ABI = require('./contracts/RNG.json');
const NFT_ABI = require('./contracts/FireZardNFT.json');
const StatsLib_ABI = require('./contracts/DragonStats.json');
const Storage_ABI = require('./contracts/TagStorage.json');
const Viewer_ABI = require('./contracts/StatsView.json');
const Util_ABI = require('./contracts/Util.json');


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
//    console.log(current);
    do{
	await sleep(3000);
	current = await web3.eth.getBlockNumber();
//	console.log(current);
    }while(current-start < confirmation_cap);
//    console.log("DONE!");
}

const sendLoop = (method, tries) => {
    return method().catch( (err) => {
	console.error(err);
	if(tries>10)throw Error("Failed after 10 tries. Giving up.");
	console.log(tries+": retrying...");
	return sendLoop(method, tries+1);
    });
}

const lockPackage = async(minter, account, nonces) => {
    method = () => {return minter.methods.lockPackage(nonces).send({from: account, gas: 1500000});}
    return await sendLoop(method, 0);
}

const openPackage = async(minter, account, commitments) => {
    method = () => {return minter.methods.openPackage(account, commitments).send({from: account, gas: 3000000});}
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
    var cap = await minter.methods.getBlockConfirmationCap().call();
    await minter.methods.initPackage(commitments).send({from: account, gas: 1500000});
    await waitBeforeUnlock(web3, minter);
    await lockPackage(minter, account, nonces);
    await openPackage(minter, account, commitments);
    return await minter.methods.readPackage(commitments).call();
}

const getView = async(viewer, id) => {
    return await viewer.methods.getView(id).call();
}

const getDragonMinterInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	DragonMinterABI.abi,
	DragonMinterABI.networks[chainID] && DragonMinterABI.networks[chainID].address
    );
}

const getDragonViewerInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	DragonViewerABI.abi,
	DragonViewerABI.networks[chainID] && DragonViewerABI.networks[chainID].address
    );
}

const getRNGInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	RNG_ABI.abi,
	RNG_ABI.networks[chainID] && RNG_ABI.networks[chainID].address
    );
}

const getNFTInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	NFT_ABI.abi,
	NFT_ABI.networks[chainID] && NFT_ABI.networks[chainID].address
    );
}

const getStatsLibInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	StatsLib_ABI.abi,
	StatsLib_ABI.networks[chainID] && StatsLib_ABI.networks[chainID].address
    );
}

const getStorageInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	Storage_ABI.abi,
	Storage_ABI.networks[chainID] && Storage_ABI.networks[chainID].address
    );
}

const getViewerInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	Viewer_ABI.abi,
	Viewer_ABI.networks[chainID] && Viewer_ABI.networks[chainID].address
    );
}

const getUtilInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	Util_ABI.abi,
	Util_ABI.networks[chainID] && Util_ABI.networks[chainID].address
    );
}

module.exports = { mint, getView, getDragonMinterInstance, getDragonViewerInstance, getRNGInstance, getRNGInstance, 
    getNFTInstance, getStatsLibInstance, getStorageInstance, getViewerInstance, getUtilInstance }
