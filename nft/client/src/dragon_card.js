const DragonMinterABI = require('./contracts/DragonMinter.json');
const DragonViewerABI = require('./contracts/DragonCardView.json');
const RNG_ABI = require('./contracts/RNG.json');
const NFT_ABI = require('./contracts/FireZardNFT.json');
const StatsLib_ABI = require('./contracts/DragonStats.json');
const Storage_ABI = require('./contracts/TagStorage.json');
const Viewer_ABI = require('./contracts/StatsView.json');
const Util_ABI = require('./contracts/Util.json');


const { keccak256 } = require("@ethersproject/keccak256");

/**
 * Internal helper function handling transformation of a JS number into its hexadecimal representation.
 * Suitable for passing as numeric parameter to a smart contract's method call
 *
 * @param {number} num	A JS number
 * @return {string}	Hexadecimal representation of num
 */
const toHex = (num) => {
    var hexS = num.toString(16);
    const length = 32;

    while (hexS.length < length) hexS = '0'+hexS;
    return '0x'+hexS;
}

/**
 * Internal helper function handling generation of hash value from a nonce.
 * Using keccak256 as hash function.
 * The return value is suitable for passing as bytes32 parameter to a smart contract's method call.
 *
 * @param {number} nonce	(Pseudo-)randomly generated JS number
 * @return {string}	Hexadecimal representation of hash(nonce)
 */
const hash = (nonce) => {
      return Buffer.from(keccak256(toHex(nonce)).replace('0x',''), 'hex');
}

/**
 * Internal helper function handling generation of a random byte sequence.
 * The return value is suitable for passing as bytes32 parameter to a smart contract's method call.
 *
 * @return {string}	Hexadecimal representation of 32 byte sequence.
 */
const generateNonce = () => {
    return hash(Math.floor(Math.random()*(10**12)));
}

/**
 * Internal helper function.
 * Pauses thread execution for given time period.
 *
 * @param {number} time	Pause time in ms.
 */
const sleep = (time) => {
    return new Promise(res => setTimeout(res, time));
}

/**
 * Internal helper function.
 * Waits for minimal number of blocks since client's entropy commitment, when the client's entropy can be revealed by
 * calling lockPackage.
 * @see Contract DragonMinter
 * @see Contract RNG
 *
 * @param {Web3}	web3	The web3 object serving the access to the blockchain
 * @param {Contract}	minter	DragonMinter contract instance
 */
const waitBeforeLock = async(web3, minter) => {
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

/**
 * Internal helper function.
 * Tries to send repeatedly a transaction into the blockchain until suceeds or fail after 
 * the max retries cap (10 times).
 * Suitable for situations with poor connection between the client and web3 endpoint.
 *
 * @param {function}	method	A JS function implementing transaction sending to the blockchain
 * @param {numbere}	tries	Number of tries so far
 */

const sendLoop = (method, tries) => {
    return method().catch( (err) => {
	console.error(err);
	if(tries>10)throw Error("Failed after 10 tries. Giving up.");
	console.log(tries+": retrying...");
	return sendLoop(method, tries+1);
    });
}

/**
 * Internal helper function.
 * Implements locking (writing into the blockchain) mix of client's and blockchain's entropies.
 * This is a (pseudo-)randomly generated number that is derived from the mis of client's and 
 * blockchain's entropies.
 * @see Contract DragonMinter
 * @see Contract RNG
 *
 * @param {Contract}	minter	DragonMinter contract instance
 * @param {string}	account	On whose behalf the transaction is being sent
 * @param {number[]}	nonces	Client's entropy - vector of (pseudo-)randomly generated numbers at client's side
 */
const lockPackage = async(minter, account, nonces) => {
    method = () => {return minter.methods.lockPackage(nonces).send({from: account, gas: 1500000});}
    return await sendLoop(method, 0);
}

/**
 * Internal helper function.
 * Implements openning (NFT minting) of a cards' package by their commitments.
 * A (pseudo-)randomly generated number associated to a client's commitment is 
 * used as unique ID for the newly minted Dragon NFT card.
 * Initial mutable stats are derived from the ID and recored into the TAG storage smart contract
 * @see Contract DragonMinter
 * @see Contract RNG
 * @see Contract FireZardNFT
 * @see Contract TagStorage
 * @see Contract Interface IStatsDerive
 *
 * @param {Contract}	minter	DragonMinter contract instance
 * @param {string}	account	On whose behalf the transaction is being sent
 * @param {string[]}	commitments	Commitments of client's entropy - vector of hashes of client's nonces
 */
const openPackage = async(minter, account, commitments) => {
    method = () => {return minter.methods.openPackage(account, commitments).send({from: account, gas: 3000000});}
    return await sendLoop(method, 0);
}




/**
 * Implements minting of Dragon card NFTs.
 * Implements protocol for mixing client's and blockchain's entropies for generating and recording
 * on-chain (pseudo-)randomly generated numbers. Uses these numbers as unique IDs for minting new NFT Dragon Cards.
 * Derives cards' initial mutable stats and records those on-chain.
 * @see Contract DragonMinter
 * @see Contract RNG
 * @see Contract FireZardNFT
 * @see Contract TagStorage
 *
 * @param {Web3}	web3	The web3 object serving the access to the blockchain
 * @param {Contract}	minter	DragonMinter contract instance
 * @param {string}	account	On whose behalf the transaction is being sent
 * @param {number}	size	Size of the package to mint
 */
const mint = async(web3, minter, account, size) => {
    // do some magic here
    // return token id
    var nonces = [];
    var commitments = [];
    if(typeof size === 'undefined')
	size = 1;
    // Generating (pseudo-)random numbers (nonces) and their hashes on client side
    for(var i=0;i<size;i++){
	nonces[i] = generateNonce();
	commitments[i] = keccak256('0x'+nonces[i].toString('hex'));
    }
    var cap = await minter.methods.getBlockConfirmationCap().call();
    await minter.methods.initPackage(commitments).send({from: account, gas: 1500000}); // Submitting the commitments
    await waitBeforeLock(web3, minter); // Waiting the minimal number of blocks till the nonces can be locked (the nonces revealed and mixed with the blockchain's entropy)
    await lockPackage(minter, account, nonces); // Locking the nonces (mixing the nonces with the respective block hash from the past)
    await openPackage(minter, account, commitments); // Minting the NFT Dragon cards with the (pseudo-)randomly generated numbers as their IDs
    return await minter.methods.readPackage(commitments).call(); // Returning the newly minted NFT IDs
}

/**
 * @typedef {Object} View
 * @property {string} owner: NFT's owner's address
 * @property {number} stacked: Number of stacked NFTs with the given ID. It must not exceed 1 at all times
 * @property {string} nft_type: For Dragon cards this is '0x37a3c4a2a635dedf6a4912ec5757511a1f2fa87cb349543d4751fc18c65e4273'
 * @property {string} version: Version of the view struct. Currently, this is '0x7ab7c2605e2baa16da31b02f4c7ad216783d7bd840f072b0df387745c3695dc2'
 * @property {number} rarity: The Dragon card's rarity. 0 - Common, 1 - Uncommon, 2 - Rare, 3 - Super rare, 4 - Ultra rare
 * @property {number} card_type: The Dragon card's type (do not confuse with the NFT type!). 0 - Fire, 1 - Ice, 2 - Grass, 3 - Electric, 4 - Water
 * @property {BN} health: The card's health level in the interval from 0 to 2**256-1
 * @property {BN} attack: The card's attack level in the interval from 0 to 2**256-1
 * @property {BN} defense: The card's defense level in the interval from 0 to 2**256-1
 */

/**
 * Returns a comprehensive view of an NFT dragon card by its ID.
 * @see Contract FireZardNFT
 * @see Contract TagStorage
 * @see Contract DragonCardView
 * @see Enum	 Util.CardRarity
 * @see Enum	 Util.CardType
 *
 * @param  {Contract}	viewer	DragonCardView contract instance
 * @param  {number}	id	The NFT Dragon card ID
 * @return {View}	The view struct of the requested NFT
 */
const getView = async(viewer, id) => {
    return await viewer.methods.getView(id).call();
}

/**
 * Derives the DraconMinter contract instance.
 * @see Contract DragonMinter
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	DragonMinter contract instance
 */
const getDragonMinterInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	DragonMinterABI.abi,
	DragonMinterABI.networks[chainID] && DragonMinterABI.networks[chainID].address
    );
}

/**
 * Derives the DraconCardView contract instance.
 * @see Contract DragonCardView
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	DragonCardView contract instance
 */
const getDragonViewerInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	DragonViewerABI.abi,
	DragonViewerABI.networks[chainID] && DragonViewerABI.networks[chainID].address
    );
}

/**
 * Derives the RNG contract instance.
 * @see Contract RNG
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	RNG contract instance
 */
const getRNGInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	RNG_ABI.abi,
	RNG_ABI.networks[chainID] && RNG_ABI.networks[chainID].address
    );
}

/**
 * Derives the FireZardNFT contract instance.
 * @see Contract FireZardNFT
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	FireZardNFT contract instance
 */
const getNFTInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	NFT_ABI.abi,
	NFT_ABI.networks[chainID] && NFT_ABI.networks[chainID].address
    );
}

/**
 * Derives the DragonStats contract instance.
 * @see Contract DragonStats
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	DragonStats contract instance
 */
const getStatsLibInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	StatsLib_ABI.abi,
	StatsLib_ABI.networks[chainID] && StatsLib_ABI.networks[chainID].address
    );
}

/**
 * Derives the TagStorage contract instance.
 * @see Contract TagStorage
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	TagStorage contract instance
 */
const getStorageInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	Storage_ABI.abi,
	Storage_ABI.networks[chainID] && Storage_ABI.networks[chainID].address
    );
}

/**
 * Derives the StatsView contract instance.
 * @see Contract StatsView
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	StatsView contract instance
 */
const getViewerInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	Viewer_ABI.abi,
	Viewer_ABI.networks[chainID] && Viewer_ABI.networks[chainID].address
    );
}

/**
 * Derives the Util contract instance.
 * @see Contract Util
 *
 * @param  {Web3}	web3	The web3 object serving the access to the blockchain
 * @return {Contract}	Util contract instance
 */
const getUtilInstance = (web3) => {
    var chainID = web3.currentProvider.chainId;
    return new web3.eth.Contract(
	Util_ABI.abi,
	Util_ABI.networks[chainID] && Util_ABI.networks[chainID].address
    );
}

/** @module backend/Dragon/Card */
/**
 * This module provides access to Dragon Card NFT minting, manipulation and viewing functionality.
 * 
 *  - Minting new Dragon NFT cards with {@link mint}. Requires Web3 instance, {@link DragonMinter} smart contract instance and account 
 *	that will mint. Note that the Web3 instance must "know" the private key for the account. DragonMinter instance
 *	can be obtained by calling {@link getDragonMinterInstance}.
 *  - Getting view for a Dragon NFT card with {@link getView} by its ID. Requires {@link DragonCardView} smart contract instance.
 * 	The contract instance can be obtained by calling {@link getDragonViewerInstance}.
*/
module.exports = { 
 /** @see {@link mint} */
 mint,
 /** @see {@link getView} */
 getView,
 /** @see {@link getDragonMinterInstance} */
 getDragonMinterInstance,
 /** @see {@link getDragonViewerInstance} */
 getDragonViewerInstance,
 /** @see {@link getRNGInstance} */
 getRNGInstance,
 /** @see {@link getNFTInstance} */
 getNFTInstance,
 /** @see {@link getStatsLibInstance} */
 getStatsLibInstance, 
 /** @see {@link getStorageInstance} */
 getStorageInstance, 
 /** @see {@link getViewerInstance} */
 getViewerInstance, 
 /** @see {@link getUtilInstance} */
 getUtilInstance 
}
