// Soroban contract calls: free simulated reads, and writes signed with Freighter.
// Same build → Freighter signTransaction → submit flow as the stellar-insights
// payment helper this started from, plus simulate/prepare and polling.
import { signTransaction } from "@stellar/freighter-api";
import {
  Account,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from "@/integrations/stellar-network";

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
  codes: Record<number, string> = {},
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
    throw new Error(contractErrorMessage(sim.error, codes));
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
  codes: Record<number, string> = {},
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
    throw new Error(contractErrorMessage(String((err as Error)?.message ?? err), codes));
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

/** Readable message for a failed call; maps `Error(Contract, #n)` via `codes`. */
export function contractErrorMessage(raw: string, codes: Record<number, string> = {}): string {
  const code = /Error\(Contract, #(\d+)\)/.exec(raw)?.[1];
  if (code && codes[Number(code)]) return codes[Number(code)];
  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
}
