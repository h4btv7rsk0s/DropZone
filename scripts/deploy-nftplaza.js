const hre = require("hardhat");

async function main() {
  console.log("Deploying SealedAuction contract to Sepolia...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Constructor parameters
  const biddingSeconds = 60 * 24 * 60 * 60; // 60 days
  const seller = deployer.address;
  const imageHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // Example IPFS hash

  console.log("\nDeployment parameters:");
  console.log("- Bidding duration:", biddingSeconds, "seconds (60 days)");
  console.log("- Seller address:", seller);
  console.log("- Image hash:", imageHash);

  // Deploy contract
  const SealedAuction = await hre.ethers.getContractFactory("SealedAuction");
  const auction = await SealedAuction.deploy(biddingSeconds, seller, imageHash);

  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();

  console.log("\n✅ SealedAuction deployed to:", auctionAddress);
  console.log("🔗 Sepolia Explorer:", `https://sepolia.etherscan.io/address/${auctionAddress}`);

  // Get contract state
  const state = await auction.getState();
  console.log("\nContract state:");
  console.log("- Is bidding:", state.isBidding);
  console.log("- Is ended:", state.isEnded);
  console.log("- End time:", new Date(Number(state._endTime) * 1000).toISOString());
  console.log("- Total bids:", state._bids.toString());

  console.log("\n📝 Save this address to NFTPlaza/src/config/contracts.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
