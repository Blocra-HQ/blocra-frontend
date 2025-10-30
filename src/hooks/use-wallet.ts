import { useState, useEffect } from 'react';
import { connect, disconnect } from 'starknetkit';

interface DetectedWallets {
  argent: boolean;
  braavos: boolean;
  available: string[];
}

interface WalletAccount {
  address: string;
  chainId: string;
}

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    const savedAddress = localStorage.getItem('wallet_address');
    const savedType = localStorage.getItem('wallet_type');
    if (savedAddress && savedType) {
      setIsConnected(true);
      setWalletAddress(savedAddress);
      setWalletType(savedType);
    }
  }, []);

  const detectWallets = (): DetectedWallets => {
    // Check for wallet extensions in window object
    const hasArgent = !!(window as any).starknet_argentX;
    const hasBraavos = !!(window as any).starknet_braavos;
    const available = [];
    
    if (hasArgent) available.push('argent');
    if (hasBraavos) available.push('braavos');
    
    return {
      argent: hasArgent,
      braavos: hasBraavos,
      available
    };
  };

  const connectWallet = async (walletType: 'argent' | 'braavos'): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the wallet provider
      const provider = (window as any)[walletType === 'argent' ? 'starknet_argentX' : 'starknet_braavos'];
      
      if (!provider) {
        throw new Error(`${walletType} wallet not detected. Please install it first.`);
      }

      // Connect to wallet
      const result = await provider.request({ method: 'wallet_requestAccounts' });
      
      if (!result || result.length === 0) {
        throw new Error('No accounts found in wallet');
      }

      const address = result[0];
      
      // Get chain ID
      const chainIdResult = await provider.request({ method: 'starknet_chainId' });
      const chainId = chainIdResult || 'SN_MAINNET';

      // Store connection info
      setIsConnected(true);
      setWalletAddress(address);
      setWalletType(walletType);
      setAccount({
        address,
        chainId
      });

      localStorage.setItem('wallet_address', address);
      localStorage.setItem('wallet_type', walletType);
      localStorage.setItem('wallet_chain_id', chainId);

      console.log(`Connected to ${walletType} wallet:`, address);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsLoading(true);
      
      // Disconnect from wallet
      if (walletType) {
        const provider = (window as any)[walletType === 'argent' ? 'starknet_argentX' : 'starknet_braavos'];
        if (provider?.request) {
          await provider.request({ method: 'wallet_requestAccounts', params: [] });
        }
      }

      setIsConnected(false);
      setWalletAddress(null);
      setWalletType(null);
      setAccount(null);
      setError(null);

      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_type');
      localStorage.removeItem('wallet_chain_id');

      console.log('Wallet disconnected');
    } catch (err) {
      console.error('Wallet disconnection failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = async (): Promise<string | null> => {
    if (!walletAddress || !walletType) return null;

    try {
      const provider = (window as any)[walletType === 'argent' ? 'starknet_argentX' : 'starknet_braavos'];
      
      if (!provider?.request) return null;

      // Get STRK balance (example)
      const balance = await provider.request({
        method: 'starknet_call',
        params: {
          contract_address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f36c58b41',
          entry_point_selector: '0x2e4263afad4be7b8467a2c1f1e0cf25924cab98feeac11d1e8c75c4ce42ea7',
          calldata: [walletAddress]
        }
      });

      return balance ? balance[0] : null;
    } catch (err) {
      console.error('Failed to get balance:', err);
      return null;
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!walletAddress || !walletType) return null;

    try {
      const provider = (window as any)[walletType === 'argent' ? 'starknet_argentX' : 'starknet_braavos'];
      
      if (!provider?.request) return null;

      const signature = await provider.request({
        method: 'starknet_signMessage',
        params: {
          types: {
            StarkNetDomain: [
              { name: 'name', type: 'felt' },
              { name: 'version', type: 'felt' },
              { name: 'chainId', type: 'felt' }
            ],
            Message: [
              { name: 'content', type: 'felt' }
            ]
          },
          primaryType: 'Message',
          domain: {
            name: 'Starklytics',
            version: '1',
            chainId: account?.chainId || 'SN_MAINNET'
          },
          message: {
            content: message
          }
        }
      });

      return signature;
    } catch (err) {
      console.error('Failed to sign message:', err);
      return null;
    }
  };

  return {
    isConnected,
    walletAddress,
    walletType,
    account,
    isLoading,
    error,
    detectWallets,
    connectWallet,
    disconnectWallet,
    getBalance,
    signMessage
  };
}