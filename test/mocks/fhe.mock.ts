/**
 * FHE SDK Mock Utilities
 * Mock implementations for Zama FHE SDK
 */

import { vi } from 'vitest';

export const createMockFHEInstance = () => ({
  createEncryptedInput: vi.fn().mockReturnValue({
    add64: vi.fn().mockReturnThis(),
    encrypt: vi.fn().mockResolvedValue({
      handles: [new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])],
      inputProof: new Uint8Array([9, 10, 11, 12, 13, 14, 15, 16]),
    }),
  }),
  generateKeypair: vi.fn().mockResolvedValue({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
  }),
  getPublicKey: vi.fn().mockResolvedValue('mock-public-key'),
  getPublicParams: vi.fn().mockResolvedValue({
    publicKey: 'mock-public-key',
    params: {},
  }),
  createEIP712: vi.fn().mockReturnValue({
    domain: {},
    types: {},
    message: {},
  }),
  publicDecrypt: vi.fn().mockResolvedValue(BigInt(1000)),
  userDecrypt: vi.fn().mockResolvedValue(BigInt(1000)),
});

export const mockEncryptedAmount = '0x0102030405060708' as `0x${string}`;
export const mockProof = '0x090a0b0c0d0e0f10' as `0x${string}`;

export const createMockEncryptResult = () => ({
  encryptedAmount: mockEncryptedAmount,
  proof: mockProof,
});

export const setupFHEMocks = () => {
  const mockSDK = {
    init: vi.fn().mockResolvedValue(createMockFHEInstance()),
  };

  // Mock window.relayerSDK
  (global as any).window = {
    ...global.window,
    relayerSDK: mockSDK,
  };

  return {
    sdk: mockSDK,
    instance: createMockFHEInstance(),
    encryptResult: createMockEncryptResult(),
  };
};

export const mockInitializeFHE = vi.fn().mockResolvedValue(createMockFHEInstance());

export const mockEncryptAmount = vi
  .fn()
  .mockResolvedValue(createMockEncryptResult());

export const createMockAllocation = () => ({
  total: '0x1234567890abcdef' as `0x${string}`,
  claimed: '0x0000000000000000' as `0x${string}`,
});

export const createMockAirdrop = (id: number) => ({
  id: BigInt(id),
  owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`,
  recipientCount: BigInt(5),
  frozen: false,
  allocations: new Map([
    ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', createMockAllocation()],
    ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', createMockAllocation()],
  ]),
});

export const mockContractEvents = {
  AirdropCreated: {
    airdropId: BigInt(1),
    recipientCount: BigInt(5),
  },
  AllocationSet: {
    airdropId: BigInt(1),
    user: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
    amount: mockEncryptedAmount,
  },
  Claimed: {
    airdropId: BigInt(1),
    user: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
    amount: mockEncryptedAmount,
  },
  ContractFrozen: {},
};
