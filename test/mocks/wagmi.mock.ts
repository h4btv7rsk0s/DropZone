/**
 * Wagmi Mock Utilities
 * Mock implementations for wagmi hooks and providers
 */

import { vi } from 'vitest';

export const mockAccount = {
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`,
  isConnected: true,
  isConnecting: false,
  isDisconnected: false,
  status: 'connected' as const,
};

export const mockChain = {
  id: 11155111, // Sepolia
  name: 'Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
    public: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
};

export const createMockUseAccount = () => ({
  ...mockAccount,
  connector: undefined,
});

export const createMockUseConnect = () => ({
  connect: vi.fn(),
  connectors: [],
  error: null,
  isLoading: false,
  pendingConnector: undefined,
});

export const createMockUseDisconnect = () => ({
  disconnect: vi.fn(),
  disconnectAsync: vi.fn(),
});

export const createMockUseNetwork = () => ({
  chain: mockChain,
  chains: [mockChain],
});

export const createMockUseContractRead = (returnValue: any) => ({
  data: returnValue,
  isError: false,
  isLoading: false,
  isSuccess: true,
  refetch: vi.fn(),
});

export const createMockUseContractWrite = () => ({
  data: undefined,
  isError: false,
  isLoading: false,
  isSuccess: false,
  write: vi.fn(),
  writeAsync: vi.fn().mockResolvedValue({
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  }),
  reset: vi.fn(),
});

export const createMockUseWaitForTransaction = () => ({
  data: {
    status: 'success' as const,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  isError: false,
  isLoading: false,
  isSuccess: true,
});

export const createMockUseBalance = (balance: string = '1.0') => ({
  data: {
    decimals: 18,
    formatted: balance,
    symbol: 'ETH',
    value: BigInt(balance) * BigInt(10 ** 18),
  },
  isError: false,
  isLoading: false,
  isSuccess: true,
  refetch: vi.fn(),
});

export const createMockPublicClient = () => ({
  readContract: vi.fn().mockResolvedValue(null),
  simulateContract: vi.fn().mockResolvedValue({ request: {} }),
  getBlockNumber: vi.fn().mockResolvedValue(BigInt(12345)),
  getBlock: vi.fn().mockResolvedValue({
    number: BigInt(12345),
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
  }),
  waitForTransactionReceipt: vi.fn().mockResolvedValue({
    status: 'success',
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  }),
});

export const createMockWalletClient = () => ({
  writeContract: vi.fn().mockResolvedValue(
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  ),
  signMessage: vi.fn().mockResolvedValue('0xsignature'),
  account: mockAccount,
});

export const setupWagmiMocks = () => {
  return {
    useAccount: vi.fn(() => createMockUseAccount()),
    useConnect: vi.fn(() => createMockUseConnect()),
    useDisconnect: vi.fn(() => createMockUseDisconnect()),
    useNetwork: vi.fn(() => createMockUseNetwork()),
    useContractRead: vi.fn(() => createMockUseContractRead(null)),
    useContractWrite: vi.fn(() => createMockUseContractWrite()),
    useWaitForTransaction: vi.fn(() => createMockUseWaitForTransaction()),
    useBalance: vi.fn(() => createMockUseBalance()),
    usePublicClient: vi.fn(() => createMockPublicClient()),
    useWalletClient: vi.fn(() => ({ data: createMockWalletClient() })),
  };
};
