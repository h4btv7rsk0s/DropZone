# DropZone - Privacy-Preserving Airdrop Platform

![DropZone Banner](https://img.shields.io/badge/FHE-Powered-blue) ![Zama](https://img.shields.io/badge/Zama-fhEVM-green) ![Sepolia](https://img.shields.io/badge/Network-Sepolia-orange)

**Live Demo**: [https://fhe-dropzone.vercel.app](https://fhe-dropzone.vercel.app)

DropZone is a revolutionary airdrop platform that leverages Fully Homomorphic Encryption (FHE) to protect sensitive allocation data while maintaining complete transparency and verifiability on-chain. Built with Zama's fhEVM technology, DropZone ensures that token distribution amounts remain confidential until claimed by recipients.

---

## 🌟 Key Features

### 🔐 Privacy-First Architecture
- **Encrypted Allocations**: All airdrop amounts are encrypted using FHE before being stored on-chain
- **Confidential Claims**: Users can claim their tokens without revealing amounts to third parties
- **Zero-Knowledge Proofs**: Cryptographic proofs ensure validity without exposing sensitive data

### 🚀 User-Friendly Experience
- **One-Click Airdrop Creation**: Launch airdrops with multiple recipients in a single transaction
- **Wallet Integration**: Seamless connection with MetaMask, OKX Wallet, and Coinbase Wallet
- **Real-Time Updates**: Instant transaction confirmations with Etherscan links

### 🏗️ Decentralized & Trustless
- **No Central Authority**: All operations are executed via smart contracts on Ethereum Sepolia
- **Immutable Records**: Blockchain-based audit trail for complete transparency
- **Permissionless Access**: Anyone can create or participate in airdrops

---

## 🧠 How It Works

### Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Frontend  │─────▶│  Zama SDK    │─────▶│  Smart Contract │
│  (React +   │      │  (FHE Ops)   │      │   (Sepolia)     │
│   Vite)     │◀─────│              │◀─────│                 │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │                       │
       │                     ▼                       │
       │            ┌──────────────┐                │
       └───────────▶│ KMS Gateway  │◀───────────────┘
                    │  (Key Mgmt)  │
                    └──────────────┘
```

### FHE Encryption Flow

1. **Client-Side Encryption**
   - User inputs allocation amount (e.g., 1000 tokens)
   - Zama SDK encrypts the value using FHE
   - Generates cryptographic proof of validity

2. **On-Chain Storage**
   - Encrypted amount stored as `euint64` type
   - Public key infrastructure managed by Zama's KMS Gateway
   - Recipient address stored in plaintext for accessibility

3. **Claiming Process**
   - User submits encrypted claim amount
   - Smart contract validates claim against encrypted allocation
   - Homomorphic operations performed without decryption
   - Tokens transferred if validation succeeds

### Smart Contract Logic

```solidity
// Simplified example
struct Allocation {
    euint64 total;     // Encrypted total allocation
    euint64 claimed;   // Encrypted claimed amount
}

function claim(uint256 airdropId, externalEuint64 encryptedAmt, bytes calldata proof) external {
    euint64 amt = FHE.fromExternal(encryptedAmt, proof);
    Allocation storage alloc = allocations[airdropId][msg.sender];

    // Homomorphic comparison (no decryption needed!)
    ebool canClaim = FHE.le(amt, FHE.sub(alloc.total, alloc.claimed));
    FHE.req(canClaim);

    alloc.claimed = FHE.add(alloc.claimed, amt);
    emit Claimed(airdropId, msg.sender);
}
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Wagmi v2** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library

### Blockchain
- **Zama fhEVM** - Fully Homomorphic Encryption for EVM
- **Solidity 0.8.24** - Smart contract language
- **Hardhat** - Development environment
- **Ethereum Sepolia** - Testnet deployment

### Encryption
- **Zama Relayer SDK v0.2.0** - FHE operations
- **TFHE-rs** - Underlying cryptographic library
- **KMS Gateway** - Distributed key management

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([faucet](https://sepoliafaucet.com/))

### Local Development

```bash
# Clone the repository
git clone https://github.com/h4btv7rsk0s/DropZone.git
cd DropZone

# Install dependencies
yarn install

# Start development server
yarn dev
```

The application will be available at `http://localhost:8080`

### Smart Contract Deployment

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/deploy.js --network sepolia
```

---

## 🎯 Use Cases

### 1. **Token Launches**
Distribute tokens to early supporters without revealing individual allocation amounts, preventing market manipulation.

### 2. **Community Rewards**
Reward contributors based on confidential metrics (e.g., trading volume, governance participation).

### 3. **Employee Compensation**
Private token grants for team members with verifiable on-chain records.

### 4. **Privacy-Focused DAOs**
Confidential treasury distributions while maintaining auditability.

---

## 🗺️ Roadmap

### Phase 1: Core Features ✅ (Current)
- [x] Basic airdrop creation with manual allocation
- [x] FHE-encrypted amount storage
- [x] Single token claim functionality
- [x] Wallet integration (MetaMask, OKX, Coinbase)
- [x] Sepolia testnet deployment

### Phase 2: Enhanced Functionality 🚧 (Q2 2024)
- [ ] **Batch Address Import** - CSV/Excel upload for large-scale distributions
- [ ] **Multi-Token Support** - ERC20 token airdrops with custom contracts
- [ ] **Vesting Schedules** - Time-locked releases with cliff periods
- [ ] **Claim Windows** - Set start/end timestamps for campaigns

### Phase 3: NFT & SBT Integration 🔮 (Q3 2024)
- [ ] **NFT Airdrops** - Distribute ERC721 tokens with hidden metadata
- [ ] **Soulbound Token (SBT)** - Non-transferable achievement badges
- [ ] **Conditional Claims** - Proof-of-ownership requirements
- [ ] **Merkle Tree Optimization** - Gas-efficient large-scale drops

### Phase 4: Advanced Privacy 🌌 (Q4 2024)
- [ ] **Anonymous Claiming** - Relay network for transaction privacy
- [ ] **Cross-Chain Support** - Polygon, Arbitrum, Optimism
- [ ] **Governance Module** - Community-controlled treasury
- [ ] **Analytics Dashboard** - Encrypted metrics for campaign owners

---

## 🔒 Security Considerations

### Encryption Security
- **Post-Quantum Resistant**: TFHE provides security against quantum attacks
- **Threshold Decryption**: No single point of failure in key management
- **Client-Side Encryption**: Private keys never leave user's browser

### Smart Contract Audits
- ⚠️ **Not Audited Yet**: This is experimental software
- Recommend independent security review before mainnet deployment
- Test thoroughly on Sepolia testnet

### Best Practices
1. Always verify contract addresses on Etherscan
2. Start with small test amounts
3. Double-check recipient addresses before creating airdrops
4. Keep private keys secure (use hardware wallets for large amounts)

---

## 📊 Contract Details

### Sepolia Deployment
- **Network**: Ethereum Sepolia Testnet
- **Chain ID**: 11155111
- **AirdropFactory**: `0x[CONTRACT_ADDRESS]`
- **Zama Gateway**: `0x33347831500F1e73f102414fAc3e9e5e7F111123`

### Gas Optimization
- Creating airdrop: ~200,000 gas
- Setting allocation: ~100,000 gas
- Claiming tokens: ~80,000 gas

---

## 🤝 Contributing

We welcome contributions from the community! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed
- Test on Sepolia before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Zama** - For pioneering FHE technology and fhEVM
- **Ethereum Foundation** - For Sepolia testnet infrastructure
- **shadcn/ui** - For beautiful UI components
- **Wagmi** - For excellent React hooks

---

## 📞 Support & Community

- **Documentation**: [Zama Docs](https://docs.zama.ai/)
- **Issues**: [GitHub Issues](https://github.com/h4btv7rsk0s/DropZone/issues)
- **Discussions**: [GitHub Discussions](https://github.com/h4btv7rsk0s/DropZone/discussions)

---

## ⚡ Quick Start Guide

### For Airdrop Creators

1. **Connect Wallet** - Click "Connect Wallet" and select your provider
2. **Create Airdrop** - Navigate to "Create Airdrop" page
3. **Add Recipients** - Input recipient addresses and allocation amounts
4. **Deploy** - Click "Create Airdrop" and confirm transaction
5. **Share** - Send airdrop ID to recipients

### For Recipients

1. **Connect Wallet** - Use the same wallet address that received allocation
2. **View Allocation** - Navigate to "Claim" page and enter airdrop ID
3. **Submit Claim** - Enter amount to claim (must be ≤ remaining allocation)
4. **Confirm Transaction** - Approve the transaction in your wallet
5. **Receive Tokens** - Tokens will appear in your wallet after confirmation

---

**Built with ❤️ using Zama FHE Technology**
