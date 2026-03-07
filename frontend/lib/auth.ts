/**
 * MetaMask Wallet Authentication Library
 * 
 * Features:
 * - Generate random signing message from backend
 * - Request user to sign with MetaMask
 * - Get wallet address from MetaMask
 * - Verify signature on backend
 * - Create session with authenticated wallet
 */

interface MetaMaskWindow extends Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on?: (event: string, callback: (args: any) => void) => void;
    selectedAddress?: string;
    isMetaMask?: boolean;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  const { ethereum } = window as MetaMaskWindow;
  return !!(ethereum && ethereum.isMetaMask);
};

/**
 * Request user to connect MetaMask wallet
 */
export const connectWallet = async (): Promise<string> => {
  const { ethereum } = window as MetaMaskWindow;

  if (!ethereum) {
    throw new Error('MetaMask is not installed. Please install it from https://metamask.io');
  }

  try {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found in MetaMask');
    }

    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('MetaMask connection was rejected by user');
    }
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
};

/**
 * Get random message from backend for user to sign
 */
export const getSigningMessage = async (): Promise<{ message: string; nonce: string }> => {
  try {
    const response = await fetch(`${API_URL}/auth/metamask/message`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get signing message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`Error fetching signing message: ${error.message}`);
  }
};

/**
 * Request user to sign message with MetaMask
 */
export const signMessage = async (address: string, message: string): Promise<string> => {
  const { ethereum } = window as MetaMaskWindow;

  if (!ethereum) {
    throw new Error('MetaMask is not available');
  }

  try {
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });

    return signature;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Signature request was rejected by user');
    }
    throw new Error(`Failed to sign message: ${error.message}`);
  }
};

/**
 * Verify signature with backend and authenticate user
 */
export const verifySignature = async (
  address: string,
  message: string,
  signature: string,
  nonce: string
): Promise<{ authenticated: boolean; token?: string; user?: any }> => {
  try {
    const response = await fetch(`${API_URL}/auth/metamask/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        message,
        signature,
        nonce,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      authenticated: true,
      token: data.token,
      user: data.user,
    };
  } catch (error: any) {
    throw new Error(`Signature verification failed: ${error.message}`);
  }
};

/**
 * Complete MetaMask login flow
 */
export const loginWithWallet = async (): Promise<boolean> => {
  try {
    // Step 1: Check MetaMask installation
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    // Step 2: Connect wallet
    const address = await connectWallet();
    console.log('✅ Wallet connected:', address);

    // Step 3: Get random message from backend
    const { message, nonce } = await getSigningMessage();
    console.log('✅ Got signing message from backend');

    // Step 4: Request user to sign message
    const signature = await signMessage(address, message);
    console.log('✅ Message signed by user');

    // Step 5: Verify signature with backend
    const result = await verifySignature(address, message, signature, nonce);
    
    if (result.authenticated && result.token) {
      // Store token in localStorage
      localStorage.setItem('walletToken', result.token);
      localStorage.setItem('walletAddress', address);
      console.log('✅ Authentication successful');
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Wallet login error:', error.message);
    throw error;
  }
};

/**
 * Get stored wallet address
 */
export const getStoredWalletAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('walletAddress');
};

/**
 * Get stored wallet token
 */
export const getStoredWalletToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('walletToken');
};

/**
 * Logout wallet
 */
export const logoutWallet = (): void => {
  localStorage.removeItem('walletToken');
  localStorage.removeItem('walletAddress');
};

/**
 * Check if wallet is authenticated
 */
export const isWalletAuthenticated = (): boolean => {
  return !!(getStoredWalletToken() && getStoredWalletAddress());
};
