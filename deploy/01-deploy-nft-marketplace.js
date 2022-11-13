const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("01-DEPLOY-START--------------------------------------------")
    log(`Network: ${networkConfig[network.config.chainId]["name"]}`)
    log(`Deploying with ${deployer}`)

    const args = []
    const nftMarketplace = await deploy("NftMarketplace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(nftMarketplace.address, args)
    }
    log("01-DEPLOY-END----------------------------------------------")
}

module.exports.tags = ["all", "nftmarketplace", "main"]
