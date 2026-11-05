// Stellar network config shared by the wallet (sign-in) and the app.
//
// Started from stellar-insights' Freighter payment helper; BlocRA no longer
// sends contract transactions (the bounty feature was removed), so only the
// network settings remain.
import { Networks } from "@stellar/stellar-sdk";

export type StellarNetwork = "mainnet" | "testnet";

export const STELLAR_NETWORK: StellarNetwork =
  import.meta.env.VITE_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

export const EXPLORER_URL =
  STELLAR_NETWORK === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
