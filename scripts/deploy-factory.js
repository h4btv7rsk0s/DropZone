const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying AirdropFactory with account:", deployer.address);

  const AirdropFactory = await hre.ethers.getContractFactory("AirdropFactory");
  const factory = await AirdropFactory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("✅ AirdropFactory deployed to:", address);
  console.log("\nUpdate your frontend config with this address:");
  console.log(`export const CONTRACTS = {`);
  console.log(`  AirdropFactory: "${address}" as \`0x\${string}\`,`);
  console.log(`};`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
