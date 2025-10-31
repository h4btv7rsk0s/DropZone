# DropZone Testing Suite

Comprehensive unit and integration tests for the DropZone privacy-preserving airdrop platform.

## 📁 Test Structure

```
test/
├── fhe.test.ts                     # FHE encryption tests
├── contract-interactions.test.ts   # Smart contract interaction tests
├── utils.test.ts                   # Utility function tests
├── integration.test.ts             # End-to-end integration tests
├── setup.ts                        # Test environment setup
├── vitest.config.ts               # Vitest configuration
├── helpers/
│   └── test-utils.ts              # Testing utility functions
└── mocks/
    ├── fhe.mock.ts                # FHE SDK mocks
    └── wagmi.mock.ts              # Wagmi/Web3 mocks
```

## 🚀 Running Tests

### Prerequisites

Install test dependencies (if not already installed):

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Run All Tests

```bash
npm run test
```

or

```bash
npx vitest
```

### Run Tests in Watch Mode

```bash
npx vitest --watch
```

### Run Tests with Coverage

```bash
npx vitest --coverage
```

### Run Specific Test File

```bash
npx vitest fhe.test.ts
npx vitest contract-interactions.test.ts
npx vitest utils.test.ts
npx vitest integration.test.ts
```

### Run Tests with UI

```bash
npx vitest --ui
```

## 📝 Test Files Overview

### 1. fhe.test.ts

Tests for FHE encryption functionality using Zama SDK.

**Coverage:**
- ✅ FHE instance initialization
- ✅ Amount encryption (0, small, large, max uint64)
- ✅ Probabilistic encryption verification
- ✅ Address validation and checksumming
- ✅ Error handling for invalid inputs
- ✅ Performance benchmarks
- ✅ Batch encryption operations

**Example:**
```typescript
describe('encryptAmount', () => {
  it('should encrypt valid BigInt amount', async () => {
    const amount = BigInt(1000);
    const result = await encryptAmount(amount, testAddress, userAddress);
    expect(result.encryptedAmount).toMatch(/^0x[0-9a-fA-F]+$/);
  });
});
```

### 2. contract-interactions.test.ts

Tests for smart contract ABI and interaction patterns.

**Coverage:**
- ✅ Function signature validation
- ✅ Event parsing and structure
- ✅ Read function calls (owner, frozen status, allocations)
- ✅ Write function parameter validation
- ✅ Transaction simulation
- ✅ Gas estimation
- ✅ Error handling (contract not found, invalid calls)
- ✅ Batch operations validation
- ✅ Access control verification

**Example:**
```typescript
describe('Contract ABI', () => {
  it('should have correct function signatures', () => {
    const sig = 'createAirdrop(address[],bytes32[],bytes[])';
    expect(() => parseAbiItem(`function ${sig}`)).not.toThrow();
  });
});
```

### 3. utils.test.ts

Tests for utility functions and common operations.

**Coverage:**
- ✅ Address validation and checksumming
- ✅ BigInt operations and comparisons
- ✅ Hex string validation
- ✅ Array operations (filter, map, reduce)
- ✅ String operations (trim, lowercase, split)
- ✅ Type guards and validation
- ✅ URL construction (Etherscan links)
- ✅ Date/time operations
- ✅ JSON parsing/stringification
- ✅ Math operations (percentages, rounding)

**Example:**
```typescript
describe('Address Validation', () => {
  it('should validate correct Ethereum addresses', () => {
    expect(isAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(true);
  });
});
```

### 4. integration.test.ts

End-to-end workflow tests simulating real user interactions.

**Coverage:**
- ✅ Complete airdrop creation flow
- ✅ Claim flow with encryption
- ✅ Batch allocation setting
- ✅ Error recovery scenarios
- ✅ Data validation across workflows
- ✅ Performance benchmarks
- ✅ State management
- ✅ Security checks
- ✅ Contract interaction simulation
- ✅ Edge cases (zero amounts, max values, large batches)

**Example:**
```typescript
describe('Complete Airdrop Flow', () => {
  it('should handle full airdrop creation flow', async () => {
    const fhe = await initializeFHE();
    const recipients = createMockRecipients(3);
    const encryptedData = await Promise.all(
      recipients.map(r => encryptAmount(r.amount, CONTRACT_ADDRESS, OWNER))
    );
    expect(encryptedData).toHaveLength(3);
  });
});
```

## 🛠️ Test Utilities

### helpers/test-utils.ts

Provides reusable testing utilities:

- `createMockRecipient()` - Generate mock recipient data
- `createMockRecipients(count)` - Generate multiple recipients
- `createRandomAddress()` - Generate random Ethereum address
- `createRandomHash()` - Generate random transaction hash
- `createMockTransactionReceipt()` - Mock transaction receipt
- `waitForCondition()` - Wait for async condition
- `expectToThrowAsync()` - Assert async function throws
- `measureExecutionTime()` - Performance measurement
- `TEST_CONSTANTS` - Common test constants

**Example:**
```typescript
import { createMockRecipients, TEST_CONSTANTS } from './helpers/test-utils';

const recipients = createMockRecipients(5);
const maxUint64 = TEST_CONSTANTS.MAX_UINT64;
```

### mocks/fhe.mock.ts

Mocks for Zama FHE SDK:

- `createMockFHEInstance()` - Mock FHE instance
- `setupFHEMocks()` - Setup all FHE mocks
- `mockEncryptAmount()` - Mock encryption function
- `createMockAllocation()` - Mock allocation data
- `mockContractEvents` - Mock contract event data

### mocks/wagmi.mock.ts

Mocks for wagmi/Web3 hooks:

- `mockAccount` - Mock connected wallet
- `mockChain` - Mock Sepolia testnet
- `createMockUseAccount()` - Mock useAccount hook
- `createMockUseContractRead()` - Mock contract read
- `createMockUseContractWrite()` - Mock contract write
- `setupWagmiMocks()` - Setup all wagmi mocks

## 📊 Test Coverage Goals

| Area | Target | Current |
|------|--------|---------|
| FHE Encryption | 90%+ | ✅ |
| Contract Interactions | 85%+ | ✅ |
| Utilities | 95%+ | ✅ |
| Integration Flows | 80%+ | ✅ |
| Overall | 85%+ | 🎯 |

## 🎯 Test Categories

### Unit Tests
- Individual function testing
- Input/output validation
- Error handling
- Edge cases

### Integration Tests
- Multi-step workflows
- Component interactions
- State management
- Error recovery

### Performance Tests
- Encryption speed
- Batch operation efficiency
- Memory usage
- Async operation timing

### Security Tests
- Access control validation
- Input sanitization
- Overflow prevention
- Probabilistic encryption verification

## 🐛 Debugging Tests

### View Detailed Output

```bash
npx vitest --reporter=verbose
```

### Debug Specific Test

```bash
npx vitest --reporter=verbose fhe.test.ts -t "should encrypt valid BigInt amount"
```

### Enable Console Logs

Modify `test/setup.ts` to remove console suppression:

```typescript
// Comment out these lines
// console.warn = (...args) => { ... };
// console.error = (...args) => { ... };
```

## 📝 Writing New Tests

### Template for New Test File

```typescript
/**
 * Feature Tests
 * Description of what this test file covers
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Specific Functionality', () => {
    it('should do something expected', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **Use descriptive test names** - Clearly state what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test one thing per test** - Keep tests focused
4. **Use test utilities** - Reuse helper functions
5. **Mock external dependencies** - Isolate what you're testing
6. **Test edge cases** - Zero, max, negative, invalid inputs
7. **Add comments for complex logic** - Explain why, not what

## 🔧 Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npx vitest --run
      - run: npx vitest --coverage
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Zama FHE Documentation](https://docs.zama.ai/)
- [Viem Testing Guide](https://viem.sh/docs/getting-started.html)

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain 85%+ coverage
4. Update this README if adding new test files
5. Document any new test utilities

## 📞 Support

For issues with tests:
1. Check test output for specific errors
2. Verify dependencies are installed
3. Ensure Node.js version >= 20
4. Review mock setup in `test/setup.ts`
5. Open an issue with test failure details
