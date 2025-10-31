// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Airdrop Factory - Anyone can create confidential airdrops
contract AirdropFactory is SepoliaConfig {
    struct Airdrop {
        address creator;
        string name;
        string description;
        uint256 createdAt;
        bool active;
    }

    struct Allocation {
        euint64 total;
        euint64 claimed;
    }

    uint256 public airdropCount;
    mapping(uint256 => Airdrop) public airdrops;
    mapping(uint256 => mapping(address => Allocation)) private allocations;

    event AirdropCreated(uint256 indexed airdropId, address indexed creator, string name);
    event AllocationSet(uint256 indexed airdropId, address indexed user);
    event AllocationBatchSet(uint256 indexed airdropId, uint256 count);
    event Claimed(uint256 indexed airdropId, address indexed user);
    event AirdropDeactivated(uint256 indexed airdropId);

    error InvalidAirdrop();
    error NotCreator();
    error AirdropInactive();
    error InvalidUser();

    /// @notice Create a new airdrop campaign
    function createAirdrop(
        string calldata name,
        string calldata description
    ) external returns (uint256) {
        uint256 airdropId = airdropCount++;

        airdrops[airdropId] = Airdrop({
            creator: msg.sender,
            name: name,
            description: description,
            createdAt: block.timestamp,
            active: true
        });

        emit AirdropCreated(airdropId, msg.sender, name);
        return airdropId;
    }

    /// @notice Create airdrop with initial allocations in one transaction
    function createAirdropWithAllocations(
        string calldata name,
        string calldata description,
        address[] calldata users,
        externalEuint64[] calldata encryptedAmts,
        bytes[] calldata inputProofs
    ) external returns (uint256) {
        require(users.length == encryptedAmts.length, "Length mismatch");
        require(users.length == inputProofs.length, "Length mismatch");

        uint256 airdropId = airdropCount++;

        airdrops[airdropId] = Airdrop({
            creator: msg.sender,
            name: name,
            description: description,
            createdAt: block.timestamp,
            active: true
        });

        // Set allocations for all users
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (user == address(0)) revert InvalidUser();

            euint64 amt = FHE.fromExternal(encryptedAmts[i], inputProofs[i]);
            Allocation storage alloc = allocations[airdropId][user];

            alloc.total = FHE.add(alloc.total, amt);
            FHE.allowThis(alloc.total);
            FHE.allow(alloc.total, user);

            emit AllocationSet(airdropId, user);
        }

        emit AirdropCreated(airdropId, msg.sender, name);
        return airdropId;
    }

    /// @notice Set allocation for a single user (creator only)
    function setAllocation(
        uint256 airdropId,
        address user,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external {
        Airdrop storage airdrop = airdrops[airdropId];
        if (airdrop.creator == address(0)) revert InvalidAirdrop();
        if (msg.sender != airdrop.creator) revert NotCreator();
        if (!airdrop.active) revert AirdropInactive();
        if (user == address(0)) revert InvalidUser();

        euint64 amt = FHE.fromExternal(encryptedAmt, inputProof);
        Allocation storage alloc = allocations[airdropId][user];

        alloc.total = FHE.add(alloc.total, amt);

        FHE.allowThis(alloc.total);
        FHE.allow(alloc.total, user);

        emit AllocationSet(airdropId, user);
    }

    /// @notice Set same allocation for multiple users (creator only)
    function batchSetAllocation(
        uint256 airdropId,
        address[] calldata users,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external {
        Airdrop storage airdrop = airdrops[airdropId];
        if (airdrop.creator == address(0)) revert InvalidAirdrop();
        if (msg.sender != airdrop.creator) revert NotCreator();
        if (!airdrop.active) revert AirdropInactive();

        euint64 amt = FHE.fromExternal(encryptedAmt, inputProof);

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (user == address(0)) revert InvalidUser();

            Allocation storage alloc = allocations[airdropId][user];
            alloc.total = FHE.add(alloc.total, amt);

            FHE.allowThis(alloc.total);
            FHE.allow(alloc.total, user);
        }

        emit AllocationBatchSet(airdropId, users.length);
    }

    /// @notice Claim tokens from an airdrop
    function claim(
        uint256 airdropId,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external {
        Airdrop storage airdrop = airdrops[airdropId];
        if (airdrop.creator == address(0)) revert InvalidAirdrop();

        address user = msg.sender;
        Allocation storage alloc = allocations[airdropId][user];

        euint64 req = FHE.fromExternal(encryptedAmt, inputProof);
        euint64 remaining = FHE.sub(alloc.total, alloc.claimed);
        euint64 toClaim = FHE.select(FHE.le(req, remaining), req, FHE.asEuint64(0));

        alloc.claimed = FHE.add(alloc.claimed, toClaim);

        FHE.allowThis(alloc.claimed);
        FHE.allow(alloc.claimed, user);
        FHE.allowThis(alloc.total);
        FHE.allow(alloc.total, user);

        emit Claimed(airdropId, user);
    }

    /// @notice Deactivate an airdrop (creator only, prevents new allocations)
    function deactivateAirdrop(uint256 airdropId) external {
        Airdrop storage airdrop = airdrops[airdropId];
        if (airdrop.creator == address(0)) revert InvalidAirdrop();
        if (msg.sender != airdrop.creator) revert NotCreator();

        airdrop.active = false;
        emit AirdropDeactivated(airdropId);
    }

    /// @notice Get user's allocation (encrypted)
    function getMyAllocation(uint256 airdropId) external view returns (euint64) {
        return allocations[airdropId][msg.sender].total;
    }

    /// @notice Get user's claimed amount (encrypted)
    function getMyClaimed(uint256 airdropId) external view returns (euint64) {
        return allocations[airdropId][msg.sender].claimed;
    }

    /// @notice Get user's remaining amount (encrypted)
    function getMyRemaining(uint256 airdropId) external returns (euint64) {
        Allocation storage alloc = allocations[airdropId][msg.sender];
        return FHE.sub(alloc.total, alloc.claimed);
    }

    /// @notice Get all airdrop IDs (for frontend enumeration)
    function getAllAirdropIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](airdropCount);
        for (uint256 i = 0; i < airdropCount; i++) {
            ids[i] = i;
        }
        return ids;
    }

    /// @notice Get airdrops created by a specific address
    function getAirdropsByCreator(address creator) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < airdropCount; i++) {
            if (airdrops[i].creator == creator) {
                count++;
            }
        }

        uint256[] memory ids = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < airdropCount; i++) {
            if (airdrops[i].creator == creator) {
                ids[index++] = i;
            }
        }
        return ids;
    }
}
