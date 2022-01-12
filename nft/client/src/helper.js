const Web3 =require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { keccak256 } = require("@ethersproject/keccak256");

const FireZardUtil = require('./contracts/Util.json');
const RNG = require('./contracts/RNG.json');
const Stats = require('./contracts/DragonStats.json');

const TestRNG = require('./contracts/TestRNG.json');


const enableEth = async (mnemonic, url, use_websockets) => { // Get Web3 instance

        var hdprovider;
        if(use_websockets){
            const wsProvider = new Web3.providers.WebsocketProvider(url);
            HDWalletProvider.prototype.on = wsProvider.on.bind(wsProvider);
            hdprovider = new HDWalletProvider({mnemonic: mnemonic, providerOrUrl: wsProvider});
        }else{
            hdprovider = new HDWalletProvider(mnemonic, url);
        }
        const web3 = new Web3(hdprovider);

	const networkId = await web3.eth.net.getId();

        var deployedNetwork = FireZardUtil.networks[networkId];
	const utilInstance = new web3.eth.Contract(
            FireZardUtil.abi,
            deployedNetwork && deployedNetwork.address,
        );

	deployedNetwork = RNG.networks[networkId];
	const rngInstance = new web3.eth.Contract(
            RNG.abi,
            deployedNetwork && deployedNetwork.address,
        );

	deployedNetwork = Stats.networks[networkId];
	const statsInstance = new web3.eth.Contract(
            Stats.abi,
            deployedNetwork && deployedNetwork.address,
        );

	deployedNetwork = TestRNG.networks[networkId];
	const test_rngInstance = new web3.eth.Contract(
            TestRNG.abi,
            deployedNetwork && deployedNetwork.address,
        );

	const accounts = await web3.eth.getAccounts();
        console.log("Connected to "+url);
        return { web3: web3, provider: hdprovider, accounts: accounts,  util: utilInstance, RNG: rngInstance, Stats: statsInstance, TestRNG: test_rngInstance };
}

const hash = (nonce) => {
      return Buffer.from(keccak256(toHex(nonce)).replace('0x',''), 'hex');
}

const toHex = (num) => {
    var hexS = num.toString(16);
    const length = 32;

    while (hexS.length < length) hexS = '0'+hexS;
    return '0x'+hexS;
}

const generateNonce = () => {
    return hash(Math.floor(Math.random()*(10**12)));
}

const getRValue = async(rng, test_rng, commit_period, account) => {
        const nonce = generateNonce();
        const commitment = keccak256('0x'+nonce.toString('hex'));
	console.log("point1");
        await rng.methods.commit(commitment).send({from: account});
	console.log("point2");
        for(j=0;j<=commit_period-1;j++)
            await test_rng.methods.writeSomeData(generateNonce()).send({from: account});
	console.log("point3");
        await rng.methods.lock(nonce).send({from: account});
	console.log("point4");
        return await rng.methods.read().call(commitment);
}

module.exports = { enableEth, hash, toHex, generateNonce, getRValue }
