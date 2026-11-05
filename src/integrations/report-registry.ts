// BlocRA report registry (blocra-contracts/report_registry) on Stellar.
//
// Publishing records a report file's sha256 with its author, chain, analyzed
// contract and title; verifying recomputes the hash of a file and looks it up.
import { Buffer } from "buffer";
import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { invokeContract, readContract } from "@/integrations/soroban";
import { EXPLORER_URL } from "@/integrations/stellar-network";

/** Testnet deployment from blocra-contracts; override with VITE_REPORT_REGISTRY_CONTRACT_ID. */
export const REPORT_REGISTRY_ID: string =
  import.meta.env.VITE_REPORT_REGISTRY_CONTRACT_ID ||
  "CD7UABTKAOO2EZ2A543GIIHQED6PPMIPK2NU47W5GKCRDJ26UPZ45CPW";

export const REGISTRY_EXPLORER_URL = `${EXPLORER_URL}/contract/${REPORT_REGISTRY_ID}`;

// report_registry/src/errors.rs
const ERRORS: Record<number, string> = {
  2: "That report does not exist.",
  3: "This exact report has already been published.",
  4: "Title, chain or contract is empty or too long.",
  6: "This report is already revoked.",
  8: "Publishing is paused right now.",
};

export interface PublishedReport {
  id: number;
  author: string;
  reportHash: string;
  title: string;
  chain: string;
  subject: string;
  uri: string | null;
  publishedAt: Date;
  revoked: boolean;
}

export async function sha256(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const bytesArg = (b: Uint8Array) => xdr.ScVal.scvBytes(Buffer.from(b));
const str = (s: string) => nativeToScVal(s, { type: "string" });

/** Publishes `file`'s hash as `author`; Freighter asks the user to sign. */
export async function publishReport(input: {
  author: string;
  file: Blob;
  title: string;
  chain: string;
  subject: string;
}): Promise<{ id: number; hash: string; txHash: string }> {
  const digest = await sha256(input.file);
  const { result, hash } = await invokeContract<bigint>(
    REPORT_REGISTRY_ID,
    "publish_report",
    [
      new Address(input.author).toScVal(),
      bytesArg(digest),
      str(input.title.slice(0, 120)),
      str(input.chain.slice(0, 32)),
      str(input.subject.slice(0, 128)),
      xdr.ScVal.scvVoid(),
    ],
    input.author,
    ERRORS,
  );
  return { id: Number(result), hash: toHex(digest), txHash: hash };
}

interface RawReport {
  id: bigint;
  author: string;
  report_hash: Uint8Array;
  title: string;
  chain: string;
  subject: string;
  uri?: string | null;
  published_at: bigint;
  revoked: boolean;
}

/** Looks a file up by its hash; null if it was never published. */
export async function findReport(file: Blob): Promise<{ hash: string; report: PublishedReport | null }> {
  const digest = await sha256(file);
  const raw = await readContract<RawReport | null | undefined>(
    REPORT_REGISTRY_ID,
    "get_report_by_hash",
    [bytesArg(digest)],
    ERRORS,
  );
  if (!raw) return { hash: toHex(digest), report: null };
  return {
    hash: toHex(digest),
    report: {
      id: Number(raw.id),
      author: raw.author,
      reportHash: toHex(new Uint8Array(raw.report_hash)),
      title: raw.title,
      chain: raw.chain,
      subject: raw.subject,
      uri: raw.uri ?? null,
      publishedAt: new Date(Number(raw.published_at) * 1000),
      revoked: raw.revoked,
    },
  };
}
