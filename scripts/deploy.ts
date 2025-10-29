import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ConfAirdrop contract to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy ConfAirdrop
  console.log("📦 Deploying ConfAirdrop...");
  const ConfAirdrop = await ethers.getContractFactory("ConfAirdrop");
  const airdrop = await ConfAirdrop.deploy();
  await airdrop.waitForDeployment();

  const address = await airdrop.getAddress();
  console.log("✅ ConfAirdrop deployed to:", address);

  // Get owner
  const owner = await airdrop.owner();
  console.log("👤 Owner:", owner);
  console.log("🔒 Frozen:", await airdrop.frozen());

  console.log("\n📝 Update src/config/contracts.ts with the following address:");
  console.log(`ConfAirdrop: "${address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
