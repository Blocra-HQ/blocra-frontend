// Stellar network config and Soroban contract calls signed with Freighter.
//
// Adapted from stellar-insights' Freighter payment helper (pay-invoice.ts):
// same build → Freighter signTransaction → submit flow, but for Soroban
// contract invocations, which must be simulated and prepared (footprint,
// resource fee, auth) before signing and are polled until they land.
import { signTransaction } from "@stellar/freighter-api";
import {
  Account,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

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

let server: rpc.Server | undefined;
export function sorobanServer(): rpc.Server {
  server ??= new rpc.Server(SOROBAN_RPC_URL);
  return server;
}

// Reads need a source account but no signature or funds.
const READ_SOURCE = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

/** Simulates a read-only contract call and returns its decoded result. */
export async function readContract<T = unknown>(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<T> {
  const tx = new TransactionBuilder(new Account(READ_SOURCE, "0"), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await sorobanServer().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(contractErrorMessage(sim.error));
  }
  if (!sim.result) throw new Error(`${method} returned no value`);
  return scValToNative(sim.result.retval) as T;
}

/**
 * Builds a contract call from `signer`, has Freighter sign it, submits it and
 * waits for the result. Returns the decoded return value and the tx hash.
 */
export async function invokeContract<T = unknown>(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signer: string,
): Promise<{ result: T; hash: string }> {
  const soroban = sorobanServer();
  const account = await soroban.getAccount(signer);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(180)
    .build();

  let prepared;
  try {
    prepared = await soroban.prepareTransaction(tx);
  } catch (err) {
    throw new Error(contractErrorMessage(String((err as Error)?.message ?? err)));
  }

  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signer,
  });
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message || "The wallet did not sign the transaction.");
  }

  const sent = await soroban.sendTransaction(
    TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK_PASSPHRASE),
  );
  if (sent.status === "ERROR" || sent.status === "TRY_AGAIN_LATER") {
    throw new Error(`The network rejected the transaction (${sent.status}).`);
  }

  const final = await soroban.pollTransaction(sent.hash, { attempts: 30 });
  if (final.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction ${sent.hash} did not succeed (${final.status}).`);
  }
  const result = final.returnValue ? (scValToNative(final.returnValue) as T) : (undefined as T);
  return { result, hash: sent.hash };
}

// blocra-contracts bounty/src/errors.rs, so users see why a call failed.
const BOUNTY_ERRORS: Record<number, string> = {
  1: "You are not allowed to do this.",
  2: "That bounty does not exist.",
  3: "This bounty is no longer open.",
  4: "The reward must be greater than zero.",
  5: "The deadline must be in the future.",
  6: "Allow at least one participant.",
  7: "Title or description is empty or too long.",
  8: "You can't join your own bounty.",
  9: "You have already joined this bounty.",
  10: "This bounty is full.",
  11: "You haven't joined this bounty.",
  12: "The deadline has passed.",
  13: "The deadline hasn't passed yet.",
  14: "The winner must have submitted a solution.",
  15: "Solutions were submitted, so pick a winner instead of refunding.",
  16: "Someone has joined, so the bounty can't be cancelled.",
  17: "This bounty isn't in dispute.",
  19: "Bounties are paused right now.",
};

export function contractErrorMessage(raw: string): string {
  const code = /Error\(Contract, #(\d+)\)/.exec(raw)?.[1];
  if (code && BOUNTY_ERRORS[Number(code)]) return BOUNTY_ERRORS[Number(code)];
  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
}
