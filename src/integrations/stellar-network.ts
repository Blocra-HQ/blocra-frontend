// Stellar network config shared by the wallet (sign-in) and the app.
//
// Started from stellar-insights' Freighter payment helper; contract calls
// live in soroban.ts.
import { Networks } from "@stellar/stellar-sdk";

export type StellarNetwork = "mainnet" | "testnet";

export const STELLAR_NETWORK: StellarNetwork =
  import.meta.env.VITE_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

const DEFAULT_RPC: Record<StellarNetwork, string> = {
  mainnet: "https://mainnet.sorobanrpc.com",
  testnet: "https://soroban-testnet.stellar.org",
};

export const SOROBAN_RPC_URL: string =
  import.meta.env.VITE_STELLAR_RPC_URL || DEFAULT_RPC[STELLAR_NETWORK];

export const EXPLORER_URL =
  STELLAR_NETWORK === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
