// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title AirdropFactory — Multi-Airdrop Management with FHE Privacy
contract AirdropFactory is ZamaEthereumConfig {
    struct Airdrop {
        address creator;
        string name;
        string description;
        uint256 createdAt;
        bool active;
    }

    uint256 public airdropCount;
    mapping(uint256 => Airdrop) public airdrops;
    mapping(uint256 => mapping(address => euint64)) private _allocations;
    mapping(uint256 => mapping(address => euint64)) private _claimed;
    mapping(address => uint256[]) private _creatorAirdrops;
    uint256[] private _allAirdropIds;

    event AirdropCreated(uint256 indexed airdropId, address indexed creator, string name);
    event AirdropDeactivated(uint256 indexed airdropId);
    event AllocationSet(uint256 indexed airdropId, address indexed user);
    event AllocationBatchSet(uint256 indexed airdropId, uint256 count);
    event Claimed(uint256 indexed airdropId, address indexed user);

    error NotCreator();
    error AirdropInactive();
    error InvalidAirdrop();
    error InvalidUser();

    function protocolId() external pure returns (uint256) {
        return 1;
    }

    function createAirdrop(
        string calldata name,
        string calldata description
    ) external returns (uint256) {
        uint256 airdropId = ++airdropCount;

        airdrops[airdropId] = Airdrop({
            creator: msg.sender,
            name: name,
            description: description,
            createdAt: block.timestamp,
            active: true
        });

        _creatorAirdrops[msg.sender].push(airdropId);
        _allAirdropIds.push(airdropId);

        emit AirdropCreated(airdropId, msg.sender, name);
        return airdropId;
    }

    function createAirdropWithAllocations(
        string calldata name,
        string calldata description,
        address[] calldata users,
        externalEuint64[] calldata encryptedAmts,
        bytes[] calldata inputProofs
    ) external returns (uint256) {
        uint256 airdropId = ++airdropCount;

        airdrops[airdropId] = Airdrop({
            creator: msg.sender,
            name: name,
            description: description,
            createdAt: block.timestamp,
            active: true
        });

        _creatorAirdrops[msg.sender].push(airdropId);
        _allAirdropIds.push(airdropId);

        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == address(0)) revert InvalidUser();

            euint64 amt = FHE.fromExternal(encryptedAmts[i], inputProofs[i]);
            _allocations[airdropId][users[i]] = FHE.add(_allocations[airdropId][users[i]], amt);

            FHE.allowThis(_allocations[airdropId][users[i]]);
            FHE.allow(_allocations[airdropId][users[i]], users[i]);
        }

        emit AirdropCreated(airdropId, msg.sender, name);
        return airdropId;
    }

    function deactivateAirdrop(uint256 airdropId) external {
        if (airdropId == 0 || airdropId > airdropCount) revert InvalidAirdrop();
        if (airdrops[airdropId].creator != msg.sender) revert NotCreator();

        airdrops[airdropId].active = false;
        emit AirdropDeactivated(airdropId);
    }

    function setAllocation(
        uint256 airdropId,
        address user,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external {
        if (airdropId == 0 || airdropId > airdropCount) revert InvalidAirdrop();
        if (airdrops[airdropId].creator != msg.sender) revert NotCreator();
        if (!airdrops[airdropId].active) revert AirdropInactive();
        if (user == address(0)) revert InvalidUser();

        euint64 amt = FHE.fromExternal(encryptedAmt, inputProof);
        _allocations[airdropId][user] = FHE.add(_allocations[airdropId][user], amt);

        FHE.allowThis(_allocations[airdropId][user]);
        FHE.allow(_allocations[airdropId][user], user);

        emit AllocationSet(airdropId, user);
    }

    function batchSetAllocation(
        uint256 airdropId,
        address[] calldata users,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external {
        if (airdropId == 0 || airdropId > airdropCount) revert InvalidAirdrop();
        if (airdrops[airdropId].creator != msg.sender) revert NotCreator();
        if (!airdrops[airdropId].active) revert AirdropInactive();

        euint64 amt = FHE.fromExternal(encryptedAmt, inputProof);

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (user == address(0)) revert InvalidUser();

            _allocations[airdropId][user] = FHE.add(_allocations[airdropId][user], amt);
            FHE.allowThis(_allocations[airdropId][user]);
            FHE.allow(_allocations[airdropId][user], user);
        }

        emit AllocationBatchSet(airdropId, users.length);
    }

    function claim(
        uint256 airdropId,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external {
        if (airdropId == 0 || airdropId > airdropCount) revert InvalidAirdrop();
        if (!airdrops[airdropId].active) revert AirdropInactive();

        address user = msg.sender;
        euint64 req = FHE.fromExternal(encryptedAmt, inputProof);
        euint64 remaining = FHE.sub(_allocations[airdropId][user], _claimed[airdropId][user]);
        euint64 toClaim = FHE.select(FHE.le(req, remaining), req, FHE.asEuint64(0));

        _claimed[airdropId][user] = FHE.add(_claimed[airdropId][user], toClaim);

        FHE.allowThis(_claimed[airdropId][user]);
        FHE.allow(_claimed[airdropId][user], user);
        FHE.allowThis(_allocations[airdropId][user]);
        FHE.allow(_allocations[airdropId][user], user);

        emit Claimed(airdropId, user);
    }

    function getMyAllocation(uint256 airdropId) external view returns (euint64) {
        return _allocations[airdropId][msg.sender];
    }

    function getMyClaimed(uint256 airdropId) external view returns (euint64) {
        return _claimed[airdropId][msg.sender];
    }

    function getMyRemaining(uint256 airdropId) external returns (euint64) {
        return FHE.sub(_allocations[airdropId][msg.sender], _claimed[airdropId][msg.sender]);
    }

    function getAirdropsByCreator(address creator) external view returns (uint256[] memory) {
        return _creatorAirdrops[creator];
    }

    function getAllAirdropIds() external view returns (uint256[] memory) {
        return _allAirdropIds;
    }
}
