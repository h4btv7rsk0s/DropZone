/**
 * Test Utilities
 * Helper functions for testing
 */

import { vi } from 'vitest';

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockRecipient = (index: number) => ({
  address: `0x${index.toString().padStart(40, '0')}` as `0x${string}`,
  amount: BigInt(100 + index),
});

export const createMockRecipients = (count: number) => {
  return Array.from({ length: count }, (_, i) => createMockRecipient(i));
};

export const createRandomAddress = (): `0x${string}` => {
  const randomHex = Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `0x${randomHex}`;
};

export const createRandomHash = (): `0x${string}` => {
  const randomHex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `0x${randomHex}`;
};

export const createMockTransactionReceipt = (status: 'success' | 'reverted' = 'success') => ({
  blockHash: createRandomHash(),
  blockNumber: BigInt(Math.floor(Math.random() * 1000000)),
  contractAddress: null,
  cumulativeGasUsed: BigInt(100000),
  effectiveGasPrice: BigInt(20000000000),
  from: createRandomAddress(),
  gasUsed: BigInt(80000),
  logs: [],
  logsBloom: '0x',
  status,
  to: createRandomAddress(),
  transactionHash: createRandomHash(),
  transactionIndex: 0,
  type: 'eip1559' as const,
});

export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};

export const createMockFormData = () => ({
  recipients: [
    {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      amount: '1000',
    },
    {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      amount: '2000',
    },
  ],
});

export const validateAddress = (address: string): boolean => {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

export const validateHexString = (hex: string): boolean => {
  return /^0x[0-9a-fA-F]*$/.test(hex);
};

export const validateBigInt = (value: any): boolean => {
  return typeof value === 'bigint';
};

export const createMockContractCall = <T>(returnValue: T) => {
  return vi.fn().mockResolvedValue(returnValue);
};

export const createMockContractWriteCall = (hash?: string) => {
  return vi.fn().mockResolvedValue({
    hash: hash || createRandomHash(),
    wait: vi.fn().mockResolvedValue(createMockTransactionReceipt()),
  });
};

export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    await sleep(interval);
  }
  return false;
};

export const expectToThrowAsync = async (
  fn: () => Promise<any>,
  errorMessage?: string
) => {
  let error: Error | null = null;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error('Expected function to throw an error, but it did not');
  }

  if (errorMessage && !error.message.includes(errorMessage)) {
    throw new Error(
      `Expected error message to include "${errorMessage}", but got "${error.message}"`
    );
  }

  return error;
};

export const generateMockAirdropData = (recipientCount: number = 5) => {
  return {
    airdropId: BigInt(1),
    owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`,
    recipients: createMockRecipients(recipientCount),
    totalAmount: BigInt(recipientCount * 100),
    frozen: false,
  };
};

export const mockConsoleLog = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();

  return {
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
    getLogs: () => (console.log as any).mock.calls,
    getErrors: () => (console.error as any).mock.calls,
    getWarns: () => (console.warn as any).mock.calls,
  };
};

export const createMockStorageItem = <T>(key: string, initialValue: T) => {
  let value = initialValue;

  return {
    get: vi.fn(() => value),
    set: vi.fn((newValue: T) => {
      value = newValue;
    }),
    clear: vi.fn(() => {
      value = initialValue;
    }),
  };
};

export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  return endTime - startTime;
};

export const createBatchData = (size: number) => {
  const addresses = Array.from({ length: size }, () => createRandomAddress());
  const amounts = Array.from({ length: size }, (_, i) => BigInt(100 + i));
  const encryptedAmounts = Array.from({ length: size }, () => createRandomHash());
  const proofs = Array.from({ length: size }, () => createRandomHash());

  return {
    addresses,
    amounts,
    encryptedAmounts,
    proofs,
  };
};

export const assertArraysEqual = <T>(arr1: T[], arr2: T[], message?: string) => {
  if (arr1.length !== arr2.length) {
    throw new Error(
      message ||
        `Arrays have different lengths: ${arr1.length} vs ${arr2.length}`
    );
  }

  arr1.forEach((item, index) => {
    if (item !== arr2[index]) {
      throw new Error(
        message ||
          `Arrays differ at index ${index}: ${item} vs ${arr2[index]}`
      );
    }
  });
};

export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

export const TEST_CONSTANTS = {
  SEPOLIA_CHAIN_ID: 11155111,
  MAX_UINT64: BigInt('18446744073709551615'),
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  DEFAULT_GAS_LIMIT: BigInt(3000000),
  TEST_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  TEST_ADDRESSES: {
    OWNER: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`,
    USER1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
    USER2: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as `0x${string}`,
    USER3: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' as `0x${string}`,
  },
  ETHERSCAN_BASE_URL: 'https://sepolia.etherscan.io',
};
