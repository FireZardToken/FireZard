require('dotenv').config();
const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const mnemonic = process.env["TEST_NET_MNEMONIC"];
const mnemonic_main = process.env["MAIN_NET_MNEMONIC"];

//const mnemonic = 'lend enable mixed real frame marriage high diet maze genre guilt ritual';

//const mnemonic = 'exhibit adjust hamster cabbage guilt develop also velvet strategy alpha organ almost';

//const PrivateKeyProvider = require("truffle-privatekey-provider");
//const pKey = "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      provider: () => new HDWalletProvider(mnemonic, `http://127.0.0.1:9545/`),
      network_id: '*'
    },
    testnet: {
	provider: function() {                                                                                                                                                                                                     
    	    return new PrivateKeyProvider(pKey, "http://besu:8545");                                                                                                                                                          
        },
	skipDryRun: true,
	network_id: 1337,
	gasPrice: 0,
	gas: 0xa00000
    },
    bsc_test: {
//	provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545/`),
	provider: () => new HDWalletProvider(mnemonic, `http://173.212.229.120:9646/`),
	skipDryRun: true,
	network_id: 97,
	gasPrice: 0,
	gas: 0xa00000
    },
    bsc_main: {
//	provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545/`),
//	provider: () => new HDWalletProvider(mnemonic_main, `http://127.0.0.1:9545/`),
	provider: () => new HDWalletProvider(mnemonic_main, `https://wandering-young-sun.bsc.quiknode.pro/7604a9559057ce9e3cc12280113ed97e31ff7f30/`),
	skipDryRun: true,
	network_id: 56,
//	gasPrice: 0,
	gas: 0xa00000
    },
  },
  compilers: {
    solc: {
      version: "0.8.9",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        optimizer: {
            enabled: true,
            runs: 200
        }
      }
    }
  },
 plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    bscscan: "88U8HUBZ3FATYFDFVTSWSTMRSANS5YVZ9Y"
  }
};
