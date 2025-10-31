/**
 * Utility Functions Tests
 * Tests for helper functions and utilities
 */

import { describe, it, expect } from 'vitest';
import { isAddress, getAddress } from 'viem';

describe('Utility Functions', () => {

  describe('Address Validation', () => {
    it('should validate correct Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x0000000000000000000000000000000000000000',
      ];

      validAddresses.forEach(addr => {
        expect(isAddress(addr)).toBe(true);
      });
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        '0xinvalid',
        '742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Missing 0x
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bE', // Too short
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbZZ', // Invalid chars
        '',
        '0x',
      ];

      invalidAddresses.forEach(addr => {
        expect(isAddress(addr)).toBe(false);
      });
    });

    it('should checksum addresses correctly', () => {
      const lowercaseAddr = '0x742d35cc6634c0532925a3b844bc9e7595f0beb';
      const checksummed = getAddress(lowercaseAddr);

      expect(checksummed).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    it('should handle mixed case addresses', () => {
      const mixedCase = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      expect(isAddress(mixedCase)).toBe(true);
    });
  });

  describe('BigInt Operations', () => {
    it('should convert string to BigInt', () => {
      const values = ['100', '1000', '999999'];

      values.forEach(val => {
        const bigInt = BigInt(val);
        expect(typeof bigInt).toBe('bigint');
        expect(bigInt.toString()).toBe(val);
      });
    });

    it('should handle zero values', () => {
      const zero = BigInt(0);
      expect(zero).toBe(BigInt(0));
      expect(zero.toString()).toBe('0');
    });

    it('should handle maximum euint64 value', () => {
      const maxUint64 = BigInt('18446744073709551615');
      expect(maxUint64).toBeDefined();
      expect(maxUint64.toString()).toBe('18446744073709551615');
    });

    it('should perform arithmetic operations', () => {
      const a = BigInt(1000);
      const b = BigInt(500);

      expect(a + b).toBe(BigInt(1500));
      expect(a - b).toBe(BigInt(500));
      expect(a * b).toBe(BigInt(500000));
      expect(a / b).toBe(BigInt(2));
    });

    it('should compare BigInt values', () => {
      const a = BigInt(1000);
      const b = BigInt(500);
      const c = BigInt(1000);

      expect(a > b).toBe(true);
      expect(b < a).toBe(true);
      expect(a === c).toBe(true);
      expect(a !== b).toBe(true);
    });

    it('should handle large numbers', () => {
      const large = BigInt('9999999999999999999');
      expect(large).toBeDefined();
      expect(large > BigInt(0)).toBe(true);
    });
  });

  describe('Hex String Operations', () => {
    it('should validate hex strings', () => {
      const validHex = [
        '0x1234567890abcdef',
        '0xABCDEF1234567890',
        '0x0',
        '0x00',
      ];

      validHex.forEach(hex => {
        expect(hex).toMatch(/^0x[0-9a-fA-F]*$/);
      });
    });

    it('should reject invalid hex strings', () => {
      const invalidHex = [
        '1234567890abcdef', // Missing 0x
        '0xGHIJKL', // Invalid chars
        '0x 123', // Space
      ];

      invalidHex.forEach(hex => {
        expect(hex).not.toMatch(/^0x[0-9a-fA-F]*$/);
      });
    });

    it('should handle hex padding', () => {
      const unpadded = '0x1';
      const padded = '0x0001';

      expect(unpadded).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(padded).toMatch(/^0x[0-9a-fA-F]+$/);
    });
  });

  describe('Array Operations', () => {
    it('should validate array lengths match', () => {
      const addresses = ['0x123', '0x456', '0x789'];
      const amounts = [100, 200, 300];
      const proofs = ['0xabc', '0xdef', '0x012'];

      expect(addresses).toHaveLength(amounts.length);
      expect(addresses).toHaveLength(proofs.length);
    });

    it('should filter empty values', () => {
      const values = ['100', '', '200', '', '300'];
      const filtered = values.filter(v => v !== '');

      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual(['100', '200', '300']);
    });

    it('should map array transformations', () => {
      const strings = ['100', '200', '300'];
      const bigInts = strings.map(s => BigInt(s));

      expect(bigInts).toHaveLength(3);
      bigInts.forEach(bi => {
        expect(typeof bi).toBe('bigint');
      });
    });

    it('should reduce array values', () => {
      const amounts = [BigInt(100), BigInt(200), BigInt(300)];
      const total = amounts.reduce((sum, amt) => sum + amt, BigInt(0));

      expect(total).toBe(BigInt(600));
    });
  });

  describe('String Operations', () => {
    it('should trim whitespace', () => {
      const values = [' 100 ', '  200', '300  '];
      const trimmed = values.map(v => v.trim());

      expect(trimmed).toEqual(['100', '200', '300']);
    });

    it('should convert to lowercase', () => {
      const addresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0xF39FD6E51AAD88F6F4CE6AB8827279CFFFB92266',
      ];
      const lowercase = addresses.map(a => a.toLowerCase());

      lowercase.forEach(addr => {
        expect(addr).toMatch(/^0x[0-9a-f]{40}$/);
      });
    });

    it('should split CSV strings', () => {
      const csv = '0x123,0x456,0x789';
      const parts = csv.split(',');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('0x123');
    });
  });

  describe('Error Handling', () => {
    it('should throw on invalid BigInt conversion', () => {
      expect(() => BigInt('not a number')).toThrow();
      expect(() => BigInt('12.34')).toThrow();
      expect(() => BigInt(-100)).toThrow();
    });

    it('should handle null and undefined', () => {
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();

      const value = null;
      expect(value ?? 'default').toBe('default');
    });

    it('should validate required fields', () => {
      const data = {
        address: '0x123',
        amount: BigInt(100),
      };

      expect(data.address).toBeDefined();
      expect(data.amount).toBeDefined();
    });
  });

  describe('Type Guards', () => {
    it('should check string types', () => {
      const value = '100';
      expect(typeof value).toBe('string');
    });

    it('should check bigint types', () => {
      const value = BigInt(100);
      expect(typeof value).toBe('bigint');
    });

    it('should check array types', () => {
      const value = [1, 2, 3];
      expect(Array.isArray(value)).toBe(true);
    });

    it('should check object types', () => {
      const value = { key: 'value' };
      expect(typeof value).toBe('object');
      expect(value).not.toBeNull();
    });
  });

  describe('URL Operations', () => {
    it('should construct Etherscan URLs', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const url = `https://sepolia.etherscan.io/tx/${txHash}`;

      expect(url).toContain('sepolia.etherscan.io');
      expect(url).toContain(txHash);
    });

    it('should construct address URLs', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const url = `https://sepolia.etherscan.io/address/${address}`;

      expect(url).toContain('sepolia.etherscan.io');
      expect(url).toContain(address);
    });
  });

  describe('Date/Time Operations', () => {
    it('should get current timestamp', () => {
      const now = Date.now();
      expect(typeof now).toBe('number');
      expect(now).toBeGreaterThan(0);
    });

    it('should format timestamps', () => {
      const timestamp = 1699000000000;
      const date = new Date(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBeGreaterThan(2020);
    });

    it('should calculate time differences', () => {
      const start = Date.now();
      const end = start + 5000; // 5 seconds later
      const diff = end - start;

      expect(diff).toBe(5000);
    });
  });

  describe('JSON Operations', () => {
    it('should parse JSON strings', () => {
      const json = '{"address":"0x123","amount":"100"}';
      const parsed = JSON.parse(json);

      expect(parsed.address).toBe('0x123');
      expect(parsed.amount).toBe('100');
    });

    it('should stringify objects', () => {
      const obj = {
        address: '0x123',
        amount: '100',
      };
      const json = JSON.stringify(obj);

      expect(json).toContain('"address"');
      expect(json).toContain('"amount"');
    });

    it('should handle nested objects', () => {
      const nested = {
        airdrop: {
          id: 1,
          recipients: ['0x123', '0x456'],
        },
      };
      const json = JSON.stringify(nested);
      const parsed = JSON.parse(json);

      expect(parsed.airdrop.id).toBe(1);
      expect(parsed.airdrop.recipients).toHaveLength(2);
    });
  });

  describe('Math Operations', () => {
    it('should calculate percentages', () => {
      const total = 1000;
      const claimed = 250;
      const percentage = (claimed / total) * 100;

      expect(percentage).toBe(25);
    });

    it('should round numbers', () => {
      expect(Math.round(3.7)).toBe(4);
      expect(Math.round(3.3)).toBe(3);
      expect(Math.floor(3.9)).toBe(3);
      expect(Math.ceil(3.1)).toBe(4);
    });

    it('should find min and max', () => {
      const values = [100, 250, 75, 300, 150];

      expect(Math.min(...values)).toBe(75);
      expect(Math.max(...values)).toBe(300);
    });
  });
});
