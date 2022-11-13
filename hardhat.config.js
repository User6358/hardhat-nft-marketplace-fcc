require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()
require("hardhat-deploy")
require("hardhat-contract-sizer")
require("hardhat-gas-reporter")
require("solidity-coverage")

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
    solidity: {
        compilers: [
            { version: "0.8.8" },
            { version: "0.6.12" },
            { version: "0.6.6" },
            { version: "0.6.0" },
            { version: "0.4.19" },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            /*
            forking: {
                url: process.env.MAINNET_RPC_URL,
            },
            */
        },
        localhost: {
            chainId: 31337,
        },
        goerli: {
            chainId: 5,
            url: process.env.GOERLI_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
            blockConfirmations: 6,
            saveDeployments: true,
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        //        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
        player: {
            default: 1,
        },
    },
}
