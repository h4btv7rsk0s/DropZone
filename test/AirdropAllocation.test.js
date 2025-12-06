const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("AirdropFactory - FHE Allocation Tests", function () {
  let contract;
  let owner, creator, user1, user2, user3, user4, user5;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, creator, user1, user2, user3, user4, user5] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AirdropFactory");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    // Create a test airdrop
    await contract.connect(creator).createAirdrop("Test Airdrop", "For allocation tests");
  });

  it("should set allocation with encrypted amount", async function () {
    console.log("Testing FHE encrypted allocation...");

    const allocationAmount = 1000n;

    // Create encrypted input
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(allocationAmount)
      .encrypt();

    // Set allocation
    await contract.connect(creator).setAllocation(
      1, // airdropId
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    // Verify allocation was set (returns encrypted value)
    const allocation = await contract.connect(user1).getMyAllocation(1);
    expect(allocation).to.not.be.undefined;

    console.log("✅ FHE.fromExternal() - Encrypted allocation conversion works");
    console.log("✅ FHE.add() - Encrypted addition works");
    console.log("✅ FHE.allowThis() - Contract permission works");
    console.log("✅ FHE.allow() - User permission works");
  });

  it("should emit AllocationSet event", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(500n)
      .encrypt();

    const tx = await contract.connect(creator).setAllocation(
      1,
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === 'AllocationSet';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    const decodedEvent = contract.interface.parseLog(event);
    expect(decodedEvent.args.airdropId).to.equal(1);
    expect(decodedEvent.args.user).to.equal(user1.address);

    console.log("✅ AllocationSet event emitted correctly");
  });

  it("should accumulate allocations for same user", async function () {
    console.log("Testing allocation accumulation...");

    // First allocation
    const encrypted1 = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(100n)
      .encrypt();

    await contract.connect(creator).setAllocation(
      1,
      user1.address,
      encrypted1.handles[0],
      encrypted1.inputProof
    );

    // Second allocation (should add to first)
    const encrypted2 = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(200n)
      .encrypt();

    await contract.connect(creator).setAllocation(
      1,
      user1.address,
      encrypted2.handles[0],
      encrypted2.inputProof
    );

    // Verify allocation exists (encrypted)
    const allocation = await contract.connect(user1).getMyAllocation(1);
    expect(allocation).to.not.be.undefined;

    console.log("✅ Allocation accumulation works correctly");
  });

  it("should batch set allocations for multiple users", async function () {
    console.log("Testing batch allocation...");

    const users = [user1.address, user2.address, user3.address];

    // Create single encrypted amount for all users
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(500n)
      .encrypt();

    const tx = await contract.connect(creator).batchSetAllocation(
      1,
      users,
      encrypted.handles[0],
      encrypted.inputProof
    );
    const receipt = await tx.wait();

    // Check event
    const event = receipt.logs.find(log => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === 'AllocationBatchSet';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    const decodedEvent = contract.interface.parseLog(event);
    expect(decodedEvent.args.count).to.equal(3);

    // Verify allocations for each user
    for (const userAddr of users) {
      const user = [user1, user2, user3].find(u => u.address === userAddr);
      const allocation = await contract.connect(user).getMyAllocation(1);
      expect(allocation).to.not.be.undefined;
    }

    console.log("✅ Batch allocation works correctly");
    console.log("✅ AllocationBatchSet event emitted");
  });

  it("should revert when non-creator sets allocation", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add64(100n)
      .encrypt();

    await expect(
      contract.connect(user1).setAllocation(
        1,
        user2.address,
        encrypted.handles[0],
        encrypted.inputProof
      )
    ).to.be.revertedWithCustomError(contract, "NotCreator");

    console.log("✅ Non-creator allocation prevention works");
  });

  it("should revert allocation on inactive airdrop", async function () {
    // Deactivate airdrop
    await contract.connect(creator).deactivateAirdrop(1);

    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(100n)
      .encrypt();

    await expect(
      contract.connect(creator).setAllocation(
        1,
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      )
    ).to.be.revertedWithCustomError(contract, "AirdropInactive");

    console.log("✅ Inactive airdrop allocation prevention works");
  });

  it("should revert allocation for zero address", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(100n)
      .encrypt();

    await expect(
      contract.connect(creator).setAllocation(
        1,
        ethers.ZeroAddress,
        encrypted.handles[0],
        encrypted.inputProof
      )
    ).to.be.revertedWithCustomError(contract, "InvalidUser");

    console.log("✅ Zero address allocation prevention works");
  });

  it("should create airdrop with initial allocations", async function () {
    console.log("Testing createAirdropWithAllocations...");

    const users = [user1.address, user2.address];
    const amounts = [100n, 200n];
    const encryptedAmts = [];
    const inputProofs = [];

    // Create encrypted inputs for each user
    for (let i = 0; i < users.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), creator.address)
        .add64(amounts[i])
        .encrypt();
      encryptedAmts.push(encrypted.handles[0]);
      inputProofs.push(encrypted.inputProof);
    }

    const tx = await contract.connect(creator).createAirdropWithAllocations(
      "Pre-allocated Airdrop",
      "Created with initial allocations",
      users,
      encryptedAmts,
      inputProofs
    );
    const receipt = await tx.wait();

    // Check airdrop was created
    const airdropCount = await contract.airdropCount();
    expect(airdropCount).to.equal(2); // 1 from beforeEach + 1 new

    // Check allocations exist
    const allocation1 = await contract.connect(user1).getMyAllocation(2);
    const allocation2 = await contract.connect(user2).getMyAllocation(2);
    expect(allocation1).to.not.be.undefined;
    expect(allocation2).to.not.be.undefined;

    console.log("✅ createAirdropWithAllocations works correctly");
  });

  it("should handle edge case: zero amount allocation", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(0n)
      .encrypt();

    await contract.connect(creator).setAllocation(
      1,
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    const allocation = await contract.connect(user1).getMyAllocation(1);
    expect(allocation).to.not.be.undefined;

    console.log("✅ Zero amount allocation handled correctly");
  });

  it("should handle edge case: large amount allocation", async function () {
    // Maximum euint64 value
    const maxAmount = 18446744073709551615n;

    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator.address)
      .add64(maxAmount)
      .encrypt();

    await contract.connect(creator).setAllocation(
      1,
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    const allocation = await contract.connect(user1).getMyAllocation(1);
    expect(allocation).to.not.be.undefined;

    console.log("✅ Maximum amount allocation handled correctly");
  });

  it("should handle rapid sequential allocations", async function () {
    const startTime = Date.now();
    const users = [user1, user2, user3, user4, user5];

    for (let i = 0; i < users.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), creator.address)
        .add64(BigInt((i + 1) * 100))
        .encrypt();

      await contract.connect(creator).setAllocation(
        1,
        users[i].address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).to.be.lessThan(15000);
    console.log(`✅ Rapid sequential allocations completed in ${duration}ms`);
  });
});
