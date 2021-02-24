const HDWalletProvider = require('truffle-hdwallet-provider-privkey');

require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const privateKeys = process.env.PRIVATE_KEYS || ""

module.exports = {

    networks: {
        development: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*"
        },
        kovan: {
            provider: function() {
                // generate wallet from private keys in ganache
                return new HDWalletProvider(
                    // private key
                    privateKeys.split(','),
                    // url to ethereum node - infura
                    `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`
                )
            },
            gas: 5000000,
            gasPrice: 25000000000,
            network_id: 42
        }
    },
    contracts_directory: './src/contracts/',
    contracts_build_directory: './src/abis/',

    // Configure your compilers
    compilers: {
        solc: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
};
