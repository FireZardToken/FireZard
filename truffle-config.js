const path = require("path");
const PrivateKeyProvider = require("truffle-privatekey-provider");
const pKey = "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
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
  },
  compilers: {
    solc: {
      version: "^0.8",    // Fetch exact version from solc-bin (default: truffle's version)
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
    etherscan: "61KQ9AVFBJQSDJ9I9T5PUVUWEVCS8F38FD"
  }
};
