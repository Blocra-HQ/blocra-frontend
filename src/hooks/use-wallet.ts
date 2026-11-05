// Wallet hook used across the app. Backed by the Stellar wallet context
// (Freighter); it replaced the Starknet Argent/Braavos hook.
import { useStellarWallet } from "@/contexts/StellarWalletContext";

export function useWallet() {
  const wallet = useStellarWallet();
  return {
    isConnected: wallet.isConnected,
    isAuthenticated: wallet.isAuthenticated,
    walletAddress: wallet.address,
    isLoading: wallet.isConnecting,
    error: wallet.error,
    connectWallet: wallet.connectWallet,
    disconnectWallet: wallet.disconnectWallet,
    signIn: wallet.signIn,
  };
}
