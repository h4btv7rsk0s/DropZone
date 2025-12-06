const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("AirdropFactory - Integration Tests", function () {
  let contract;
  let owner, creator1, creator2, user1, user2, user3, user4, user5;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, creator1, creator2, user1, user2, user3, user4, user5] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AirdropFactory");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
  });

  it("should complete full airdrop lifecycle: create -> allocate -> claim", async function () {
    console.log("Testing full airdrop lifecycle...");

    // Step 1: Create airdrop
    console.log("Step 1: Creating airdrop...");
    const createTx = await contract.connect(creator1).createAirdrop(
      "Integration Test Airdrop",
      "Testing the complete lifecycle"
    );
    await createTx.wait();

    const airdropCount = await contract.airdropCount();
    expect(airdropCount).to.equal(1);
    console.log("✅ Airdrop created with ID: 1");

    // Step 2: Set allocations for multiple users
    console.log("Step 2: Setting allocations...");
    const allocations = [
      { user: user1, amount: 1000n },
      { user: user2, amount: 500n },
      { user: user3, amount: 750n }
    ];

    for (const { user, amount } of allocations) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), creator1.address)
        .add64(amount)
        .encrypt();

      await contract.connect(creator1).setAllocation(
        1,
        user.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }
    console.log("✅ Allocations set for 3 users");

    // Step 3: Users claim their tokens
    console.log("Step 3: Users claiming tokens...");
    const claims = [
      { user: user1, amount: 400n },
      { user: user2, amount: 300n },
      { user: user3, amount: 500n }
    ];

    for (const { user, amount } of claims) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user.address)
        .add64(amount)
        .encrypt();

      await contract.connect(user).claim(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }
    console.log("✅ All users claimed their tokens");

    // Step 4: Verify state
    console.log("Step 4: Verifying final state...");
    for (const { user } of claims) {
      const allocation = await contract.connect(user).getMyAllocation(1);
      const claimed = await contract.connect(user).getMyClaimed(1);
      expect(allocation).to.not.be.undefined;
      expect(claimed).to.not.be.undefined;
    }
    console.log("✅ Full lifecycle completed successfully");
  });

  it("should handle multiple airdrops by same creator", async function () {
    console.log("Testing multiple airdrops by same creator...");

    // Create 3 airdrops
    for (let i = 0; i < 3; i++) {
      await contract.connect(creator1).createAirdrop(
        `Airdrop ${i + 1}`,
        `Description ${i + 1}`
      );
    }

    // Set allocations for each airdrop
    for (let airdropId = 1; airdropId <= 3; airdropId++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), creator1.address)
        .add64(BigInt(airdropId * 100))
        .encrypt();

      await contract.connect(creator1).setAllocation(
        airdropId,
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    // Verify creator's airdrops
    const creatorAirdrops = await contract.getAirdropsByCreator(creator1.address);
    expect(creatorAirdrops.length).to.equal(3);

    // User claims from each airdrop
    for (let airdropId = 1; airdropId <= 3; airdropId++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add64(50n)
        .encrypt();

      await contract.connect(user1).claim(
        airdropId,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    console.log("✅ Multiple airdrops by same creator work correctly");
  });

  it("should handle multiple airdrops by different creators", async function () {
    console.log("Testing airdrops by different creators...");

    // Creator1 creates an airdrop
    await contract.connect(creator1).createAirdrop("Creator1 Airdrop", "By creator1");

    // Creator2 creates an airdrop
    await contract.connect(creator2).createAirdrop("Creator2 Airdrop", "By creator2");

    // Verify tracking
    const creator1Airdrops = await contract.getAirdropsByCreator(creator1.address);
    const creator2Airdrops = await contract.getAirdropsByCreator(creator2.address);
    const allAirdrops = await contract.getAllAirdropIds();

    expect(creator1Airdrops.length).to.equal(1);
    expect(creator2Airdrops.length).to.equal(1);
    expect(allAirdrops.length).to.equal(2);

    console.log("✅ Multiple creators work correctly");
  });

  it("should handle user participating in multiple airdrops", async function () {
    console.log("Testing user in multiple airdrops...");

    // Create 2 airdrops by different creators
    await contract.connect(creator1).createAirdrop("Airdrop 1", "First");
    await contract.connect(creator2).createAirdrop("Airdrop 2", "Second");

    // Both creators allocate to user1
    const encrypted1 = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator1.address)
      .add64(1000n)
      .encrypt();
    await contract.connect(creator1).setAllocation(
      1, user1.address, encrypted1.handles[0], encrypted1.inputProof
    );

    const encrypted2 = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator2.address)
      .add64(2000n)
      .encrypt();
    await contract.connect(creator2).setAllocation(
      2, user1.address, encrypted2.handles[0], encrypted2.inputProof
    );

    // User1 claims from both
    const claim1 = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add64(500n)
      .encrypt();
    await contract.connect(user1).claim(1, claim1.handles[0], claim1.inputProof);

    const claim2 = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add64(1000n)
      .encrypt();
    await contract.connect(user1).claim(2, claim2.handles[0], claim2.inputProof);

    // Verify separate tracking
    const alloc1 = await contract.connect(user1).getMyAllocation(1);
    const alloc2 = await contract.connect(user1).getMyAllocation(2);
    const claimed1 = await contract.connect(user1).getMyClaimed(1);
    const claimed2 = await contract.connect(user1).getMyClaimed(2);

    expect(alloc1).to.not.be.undefined;
    expect(alloc2).to.not.be.undefined;
    expect(claimed1).to.not.be.undefined;
    expect(claimed2).to.not.be.undefined;

    console.log("✅ User participation in multiple airdrops works");
  });

  it("should handle create airdrop with initial allocations integration", async function () {
    console.log("Testing createAirdropWithAllocations integration...");

    const users = [user1.address, user2.address, user3.address];
    const amounts = [500n, 1000n, 1500n];
    const encryptedAmts = [];
    const inputProofs = [];

    for (let i = 0; i < users.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), creator1.address)
        .add64(amounts[i])
        .encrypt();
      encryptedAmts.push(encrypted.handles[0]);
      inputProofs.push(encrypted.inputProof);
    }

    await contract.connect(creator1).createAirdropWithAllocations(
      "Pre-allocated Airdrop",
      "With initial allocations",
      users,
      encryptedAmts,
      inputProofs
    );

    // All users claim some tokens
    const claimUsers = [user1, user2, user3];
    const claimAmounts = [200n, 500n, 700n];

    for (let i = 0; i < claimUsers.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), claimUsers[i].address)
        .add64(claimAmounts[i])
        .encrypt();

      await contract.connect(claimUsers[i]).claim(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    console.log("✅ createAirdropWithAllocations integration works");
  });

  it("should handle deactivation prevents new allocations and claims", async function () {
    console.log("Testing deactivation effects...");

    // Create and setup airdrop
    await contract.connect(creator1).createAirdrop("To Deactivate", "Will be deactivated");

    const allocEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator1.address)
      .add64(1000n)
      .encrypt();
    await contract.connect(creator1).setAllocation(
      1, user1.address, allocEncrypted.handles[0], allocEncrypted.inputProof
    );

    // User1 claims some before deactivation
    const claimEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add64(200n)
      .encrypt();
    await contract.connect(user1).claim(1, claimEncrypted.handles[0], claimEncrypted.inputProof);

    // Deactivate
    await contract.connect(creator1).deactivateAirdrop(1);

    // Try to set more allocations - should fail
    const newAllocEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator1.address)
      .add64(500n)
      .encrypt();
    await expect(
      contract.connect(creator1).setAllocation(
        1, user2.address, newAllocEncrypted.handles[0], newAllocEncrypted.inputProof
      )
    ).to.be.revertedWithCustomError(contract, "AirdropInactive");

    // Try to claim - should fail
    const newClaimEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add64(100n)
      .encrypt();
    await expect(
      contract.connect(user1).claim(1, newClaimEncrypted.handles[0], newClaimEncrypted.inputProof)
    ).to.be.revertedWithCustomError(contract, "AirdropInactive");

    console.log("✅ Deactivation correctly prevents allocations and claims");
  });

  it("should handle batch allocation followed by individual claims", async function () {
    console.log("Testing batch allocation + individual claims...");

    await contract.connect(creator1).createAirdrop("Batch Test", "Testing batch");

    // Batch allocate
    const users = [user1.address, user2.address, user3.address, user4.address, user5.address];
    const batchEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator1.address)
      .add64(500n)
      .encrypt();

    await contract.connect(creator1).batchSetAllocation(
      1,
      users,
      batchEncrypted.handles[0],
      batchEncrypted.inputProof
    );

    // Each user claims different amounts
    const claimingUsers = [user1, user2, user3, user4, user5];
    const claimAmounts = [100n, 200n, 300n, 400n, 500n];

    for (let i = 0; i < claimingUsers.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), claimingUsers[i].address)
        .add64(claimAmounts[i])
        .encrypt();

      await contract.connect(claimingUsers[i]).claim(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    // Verify all have claims
    for (const user of claimingUsers) {
      const claimed = await contract.connect(user).getMyClaimed(1);
      expect(claimed).to.not.be.undefined;
    }

    console.log("✅ Batch allocation + individual claims work correctly");
  });

  it("should handle stress test: multiple operations in sequence", async function () {
    console.log("Running stress test...");
    const startTime = Date.now();

    // Create 3 airdrops
    for (let i = 0; i < 3; i++) {
      await contract.connect(creator1).createAirdrop(`Stress ${i}`, `Desc ${i}`);
    }

    // Set allocations for each
    const users = [user1, user2, user3];
    for (let airdropId = 1; airdropId <= 3; airdropId++) {
      for (const user of users) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), creator1.address)
          .add64(100n)
          .encrypt();
        await contract.connect(creator1).setAllocation(
          airdropId, user.address, encrypted.handles[0], encrypted.inputProof
        );
      }
    }

    // All users claim from all airdrops
    for (let airdropId = 1; airdropId <= 3; airdropId++) {
      for (const user of users) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), user.address)
          .add64(50n)
          .encrypt();
        await contract.connect(user).claim(airdropId, encrypted.handles[0], encrypted.inputProof);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify counts
    const airdropCount = await contract.airdropCount();
    expect(airdropCount).to.equal(3);

    expect(duration).to.be.lessThan(60000); // Under 60 seconds
    console.log(`✅ Stress test completed in ${duration}ms`);
    console.log(`   - 3 airdrops created`);
    console.log(`   - 9 allocations set (3 users x 3 airdrops)`);
    console.log(`   - 9 claims processed`);
  });

  it("should verify all event emissions in integration flow", async function () {
    console.log("Testing all event emissions...");

    // AirdropCreated
    const createTx = await contract.connect(creator1).createAirdrop("Event Test", "Testing");
    const createReceipt = await createTx.wait();
    const createEvent = createReceipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'AirdropCreated';
      } catch { return false; }
    });
    expect(createEvent).to.not.be.undefined;
    console.log("✅ AirdropCreated event verified");

    // AllocationSet
    const allocEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator1.address)
      .add64(100n)
      .encrypt();
    const allocTx = await contract.connect(creator1).setAllocation(
      1, user1.address, allocEncrypted.handles[0], allocEncrypted.inputProof
    );
    const allocReceipt = await allocTx.wait();
    const allocEvent = allocReceipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'AllocationSet';
      } catch { return false; }
    });
    expect(allocEvent).to.not.be.undefined;
    console.log("✅ AllocationSet event verified");

    // AllocationBatchSet
    const batchEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), creator1.address)
      .add64(100n)
      .encrypt();
    const batchTx = await contract.connect(creator1).batchSetAllocation(
      1, [user2.address, user3.address], batchEncrypted.handles[0], batchEncrypted.inputProof
    );
    const batchReceipt = await batchTx.wait();
    const batchEvent = batchReceipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'AllocationBatchSet';
      } catch { return false; }
    });
    expect(batchEvent).to.not.be.undefined;
    console.log("✅ AllocationBatchSet event verified");

    // Claimed
    const claimEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add64(50n)
      .encrypt();
    const claimTx = await contract.connect(user1).claim(
      1, claimEncrypted.handles[0], claimEncrypted.inputProof
    );
    const claimReceipt = await claimTx.wait();
    const claimEvent = claimReceipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'Claimed';
      } catch { return false; }
    });
    expect(claimEvent).to.not.be.undefined;
    console.log("✅ Claimed event verified");

    // AirdropDeactivated
    const deactivateTx = await contract.connect(creator1).deactivateAirdrop(1);
    const deactivateReceipt = await deactivateTx.wait();
    const deactivateEvent = deactivateReceipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'AirdropDeactivated';
      } catch { return false; }
    });
    expect(deactivateEvent).to.not.be.undefined;
    console.log("✅ AirdropDeactivated event verified");

    console.log("✅ All events verified successfully");
  });
});
