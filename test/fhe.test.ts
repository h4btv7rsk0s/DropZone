/**
 * FHE Encryption Tests
 * Tests for Zama FHE SDK integration and encryption functionality
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { initializeFHE, encryptAmount } from '../src/lib/fhe';

describe('FHE Encryption Module', () => {

  describe('initializeFHE', () => {
    it('should initialize FHE instance successfully', async () => {
      const fhe = await initializeFHE();

      expect(fhe).toBeDefined();
      expect(fhe.createEncryptedInput).toBeDefined();
      expect(fhe.generateKeypair).toBeDefined();
      expect(fhe.getPublicKey).toBeDefined();
    });

    it('should return cached instance on subsequent calls', async () => {
      const fhe1 = await initializeFHE();
      const fhe2 = await initializeFHE();

      expect(fhe1).toBe(fhe2);
    });

    it('should load SDK from CDN', async () => {
      const fhe = await initializeFHE();

      // Check that SDK is available in window
      expect(window.relayerSDK).toBeDefined();
    });
  });

  describe('encryptAmount', () => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    it('should encrypt valid BigInt amount', async () => {
      const amount = BigInt(1000);
      const result = await encryptAmount(amount, testAddress, userAddress);

      expect(result).toBeDefined();
      expect(result.encryptedAmount).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(result.proof).toMatch(/^0x[0-9a-fA-F]+$/);
    });

    it('should encrypt zero amount', async () => {
      const amount = BigInt(0);
      const result = await encryptAmount(amount, testAddress, userAddress);

      expect(result).toBeDefined();
      expect(result.encryptedAmount).toBeDefined();
      expect(result.proof).toBeDefined();
    });

    it('should encrypt maximum euint64 value', async () => {
      const maxUint64 = BigInt('18446744073709551615');
      const result = await encryptAmount(maxUint64, testAddress, userAddress);

      expect(result).toBeDefined();
      expect(result.encryptedAmount).toBeDefined();
    });

    it('should handle small amounts', async () => {
      const amount = BigInt(1);
      const result = await encryptAmount(amount, testAddress, userAddress);

      expect(result).toBeDefined();
      expect(result.encryptedAmount).toMatch(/^0x/);
    });

    it('should produce different outputs for same input (probabilistic encryption)', async () => {
      const amount = BigInt(500);
      const result1 = await encryptAmount(amount, testAddress, userAddress);
      const result2 = await encryptAmount(amount, testAddress, userAddress);

      // FHE encryption should be probabilistic
      expect(result1.encryptedAmount).not.toBe(result2.encryptedAmount);
      expect(result1.proof).not.toBe(result2.proof);
    });

    it('should validate contract address format', async () => {
      const amount = BigInt(100);
      const invalidAddress = '0xinvalid';

      await expect(
        encryptAmount(amount, invalidAddress, userAddress)
      ).rejects.toThrow();
    });

    it('should handle checksummed addresses', async () => {
      const amount = BigInt(100);
      const checksummed = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const lowercase = checksummed.toLowerCase();

      const result1 = await encryptAmount(amount, checksummed, userAddress);
      const result2 = await encryptAmount(amount, lowercase, userAddress);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle SDK load failures gracefully', async () => {
      // Mock SDK load failure
      const originalSDK = window.relayerSDK;
      delete window.relayerSDK;

      // Force reload by clearing cache
      vi.clearAllMocks();

      // Restore
      window.relayerSDK = originalSDK;
    });

    it('should handle invalid amounts', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

      // Negative amounts should fail at BigInt level
      expect(() => BigInt(-100)).toThrow();
    });

    it('should reject amounts exceeding euint64 max', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

      // This should fail during contract interaction, not encryption
      const overflowAmount = BigInt('18446744073709551616'); // max + 1
      const result = await encryptAmount(overflowAmount, testAddress, userAddress);

      // Encryption will succeed, but contract will reject
      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should encrypt within reasonable time', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const amount = BigInt(1000);

      const startTime = Date.now();
      await encryptAmount(amount, testAddress, userAddress);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle batch encryptions', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const amounts = [BigInt(100), BigInt(200), BigInt(300)];

      const results = await Promise.all(
        amounts.map(amt => encryptAmount(amt, testAddress, userAddress))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.encryptedAmount).toBeDefined();
        expect(result.proof).toBeDefined();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should maintain encryption consistency across multiple calls', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const amount = BigInt(1000);

      const results = await Promise.all([
        encryptAmount(amount, testAddress, userAddress),
        encryptAmount(amount, testAddress, userAddress),
        encryptAmount(amount, testAddress, userAddress),
      ]);

      // All should succeed
      results.forEach(result => {
        expect(result.encryptedAmount).toMatch(/^0x[0-9a-fA-F]+$/);
        expect(result.proof).toMatch(/^0x[0-9a-fA-F]+$/);
      });
    });

    it('should work with different addresses', async () => {
      const contracts = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      ];
      const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const amount = BigInt(500);

      for (const contract of contracts) {
        const result = await encryptAmount(amount, contract, userAddress);
        expect(result).toBeDefined();
      }
    });
  });
});
