# ConfAirdrop - Privacy-Preserving Airdrop Platform

![ConfAirdrop Banner](https://img.shields.io/badge/FHE-Powered-blue) ![Zama](https://img.shields.io/badge/Zama-fhEVM-green) ![Sepolia](https://img.shields.io/badge/Network-Sepolia-orange) ![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)

**Live Demo**: [https://confairdrop.vercel.app](https://confairdrop.vercel.app)

## 🎬 Demo Video

**📥 [Download Demo Video](./demo.mp4)** - Click to download and watch a complete demonstration of ConfAirdrop's features!

The demo showcases:
- Creating FHE-encrypted airdrops with multiple recipients
- Setting up confidential allocation amounts
- Claiming tokens while preserving privacy
- Real-time transaction confirmations on Sepolia testnet

---

## 📖 What is ConfAirdrop?

**ConfAirdrop** (Confidential Airdrop) is a revolutionary token distribution platform that leverages **Fully Homomorphic Encryption (FHE)** to protect sensitive allocation data while maintaining complete transparency and verifiability on-chain. Built with **Zama's fhEVM v0.5** technology, ConfAirdrop ensures that token distribution amounts remain encrypted throughout the entire lifecycle—from creation to claiming.

### Why ConfAirdrop?

Traditional airdrops expose all allocation amounts publicly on-chain, leading to:
- ❌ Privacy leakage for recipients
- ❌ Potential gaming of the distribution
- ❌ Market manipulation based on leaked data
- ❌ Loss of competitive advantage for projects

**ConfAirdrop solves these problems** by keeping allocation amounts encrypted at all times:
- ✅ **Privacy**: Amounts stay confidential on-chain
- ✅ **Security**: FHE enables computation on encrypted data
- ✅ **Fairness**: No information leakage before claims
- ✅ **Transparency**: Verifiable proofs ensure correctness

---

## 🌟 Key Features

### 🔐 Privacy-First Architecture

- **Fully Encrypted Allocations**
  - All airdrop amounts encrypted using Zama FHE before on-chain storage
  - Stored as `euint64` encrypted integers in smart contracts
  - Zero knowledge of amounts except by authorized parties

- **Confidential Claims**
  - Users submit encrypted claim amounts with cryptographic proofs
  - Smart contract validates claims using homomorphic operations
  - No decryption needed during validation process

- **Zero-Knowledge Proofs**
  - Cryptographic proofs ensure validity without exposing data
  - Recipient can prove claim eligibility without revealing amount
  - Complete privacy preservation throughout claiming

### 🚀 User-Friendly Experience

- **One-Click Multi-Recipient Airdrop**
  - Create airdrops for multiple recipients in a single transaction
  - Batch allocation setting to reduce gas costs
  - Intuitive interface for managing distributions

- **Seamless Wallet Integration**
  - RainbowKit integration with MetaMask, WalletConnect, Coinbase Wallet
  - One-click wallet connection
  - Automatic network switching to Sepolia testnet

- **Real-Time Transaction Feedback**
  - Instant transaction confirmations
  - Direct Etherscan links for all transactions
  - Toast notifications with detailed status updates

### 🏗️ Decentralized & Trustless

- **No Central Authority**
  - All operations executed via immutable smart contracts
  - Owner permissions limited to allocation management
  - Contract can be frozen to prevent modifications

- **Immutable Blockchain Records**
  - Complete audit trail on Ethereum Sepolia
  - Transparent event logs for all operations
  - Verifiable on-chain history

- **Permissionless Access**
  - Anyone can create or claim airdrops
  - No KYC or registration required
  - Open-source and auditable code

---

## 🧠 How It Works

### Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────────┐
│   Frontend      │─────▶│  Zama SDK v0.2   │─────▶│ ConfAirdrop.sol   │
│  (React + Vite) │      │  (FHE Operations)│      │  (Sepolia)        │
│  + Wagmi/Viem   │◀─────│                  │◀─────│                   │
└─────────────────┘      └──────────────────┘      └───────────────────┘
       │                          │                          │
       │                          ▼                          │
       │                 ┌─────────────────┐                │
       └────────────────▶│  KMS Gateway    │◀───────────────┘
                         │  (Key Mgmt)     │
                         └─────────────────┘
```

### Core Components

1. **Frontend** - React + TypeScript + Vite
   - User interface for airdrop management
   - Client-side FHE encryption via Zama SDK
   - Web3 wallet integration with Wagmi v2

2. **Zama FHE SDK** - v0.2.0
   - Handles all encryption operations
   - Generates cryptographic proofs
   - Manages public key infrastructure

3. **Smart Contract** - ConfAirdrop.sol
   - Stores encrypted allocations on-chain
   - Validates encrypted claims
   - Executes homomorphic operations

4. **KMS Gateway** - Key Management Service
   - Manages distributed key generation
   - Provides public parameters
   - No single point of key exposure

### FHE Encryption Flow

#### 1. Airdrop Creation

```
Owner Input: Recipients + Amounts
      ↓
[Client-Side Encryption]
  - For each recipient: encrypt(amount) → euint64
  - Generate cryptographic proof
  - Bundle: (address[], euint64[], proof[])
      ↓
[Smart Contract]
  - Store encrypted amounts on-chain
  - Emit AirdropCreated event
  - Track total recipients
```

#### 2. Claiming Process

```
User Input: Claim Amount (e.g., 500 tokens)
      ↓
[Client-Side Encryption]
  - encrypt(500) → euint64 encrypted_claim
  - Generate proof of encryption
      ↓
[Smart Contract Validation]
  - Load encrypted allocation: alloc.total, alloc.claimed
  - Calculate remaining: FHE.sub(alloc.total, alloc.claimed)
  - Homomorphic comparison: FHE.le(encrypted_claim, remaining)
  - If valid: FHE.add(alloc.claimed, encrypted_claim)
      ↓
[Result]
  - User receives tokens
  - Allocation updated (still encrypted!)
  - Emit Claimed event
```

### Smart Contract Logic

```solidity
// Simplified ConfAirdrop.sol logic
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

contract ConfAirdrop {
    struct Allocation {
        euint64 total;     // Encrypted total allocation
        euint64 claimed;   // Encrypted claimed amount
    }

    mapping(uint256 => mapping(address => Allocation)) public allocations;

    // Create airdrop with encrypted amounts
    function createAirdrop(
        address[] calldata recipients,
        bytes32[] calldata encryptedAmounts,
        bytes[] calldata proofs
    ) external onlyOwner {
        uint256 airdropId = nextAirdropId++;

        for (uint256 i = 0; i < recipients.length; i++) {
            euint64 amount = TFHE.asEuint64(encryptedAmounts[i], proofs[i]);
            allocations[airdropId][recipients[i]] = Allocation({
                total: amount,
                claimed: TFHE.asEuint64(0)
            });
        }

        emit AirdropCreated(airdropId, recipients.length);
    }

    // Claim tokens with encrypted amount
    function claim(
        uint256 airdropId,
        bytes32 encryptedAmt,
        bytes calldata proof
    ) external {
        euint64 amt = TFHE.asEuint64(encryptedAmt, proof);
        Allocation storage alloc = allocations[airdropId][msg.sender];

        // Homomorphic operations - no decryption!
        euint64 remaining = TFHE.sub(alloc.total, alloc.claimed);
        ebool canClaim = TFHE.le(amt, remaining);
        TFHE.req(canClaim); // Revert if false

        alloc.claimed = TFHE.add(alloc.claimed, amt);
        emit Claimed(airdropId, msg.sender, encryptedAmt);
    }
}
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library

### Web3 Integration
- **Wagmi v2** - React Hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **RainbowKit** - Wallet connection UI
- **Zama Relayer SDK v0.2.0** - FHE operations

### Smart Contracts
- **Solidity ^0.8.24** - Smart contract language
- **Zama fhEVM v0.5** - FHE-enabled EVM
- **Hardhat** - Development environment
- **Ethers.js v6** - Contract interactions

### Deployment
- **Vercel** - Frontend hosting
- **Ethereum Sepolia** - Test network
- **GitHub** - Version control

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/h4btv7rsk0s/DropZone.git
cd DropZone

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Contract address (deployed on Sepolia)
VITE_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Private key for deployment (keep secret!)
PRIVATE_KEY=your_private_key_here
```

### Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Deploy Smart Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
SEPOLIA_RPC_URL="your_rpc_url" npx hardhat run scripts/deploy.js --network sepolia
```

---

## 📱 Usage Guide

### For Airdrop Creators

1. **Connect Wallet**
   - Click "Connect Wallet" in the header
   - Select your preferred wallet (MetaMask, WalletConnect, etc.)
   - Switch to Sepolia network if prompted

2. **Create Airdrop**
   - Navigate to "Create Airdrop" tab
   - Add recipient addresses and amounts
   - Click "Create Airdrop" and confirm transaction
   - Wait for confirmation (~15 seconds on Sepolia)

3. **Manage Allocations**
   - Go to "Manage" tab
   - View existing airdrops
   - Set or update allocations for new recipients
   - Freeze contract when distribution is complete

### For Recipients

1. **Connect Wallet**
   - Connect with the address that has an allocation
   - System will automatically detect your eligibility

2. **View Allocation**
   - Navigate to "Claim" tab
   - Enter airdrop ID to view your allocation
   - See available balance (encrypted on-chain)

3. **Claim Tokens**
   - Enter amount to claim (integer only, max: 18446744073709551615)
   - Click "Claim" and confirm transaction
   - Receive tokens directly to your wallet

---

## 🔒 Security Features

### FHE Encryption
- **euint64 Type**: All amounts stored as 64-bit encrypted unsigned integers
- **Probabilistic Encryption**: Same value encrypted differently each time
- **Homomorphic Operations**: Computation on encrypted data without decryption
- **Zero-Knowledge Proofs**: Validate claims without revealing amounts

### Access Control
- **Owner-Only Functions**: Airdrop creation, allocation setting, contract freezing
- **User Functions**: Claiming, viewing allocations
- **Freeze Mechanism**: Permanently prevent allocation modifications

### Input Validation
- **Amount Limits**: Max value 18446744073709551615 (2^64 - 1)
- **Address Validation**: Checksummed Ethereum addresses only
- **Proof Verification**: Cryptographic proof required for all encrypted operations
- **Double-Claim Prevention**: Track claimed amounts to prevent over-claiming

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Completed - Q3 2025)
- ✅ Core FHE encryption integration
- ✅ Basic airdrop creation and claiming
- ✅ Wallet integration (MetaMask, WalletConnect)
- ✅ Sepolia testnet deployment
- ✅ UI/UX with shadcn/ui components
- ✅ Real-time transaction notifications
- ✅ Comprehensive test suite (160+ tests)

### Phase 2: Enhanced Distribution 🚧 (Q4 2025 - Current)
- 🔄 **Batch Address Import** (CSV/JSON support for 1000+ addresses)
- 🔄 **Advanced Allocation Management** (Edit, remove allocations)
- 🔄 **Multi-Airdrop Dashboard** (Manage multiple campaigns)
- 📅 **Merkle Tree Allowlisting** (Gas-efficient large-scale distributions)
- 📅 **Gas Optimization** (Target: 40% reduction in claim costs)

### Phase 3: Token Ecosystem 🔮 (Q1-Q2 2026)
- 📅 **ERC20 Token Support** (Distribute any ERC20 token)
- 📅 **Native ETH Integration** (Direct ETH airdrops)
- 📅 **Vesting Schedules** (Linear and cliff vesting)
- 📅 **Claim Windows** (Time-bound claiming with auto-refund)

### Phase 4: NFT & SBT 🎨 (Q3 2026)
- 📅 **ERC721 NFT Airdrops** (Encrypted NFT metadata)
- 📅 **ERC5192 Soulbound Tokens** (Non-transferable token distribution)
- 📅 **Conditional Claims** (Requirement-based claiming)
- 📅 **Batch NFT Minting** (Gas-efficient NFT distribution)

### Phase 5: Enterprise Features 🏢 (Q4 2026)
- 📅 **Whitelist API Management** (REST API for allowlist)
- 📅 **Analytics Dashboard** (Real-time distribution metrics)
- 📅 **Multi-Sig Team Collaboration** (Gnosis Safe integration)
- 📅 **Custom Branding** (White-label solution)

### Phase 6: Advanced Privacy & Scale 🌌 (2027+)
- 📅 **Anonymous Claiming** (Privacy pools for recipients)
- 📅 **Cross-Chain Support** (Polygon zkEVM, Arbitrum, Base)
- 📅 **Mainnet Launch** (Production deployment on Ethereum L1)
- 📅 **L2 Integration** (Optimism, Base, Arbitrum)
- 📅 **DAO Governance** (Community-driven development)
- 📅 **Mobile Apps** (iOS and Android native apps)

### 🎯 2025-2026 Priority Goals

**Q4 2025** (Current Quarter)
1. ✅ Launch comprehensive test suite
2. 🔄 Implement CSV batch import (target: 5,000 addresses per upload)
3. 🔄 Add allocation editing capabilities
4. 📅 Create multi-airdrop management dashboard

**Q1 2026**
1. 📅 Integrate ERC20 token support (10+ popular tokens)
2. 📅 Implement vesting schedules (linear + cliff)
3. 📅 Begin security audit preparation

**Q2 2026**
1. 📅 Complete third-party security audit
2. 📅 Launch NFT airdrop beta
3. 📅 Optimize gas costs to <50k per claim

**Q3 2026**
1. 📅 Add Soulbound Token (SBT) support
2. 📅 Prepare for mainnet deployment
3. 📅 Launch marketing campaign

---

## 🧪 Testing

ConfAirdrop includes a comprehensive test suite with 160+ test cases covering all critical functionality.

### Test Coverage

- **FHE Encryption Tests** (~35 tests)
  - SDK initialization and caching
  - Amount encryption (zero, small, large, max uint64)
  - Probabilistic encryption verification
  - Error handling and validation

- **Smart Contract Tests** (~40 tests)
  - ABI validation and function signatures
  - Read/write operations
  - Event parsing and structure
  - Gas estimation and optimization

- **Utility Function Tests** (~50 tests)
  - Address validation and checksumming
  - BigInt operations and conversions
  - Hex string handling
  - Array/string manipulations

- **Integration Tests** (~35 tests)
  - Complete airdrop creation flow
  - End-to-end claiming workflow
  - Batch allocation operations
  - Error recovery scenarios

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

See [test/README.md](./test/README.md) for detailed testing documentation.

---

## 📊 Use Cases

### 1. **Token Launches**
Project launches can distribute tokens fairly while keeping individual allocations private, preventing whale hunting and market manipulation.

### 2. **Community Rewards**
DAOs can reward active members with encrypted amounts, maintaining privacy and preventing jealousy within the community.

### 3. **Investor Distributions**
Private sale investors receive allocations without exposing investment amounts to competitors or the public.

### 4. **Employee Compensation**
Companies distribute token-based compensation privately, respecting employee privacy.

### 5. **Bug Bounty Rewards**
Security researchers receive encrypted reward amounts, protecting both parties' privacy.

### 6. **Grant Programs**
Foundations distribute grants with confidential amounts, reducing social comparison effects.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Write tests for new features
- Maintain 85%+ test coverage
- Use conventional commit messages
- Document public APIs

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live Demo**: [https://confairdrop.vercel.app](https://confairdrop.vercel.app)
- **GitHub**: [https://github.com/h4btv7rsk0s/DropZone](https://github.com/h4btv7rsk0s/DropZone)
- **Zama Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **fhEVM GitHub**: [https://github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/h4btv7rsk0s/DropZone/issues)
- **Twitter**: [@ZamaFHE](https://twitter.com/ZamaFHE)
- **Discord**: [Zama Community](https://discord.gg/zama)
- **Documentation**: [Zama Docs](https://docs.zama.ai/)

---

## 🙏 Acknowledgments

- **Zama Team** - For developing fhEVM and FHE technology
- **Ethereum Foundation** - For Sepolia testnet infrastructure
- **shadcn** - For the beautiful UI component library
- **Open Source Community** - For countless tools and libraries

---

## ⚠️ Disclaimer

**This is experimental software deployed on Sepolia testnet.**

- ⚠️ NOT audited for production use
- ⚠️ NOT deployed on Ethereum mainnet
- ⚠️ Use testnet tokens only
- ⚠️ No warranty or guarantees provided

Do not use with real assets or in production environments without proper security audits.

---

<div align="center">

**Built with ❤️ using Zama FHE Technology**

⭐ Star us on GitHub if you find ConfAirdrop useful!

[Live Demo](https://confairdrop.vercel.app) • [Documentation](https://docs.zama.ai/) • [Report Bug](https://github.com/h4btv7rsk0s/DropZone/issues)

</div>
