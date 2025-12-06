const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("AirdropFactory - Basic Functionality Tests", function () {
  let contract;
  let owner, creator1, creator2, user1, user2, user3;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, creator1, creator2, user1, user2, user3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AirdropFactory");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
  });

  it("should deploy contract successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
    console.log("✅ Contract deployed at:", await contract.getAddress());
  });

  it("should have correct initial values", async function () {
    const airdropCount = await contract.airdropCount();
    const protocolId = await contract.protocolId();

    expect(airdropCount).to.equal(0);
    expect(protocolId).to.equal(1);
    console.log("✅ Initial values correct");
  });

  it("should create a basic airdrop", async function () {
    const tx = await contract.connect(creator1).createAirdrop(
      "Test Airdrop",
      "This is a test airdrop"
    );
    const receipt = await tx.wait();

    // Check airdrop count
    const airdropCount = await contract.airdropCount();
    expect(airdropCount).to.equal(1);

    // Check airdrop details
    const airdrop = await contract.airdrops(1);
    expect(airdrop.creator).to.equal(creator1.address);
    expect(airdrop.name).to.equal("Test Airdrop");
    expect(airdrop.description).to.equal("This is a test airdrop");
    expect(airdrop.active).to.equal(true);

    console.log("✅ Basic airdrop created successfully");
  });

  it("should emit AirdropCreated event", async function () {
    const tx = await contract.connect(creator1).createAirdrop(
      "Event Test",
      "Testing event emission"
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === 'AirdropCreated';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    const decodedEvent = contract.interface.parseLog(event);
    expect(decodedEvent.args.creator).to.equal(creator1.address);
    expect(decodedEvent.args.name).to.equal("Event Test");

    console.log("✅ AirdropCreated event emitted correctly");
  });

  it("should track airdrops by creator", async function () {
    // Creator1 creates 2 airdrops
    await contract.connect(creator1).createAirdrop("Airdrop 1", "First");
    await contract.connect(creator1).createAirdrop("Airdrop 2", "Second");

    // Creator2 creates 1 airdrop
    await contract.connect(creator2).createAirdrop("Airdrop 3", "Third");

    const creator1Airdrops = await contract.getAirdropsByCreator(creator1.address);
    const creator2Airdrops = await contract.getAirdropsByCreator(creator2.address);

    expect(creator1Airdrops.length).to.equal(2);
    expect(creator2Airdrops.length).to.equal(1);
    expect(creator1Airdrops[0]).to.equal(1);
    expect(creator1Airdrops[1]).to.equal(2);
    expect(creator2Airdrops[0]).to.equal(3);

    console.log("✅ Airdrop tracking by creator works");
  });

  it("should get all airdrop IDs", async function () {
    await contract.connect(creator1).createAirdrop("Airdrop 1", "First");
    await contract.connect(creator2).createAirdrop("Airdrop 2", "Second");
    await contract.connect(creator1).createAirdrop("Airdrop 3", "Third");

    const allIds = await contract.getAllAirdropIds();
    expect(allIds.length).to.equal(3);
    expect(allIds[0]).to.equal(1);
    expect(allIds[1]).to.equal(2);
    expect(allIds[2]).to.equal(3);

    console.log("✅ getAllAirdropIds works correctly");
  });

  it("should deactivate airdrop by creator", async function () {
    await contract.connect(creator1).createAirdrop("Test", "Description");

    // Deactivate
    await contract.connect(creator1).deactivateAirdrop(1);

    const airdrop = await contract.airdrops(1);
    expect(airdrop.active).to.equal(false);

    console.log("✅ Airdrop deactivation works");
  });

  it("should emit AirdropDeactivated event", async function () {
    await contract.connect(creator1).createAirdrop("Test", "Description");

    const tx = await contract.connect(creator1).deactivateAirdrop(1);
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === 'AirdropDeactivated';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    console.log("✅ AirdropDeactivated event emitted correctly");
  });

  it("should revert when non-creator tries to deactivate", async function () {
    await contract.connect(creator1).createAirdrop("Test", "Description");

    await expect(
      contract.connect(creator2).deactivateAirdrop(1)
    ).to.be.revertedWithCustomError(contract, "NotCreator");

    console.log("✅ NotCreator error works correctly");
  });

  it("should revert for invalid airdrop ID", async function () {
    await expect(
      contract.connect(creator1).deactivateAirdrop(999)
    ).to.be.revertedWithCustomError(contract, "InvalidAirdrop");

    await expect(
      contract.connect(creator1).deactivateAirdrop(0)
    ).to.be.revertedWithCustomError(contract, "InvalidAirdrop");

    console.log("✅ InvalidAirdrop error works correctly");
  });

  it("should handle multiple airdrops sequentially", async function () {
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      await contract.connect(creator1).createAirdrop(
        `Airdrop ${i + 1}`,
        `Description ${i + 1}`
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const count = await contract.airdropCount();
    expect(count).to.equal(5);
    expect(duration).to.be.lessThan(10000);

    console.log(`✅ Sequential airdrop creation completed in ${duration}ms`);
  });
});
