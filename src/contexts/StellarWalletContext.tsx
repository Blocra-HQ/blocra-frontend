// Stellar wallet connection and sign-in.
//
// Adapted from stellar-insights' wallet context: same provider shape
// (connect / disconnect / authenticate / logout, address remembered between
// visits, auth token never kept in long-lived storage by this module), but
// using @stellar/freighter-api instead of window globals, and BlocRA's
// backend challenge flow:
//   POST /api/auth/stellar/challenge {account}       → {challenge}
//   Freighter signMessage(challenge)                  (SEP-53)
//   POST /api/auth/stellar/verify {challenge, signature} → {token, user}
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAddress,
  isConnected as freighterInstalled,
  requestAccess,
  signMessage,
} from "@stellar/freighter-api";
import { apiClient } from "@/lib/api";
import { NETWORK_PASSPHRASE } from "@/integrations/stellar-network";

interface StellarWalletContextType {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  /** Ask Freighter for access and remember the account. */
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  /** Prove control of the connected account to the backend and get a session. */
  signIn: () => Promise<void>;
  logout: () => void;
}

const StellarWalletContext = createContext<StellarWalletContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ADDRESS: "stellar_wallet_address",
  // Starknet-era keys, purged so old Argent/Braavos sessions don't linger.
  LEGACY: ["wallet_address", "wallet_type", "wallet_chain_id"],
};

const FREIGHTER_URL = "https://www.freighter.app/";

function toBase64(signed: string | Uint8Array | null): string {
  if (!signed) throw new Error("The wallet did not sign the message.");
  if (typeof signed === "string") return signed;
  let binary = "";
  signed.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    STORAGE_KEYS.LEGACY.forEach((k) => localStorage.removeItem(k));
    const saved = localStorage.getItem(STORAGE_KEYS.ADDRESS);
    if (saved) setAddress(saved);
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const installed = await freighterInstalled();
      if (!installed.isConnected) {
        window.open(FREIGHTER_URL, "_blank", "noopener");
        throw new Error("Freighter is not installed. Install it, then try again.");
      }
      const access = await requestAccess();
      if (access.error || !access.address) {
        throw new Error(access.error?.message || "Wallet access was declined.");
      }
      localStorage.setItem(STORAGE_KEYS.ADDRESS, access.address);
      setAddress(access.address);
      return access.address;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ADDRESS);
    setAddress(null);
    setIsAuthenticated(false);
    apiClient.clearToken();
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      // Use the account Freighter has selected now, not a stale saved one.
      const current = await getAddress();
      const account = current.address || address || (await connectWallet());

      const { challenge } = await apiClient.request<{ challenge: string }>(
        "/auth/stellar/challenge",
        { method: "POST", body: JSON.stringify({ account }) },
      );
      const signed = await signMessage(challenge, {
        address: account,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      if (signed.error) throw new Error(signed.error.message || "Signing was declined.");

      const session = await apiClient.request<{ token: string }>("/auth/stellar/verify", {
        method: "POST",
        body: JSON.stringify({ challenge, signature: toBase64(signed.signedMessage) }),
      });
      apiClient.setToken(session.token);
      localStorage.setItem(STORAGE_KEYS.ADDRESS, account);
      setAddress(account);
      setIsAuthenticated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      setError(message);
      throw err;
    }
  }, [address, connectWallet]);

  const logout = useCallback(() => {
    apiClient.clearToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <StellarWalletContext.Provider
      value={{
        isConnected: !!address,
        address,
        isConnecting,
        isAuthenticated,
        error,
        connectWallet,
        disconnectWallet,
        signIn,
        logout,
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet() {
  const context = useContext(StellarWalletContext);
  if (!context) throw new Error("useStellarWallet must be used within a StellarWalletProvider");
  return context;
}
