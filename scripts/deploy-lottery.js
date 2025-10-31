const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying FHELottery with account:", deployer.address);

  const FHELottery = await hre.ethers.getContractFactory("FHELottery");
  const lottery = await FHELottery.deploy();

  await lottery.waitForDeployment();
  const address = await lottery.getAddress();

  console.log("✅ FHELottery deployed to:", address);
  console.log("\nUpdate your frontend config with this address:");
  console.log(`export const CONTRACTS = {`);
  console.log(`  FHELottery: "${address}" as \`0x\${string}\`,`);
  console.log(`};`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
