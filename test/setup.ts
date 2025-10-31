/**
 * Test Setup File
 * Global test configuration and polyfills
 */

import { vi } from 'vitest';

// Mock window.relayerSDK for FHE tests
(global as any).window = {
  relayerSDK: {
    init: vi.fn().mockResolvedValue({
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
      getPublicParams: vi.fn().mockResolvedValue({}),
      createEIP712: vi.fn().mockReturnValue({}),
    }),
  },
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => null),
  setItem: vi.fn((key: string, value: string) => null),
  removeItem: vi.fn((key: string) => null),
  clear: vi.fn(),
  length: 0,
  key: vi.fn((index: number) => null),
};

(global as any).localStorage = localStorageMock;

// Mock fetch
(global as any).fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
});

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: any[]) => {
  // Suppress specific warnings
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('ReactDOM.render') ||
      message.includes('Warning: ') ||
      message.includes('act()'))
  ) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  // Suppress specific errors
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Not implemented: HTMLFormElement') ||
      message.includes('Error: Could not parse CSS stylesheet'))
  ) {
    return;
  }
  originalError(...args);
};

// Setup test environment variables
process.env.NODE_ENV = 'test';
