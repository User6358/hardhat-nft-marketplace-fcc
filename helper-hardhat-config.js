const networkConfig = {
    // Goerli (chainID = 5)
    5: {
        name: "goerli",
        // Chainlink VRF Coordinator
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: "2470",
        callbackGasLimit: "500000",
        interval: "30",
        // Chainlink price feeds
        ethUsdPriceFeedAddress: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
        // NFT parameters
        mintFee: "100000000000000000", // 0.01
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000",
        interval: "30",
        mintFee: "100000000000000000", // 0.01
    },
}

const developmentChains = ["hardhat", "localhost"]
const AMOUNT = ethers.utils.parseEther("0.02")

const frontEndContractsFileMoralis =
    "../nextjs-nft-marketplace-moralis-fcc/constants/networkMapping.json"

const frontEndAbiLocation = "../nextjs-nft-marketplace-moralis-fcc/constants/"

module.exports = {
    networkConfig,
    developmentChains,
    AMOUNT,
    frontEndContractsFileMoralis,
    frontEndAbiLocation,
}
