const hre = require("hardhat");

async function main() {
  console.log("Creating test auctions...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Sample auction data
  const auctions = [
    {
      name: "Crypto Punk #3100",
      duration: 60 * 24 * 60 * 60, // 60 days
      imageHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
    },
    {
      name: "Bored Ape #8817",
      duration: 60 * 24 * 60 * 60, // 60 days
      imageHash: "QmSg9bPzW9anFYc3wWU7uzXH3qvXzZ8N8JcZf5Sj7vvYxp"
    },
    {
      name: "Azuki #9605",
      duration: 60 * 24 * 60 * 60, // 60 days
      imageHash: "QmZt5X6xJVhKxZfXvqJvg4KJ3qM8wHh5GxJnz3rQ9pNxYt"
    }
  ];

  for (const auctionData of auctions) {
    console.log(`\n📦 Creating auction: ${auctionData.name}`);

    const SealedAuction = await hre.ethers.getContractFactory("SealedAuction");
    const auction = await SealedAuction.deploy(
      auctionData.duration,
      deployer.address,
      auctionData.imageHash
    );

    await auction.waitForDeployment();
    const address = await auction.getAddress();

    console.log(`✅ Deployed to: ${address}`);
    console.log(`   Duration: ${auctionData.duration / 86400} days`);
    console.log(`   Image: ${auctionData.imageHash}`);
  }

  console.log("\n✨ All auctions created successfully!");
  console.log("📝 Update NFTPlaza/src/config/contracts.ts with these addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
