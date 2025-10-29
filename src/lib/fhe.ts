import { hexlify, getAddress } from "ethers";

declare global {
  interface Window {
    relayerSDK?: {
      __initialized__?: boolean;
      initSDK: () => Promise<boolean>;
      createInstance: (config: Record<string, unknown>) => Promise<any>;
      SepoliaConfig: Record<string, unknown>;
    };
    ethereum?: any;
    okxwallet?: any;
  }
}

let fheInstance: any = null;
let initPromise: Promise<any> | null = null;
let sdkPromise: Promise<void> | null = null;

const SDK_URL = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js';

/**
 * Reset FHE instance
 */
export const resetFHEInstance = () => {
  console.log('[FHE] Resetting instance...');
  fheInstance = null;
  initPromise = null;
};

/**
 * Check if SDK is initialized
 */
const isFhevmInitialized = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!window.relayerSDK) return false;
  return window.relayerSDK.__initialized__ === true;
};

/**
 * Validate SDK structure
 */
const isValidRelayerSDK = (sdk: any): boolean => {
  return (
    sdk &&
    typeof sdk === 'object' &&
    typeof sdk.initSDK === 'function' &&
    typeof sdk.createInstance === 'function' &&
    sdk.SepoliaConfig &&
    typeof sdk.SepoliaConfig === 'object'
  );
};

/**
 * Load FHE SDK from CDN
 */
const loadSdk = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  // SDK already loaded
  if (window.relayerSDK) {
    if (!isValidRelayerSDK(window.relayerSDK)) {
      throw new Error('window.relayerSDK is invalid');
    }
    console.log('[FHE] SDK already loaded');
    return;
  }

  // Use singleton promise
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SDK_URL}"]`) as HTMLScriptElement | null;
      if (existing) {
        console.log('[FHE] SDK script tag exists, waiting...');
        const checkLoaded = () => {
          if (window.relayerSDK && isValidRelayerSDK(window.relayerSDK)) {
            resolve();
          } else {
            reject(new Error('SDK script exists but invalid'));
          }
        };
        existing.addEventListener('load', checkLoaded);
        existing.addEventListener('error', () => reject(new Error('Failed to load SDK')));
        return;
      }

      const script = document.createElement('script');
      script.src = SDK_URL;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        if (window.relayerSDK && isValidRelayerSDK(window.relayerSDK)) {
          console.log('[FHE] SDK loaded successfully');
          resolve();
        } else {
          reject(new Error('SDK loaded but invalid'));
        }
      };

      script.onerror = () => {
        reject(new Error(`Failed to load SDK from ${SDK_URL}`));
      };

      document.head.appendChild(script);
      console.log('[FHE] Loading SDK from CDN...');
    });
  }

  return sdkPromise;
};

/**
 * Initialize FHE SDK
 */
export const initializeFHE = async (provider?: any, timeoutMs: number = 60000) => {
  // Return existing instance
  if (fheInstance) {
    console.log('[FHE] Reusing existing instance');
    return fheInstance;
  }

  // Return ongoing initialization
  if (initPromise) {
    console.log('[FHE] Waiting for ongoing initialization');
    return initPromise;
  }

  if (typeof window === 'undefined') {
    throw new Error('Browser environment required');
  }

  // Get provider
  const ethereumProvider = provider ||
    window.ethereum ||
    (window as any).okxwallet?.provider ||
    (window as any).okxwallet ||
    (window as any).coinbaseWalletExtension;

  if (!ethereumProvider) {
    throw new Error('Ethereum provider not found. Please connect your wallet first.');
  }

  console.log('[FHE] Using Ethereum provider:', {
    isOKX: !!(window as any).okxwallet,
    isMetaMask: !!(window.ethereum as any)?.isMetaMask,
  });

  // Create initialization promise with timeout
  initPromise = Promise.race([
    (async () => {
      // Step 1: Load SDK
      await loadSdk();

      const sdk = window.relayerSDK;
      if (!sdk) {
        throw new Error('SDK not available after loading');
      }

      // Step 2: Initialize SDK
      if (!isFhevmInitialized()) {
        console.log('[FHE] Initializing SDK...');
        const initResult = await sdk.initSDK();
        sdk.__initialized__ = initResult;

        if (!initResult) {
          throw new Error('SDK initSDK() failed');
        }
        console.log('[FHE] SDK initialized');
      } else {
        console.log('[FHE] SDK already initialized');
      }

      // Step 3: Create instance
      console.log('[FHE] Creating FHE instance...');
      const config = {
        ...sdk.SepoliaConfig,
        network: ethereumProvider,
      };

      const instance = await sdk.createInstance(config);
      console.log('[FHE] ✅ Instance created successfully');

      fheInstance = instance;
      return instance;
    })(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`FHE initialization timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);

  try {
    const result = await initPromise;
    initPromise = null;
    return result;
  } catch (error: any) {
    initPromise = null;
    fheInstance = null;
    console.error('[FHE] ❌ Initialization failed:', error);
    throw error;
  }
};

/**
 * Encrypt a uint64 value
 */
export const encryptAmount = async (
  amount: bigint,
  contractAddress: string,
  userAddress: string
): Promise<{
  encryptedAmount: `0x${string}`;
  proof: `0x${string}`;
}> => {
  console.log('[FHE] Encrypting amount:', amount.toString());

  const fhe = await initializeFHE();
  const checksumAddress = getAddress(contractAddress);

  console.log('[FHE] Creating encrypted input...');
  const input = fhe.createEncryptedInput(checksumAddress, userAddress);
  input.add64(amount);

  console.log('[FHE] Encrypting...');
  const { handles, inputProof } = await input.encrypt();

  console.log('[FHE] ✅ Encryption complete');

  return {
    encryptedAmount: hexlify(handles[0]) as `0x${string}`,
    proof: hexlify(inputProof) as `0x${string}`,
  };
};

/**
 * Decrypt a euint64 value
 */
export const decryptAmount = async (
  handle: string,
  contractAddress: string,
  userAddress: string
): Promise<bigint> => {
  console.log('[FHE] Decrypting handle:', handle);

  const fhe = await initializeFHE();
  const checksumAddress = getAddress(contractAddress);

  console.log('[FHE] Requesting decryption...');
  const decrypted = await fhe.decrypt(checksumAddress, handle, userAddress);

  console.log('[FHE] ✅ Decryption complete');
  return BigInt(decrypted);
};
