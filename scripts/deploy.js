const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ConfAirdrop to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("📦 Deploying ConfAirdrop...");
  const ConfAirdrop = await hre.ethers.getContractFactory("ConfAirdrop");
  const airdrop = await ConfAirdrop.deploy();
  await airdrop.waitForDeployment();

  const address = await airdrop.getAddress();
  console.log("✅ ConfAirdrop deployed to:", address);

  const owner = await airdrop.owner();
  console.log("👤 Owner:", owner);
  console.log("🔒 Frozen:", await airdrop.frozen());

  console.log("\n📝 Update src/config/contracts.ts:");
  console.log(`ConfAirdrop: "${address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
