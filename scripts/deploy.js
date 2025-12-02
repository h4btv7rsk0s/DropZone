const hre = require("hardhat");

async function main() {
  console.log("Deploying AirdropFactory to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("Deploying AirdropFactory...");
  const AirdropFactory = await hre.ethers.getContractFactory("AirdropFactory");
  const factory = await AirdropFactory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("AirdropFactory deployed to:", address);

  const protocolId = await factory.protocolId();
  console.log("Protocol ID:", protocolId.toString());
  console.log("Airdrop Count:", (await factory.airdropCount()).toString());

  console.log("\nUpdate src/config/contracts.ts:");
  console.log(`AirdropFactory: "${address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
