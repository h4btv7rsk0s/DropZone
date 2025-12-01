// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Mystery Airdrop — Confidential Allowlist & Claim with FHEVM
contract ConfAirdrop is ZamaEthereumConfig {
    address public owner;
    bool public frozen;

    mapping(address => euint64) private _allocation;
    mapping(address => euint64) private _claimed;

    event AllocationSet(address indexed user);
    event AllocationBatchSet(uint256 count);
    event Claimed(address indexed user);
    event Frozen();

    error NotOwner();
    error FrozenAirdrop();
    error InvalidUser();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function freeze() external onlyOwner {
        frozen = true;
        emit Frozen();
    }

    function setAllocation(
        address user,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external onlyOwner {
        if (frozen) revert FrozenAirdrop();
        if (user == address(0)) revert InvalidUser();

        euint64 amt = FHE.fromExternal(encryptedAmt, inputProof);
        _allocation[user] = FHE.add(_allocation[user], amt);

        FHE.allowThis(_allocation[user]);
        FHE.allow(_allocation[user], user);

        emit AllocationSet(user);
    }

    function batchSetAllocation(
        address[] calldata users,
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external onlyOwner {
        if (frozen) revert FrozenAirdrop();

        euint64 amt = FHE.fromExternal(encryptedAmt, inputProof);
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (user == address(0)) revert InvalidUser();

            _allocation[user] = FHE.add(_allocation[user], amt);
            FHE.allowThis(_allocation[user]);
            FHE.allow(_allocation[user], user);
        }
        emit AllocationBatchSet(users.length);
    }

    function claim(
        externalEuint64 encryptedAmt,
        bytes calldata inputProof
    ) external {
        address user = msg.sender;

        euint64 req = FHE.fromExternal(encryptedAmt, inputProof);
        euint64 remaining = FHE.sub(_allocation[user], _claimed[user]);
        euint64 toClaim = FHE.select(FHE.le(req, remaining), req, FHE.asEuint64(0));

        _claimed[user] = FHE.add(_claimed[user], toClaim);

        FHE.allowThis(_claimed[user]);
        FHE.allow(_claimed[user], user);
        FHE.allowThis(_allocation[user]);
        FHE.allow(_allocation[user], user);

        emit Claimed(user);
    }

    function getMyAllocation() external returns (euint64) {
        return _allocation[msg.sender];
    }

    function getMyClaimed() external returns (euint64) {
        return _claimed[msg.sender];
    }

    function getMyRemaining() external returns (euint64) {
        return FHE.sub(_allocation[msg.sender], _claimed[msg.sender]);
    }
}
