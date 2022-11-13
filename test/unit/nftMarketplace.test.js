const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { Token } = require("nft.storage")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Unit Tests", function () {
          let nftMarketplace, basicNft, deployer, user
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract(
                  "NftMarketplace",
                  deployer
              )
              basicNft = await ethers.getContract("BasicNft", deployer)
              await basicNft.mintNft() // deployer executes transaction by default
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })
          describe("listItem", function () {
              it("emits an event after listing an item", async function () {
                  expect(
                      await nftMarketplace.listItem(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.emit("ItemListed")
              })
              it("reverts if item is already listed", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const error = `NftMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })
              it("reverts if listing is not made by nft owner", async function () {
                  const nftMarketplaceUser = nftMarketplace.connect(user)
                  await basicNft.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplaceUser.listItem(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith("NftMarketplace__NotOwner()")
              })
              it("reverts if listing price is equal to or below zero", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero()")
              })
              it("reverts if no token approval was given to nftmarketplace", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(
                      "NftMarketplace__NotApprovedForMarketplace()"
                  )
              })
              it("updates listing with seller and price", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  assert(listing.price.toString() == PRICE.toString())
                  assert(listing.seller.toString() == deployer.address)
              })
              it("emits event when item is listed", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  )
                      .to.emit(nftMarketplace, "ItemListed")
                      .withArgs(
                          deployer.address,
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
              })
          })
          describe("cancelListing", function () {
              it("reverts if cancelling is not made by nft owner", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const nftMarketplaceUser = nftMarketplace.connect(user)
                  await basicNft.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplaceUser.cancelListing(
                          basicNft.address,
                          TOKEN_ID
                      )
                  ).to.be.revertedWith("NftMarketplace__NotOwner()")
              })
              it("reverts if the nft is not listed", async function () {
                  error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })
              it("removes listing", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const listingStart = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )

                  await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  const listingEnd = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  assert.equal(listingStart.price.toString(), PRICE)
                  assert.equal(listingEnd.price.toString(), 0)
              })
              it("emits cancelled listing event", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  )
                      .to.emit(nftMarketplace, "ItemCanceled")
                      .withArgs(deployer.address, basicNft.address, TOKEN_ID)
              })
          })
          describe("buyItem", function () {
              it("reverts if the item is not listed", async function () {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })
              it("reverts if price is not met", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const LOW_PRICE = PRICE.sub(
                      ethers.utils.parseEther("0.000000001")
                  )
                  const error = `NftMarketplace__PriceNotMet("${basicNft.address}", ${TOKEN_ID}, ${PRICE})`
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: LOW_PRICE,
                      })
                  ).to.be.revertedWith(error)
              })
              it("updates internal proceeds, removes listing and transfers nft", async function () {
                  const ownerStart = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceedsBefore =
                      await nftMarketplace.getProceeds(deployer.address)
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  nftMarketplace = nftMarketplace.connect(user)
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  )
                      .to.emit(nftMarketplace, "ItemBought")
                      .withArgs(user.address, basicNft.address, TOKEN_ID, PRICE)
                  const ownerEnd = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceedsAfter =
                      await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(ownerStart.toString(), deployer.address)
                  assert.equal(ownerEnd.toString(), user.address)
                  assert.equal(
                      deployerProceedsAfter.toString(),
                      deployerProceedsBefore.add(PRICE).toString()
                  )
              })
          })
          describe("updateListing", function () {
              it("reverts if the item is not listed", async function () {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith(error)
              })
              it("reverts if listing update is not made by nft owner", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  nftMarketplace = nftMarketplace.connect(user)
                  await basicNft.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith("NftMarketplace__NotOwner()")
              })
              it("updates the listing price and sends event", async function () {
                  const UPDATED_PRICE = PRICE.add("54625")
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          UPDATED_PRICE
                      )
                  )
                      .to.emit(nftMarketplace, "ItemListed")
                      .withArgs(
                          deployer.address,
                          basicNft.address,
                          TOKEN_ID,
                          UPDATED_PRICE
                      )
                  const updatedListing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  assert.equal(listing.price.toString(), PRICE.toString())
                  assert.equal(
                      updatedListing.price.toString(),
                      UPDATED_PRICE.toString()
                  )
              })
          })
          describe("withdrawProceeds", function () {
              it("reverts if no proceed to withdraw", async function () {
                  await expect(
                      nftMarketplace.withdrawProceeds()
                  ).to.be.revertedWith("NftMarketplace__NoProceeds()")
              })
              it("withdraws proceeds", async function () {
                  const nftMarketplaceBuyer = nftMarketplace.connect(user)
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await nftMarketplaceBuyer.buyItem(
                      basicNft.address,
                      TOKEN_ID,
                      { value: PRICE }
                  )
                  const deployerBalanceBefore = await deployer.getBalance()
                  const deployerProceedsBefore =
                      await nftMarketplace.getProceeds(deployer.address)
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()
                  assert.equal(
                      deployerBalanceAfter.add(gasCost).toString(),
                      deployerBalanceBefore
                          .add(deployerProceedsBefore)
                          .toString()
                  )
              })
          })
      })
