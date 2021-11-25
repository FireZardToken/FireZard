const Web3 =require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const FireZardUtil = require('./contracts/FireZardUtil.json');
const RNG = require('./contracts/RNG.json');

const enableEth = async () => { // Get Web3 instance

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

        console.log("Connected to "+url);
        return { web3: web3, provider: hdprovider, util: utilInstance, RNG: rngInstance };
}

