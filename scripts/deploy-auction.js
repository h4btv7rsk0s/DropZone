const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SealedAuction with account:", deployer.address);

  // Deploy a sample auction: 7 days duration
  const biddingSeconds = 7 * 24 * 60 * 60; // 7 days
  const seller = deployer.address;
  const imageHash = "QmX1Y2Z3..."; // IPFS hash placeholder

  const SealedAuction = await hre.ethers.getContractFactory("SealedAuction");
  const auction = await SealedAuction.deploy(biddingSeconds, seller, imageHash);

  await auction.waitForDeployment();
  const address = await auction.getAddress();

  console.log("✅ SealedAuction deployed to:", address);
  console.log("\nAuction Details:");
  console.log("- Seller:", seller);
  console.log("- Duration: 7 days");
  console.log("- End time:", new Date(Date.now() + biddingSeconds * 1000).toLocaleString());
  
  console.log("\nUpdate your frontend config with this address:");
  console.log(`export const CONTRACTS = {`);
  console.log(`  SealedAuction: "${address}" as \`0x\${string}\`,`);
  console.log(`};`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
