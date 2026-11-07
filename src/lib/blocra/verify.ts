// Browser verification of BlocRA-signed reports, the WebCrypto counterpart of
// blocra-cli's `blocra verify` (src/verify.js + bin/blocra.js cmdVerify):
//
// 1. the Ed25519 signature over report_json must be valid,
// 2. it must be made by a key the reader trusts,
// 3. for Markdown, the text must be exactly what the shared renderer
//    (vendored from the CLI) produces for the signed report.
//
// Pure functions over a SubtleCrypto, so the same code runs in the browser
// and in Node 18+ (globalThis.crypto.subtle) for tests.
import { bodyMatchesReport, parseMarkdown } from "./markdown";
import { decodeAccountId } from "./strkey";
import type { SignedEnvelope } from "./types";

export { OFFICIAL_KEYS } from "./defaults";
export type { Attestation, SignedEnvelope } from "./types";

export interface VerifyResult {
  ok: boolean;
  /** WebCrypto in this browser cannot check Ed25519 signatures. */
  unsupported: boolean;
  format: "md" | "json" | null;
  envelope: SignedEnvelope | null;
  report: Record<string, any> | null;
  /** sha256 (hex) of report_json, i.e. of the signed bytes. */
  sha256: string | null;
  reasons: string[];
}

const subtleOf = (subtle?: SubtleCrypto | null): SubtleCrypto | null =>
  subtle ?? (globalThis.crypto?.subtle as SubtleCrypto | undefined) ?? null;

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  if (typeof hex !== "string" || hex.length % 2 || /[^0-9a-f]/i.test(hex)) throw new Error("signature is not hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return out;
}

export async function sha256Hex(data: string | Uint8Array, subtle?: SubtleCrypto | null): Promise<string> {
  const s = subtleOf(subtle);
  if (!s) throw new Error("WebCrypto is not available");
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return toHex(new Uint8Array(await s.digest("SHA-256", bytes)));
}

/** True if this environment's WebCrypto can verify Ed25519 signatures. */
export async function ed25519Supported(subtle?: SubtleCrypto | null): Promise<boolean> {
  const s = subtleOf(subtle);
  if (!s) return false;
  try {
    await s.importKey("raw", new Uint8Array(32).fill(1), { name: "Ed25519" }, false, ["verify"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks an envelope against the trusted signer(s), like the CLI's
 * verifyEnvelope. ok is true only if every check passed.
 */
export async function verifyEnvelope(
  envelope: SignedEnvelope | null | undefined,
  trusted: string | string[] | null | undefined,
  subtle?: SubtleCrypto | null,
): Promise<Omit<VerifyResult, "format">> {
  const trustedSigners = (Array.isArray(trusted) ? trusted : [trusted]).filter(Boolean) as string[];
  const reasons: string[] = [];
  const att = envelope?.attestation;
  const text = envelope?.report_json;
  const base = { envelope: envelope ?? null, unsupported: false };
  if (typeof text !== "string" || !att) {
    return { ...base, ok: false, report: null, sha256: null, reasons: ["Not a BlocRA signed report (missing report_json or attestation)"] };
  }
  const s = subtleOf(subtle);
  if (!s || !(await ed25519Supported(s))) {
    return {
      ...base,
      ok: false,
      unsupported: true,
      report: safeParse(text),
      sha256: s ? await sha256Hex(text, s) : null,
      reasons: ["This browser cannot check Ed25519 signatures (WebCrypto Ed25519 is unsupported). Use a current browser or `npx blocra verify`."],
    };
  }
  if (att.algorithm !== "ed25519") reasons.push(`Unsupported signature algorithm "${att.algorithm}"`);
  if (!trustedSigners.length) reasons.push("No trusted BlocRA key to check the signer against");
  else if (!trustedSigners.includes(att.signer)) {
    reasons.push(`Signed by ${att.signer}, not by the trusted BlocRA key${trustedSigners.length > 1 ? "s" : ""} ${trustedSigners.join(", ")}`);
  }
  const bytes = new TextEncoder().encode(text);
  const sha = await sha256Hex(bytes, s);
  if (att.payload_sha256 && att.payload_sha256 !== sha) reasons.push("payload_sha256 does not match the report");
  let signatureOk = false;
  try {
    const key = await s.importKey("raw", decodeAccountId(att.signer), { name: "Ed25519" }, false, ["verify"]);
    signatureOk = await s.verify("Ed25519", key, fromHex(att.signature), bytes);
  } catch (e) {
    reasons.push(`Signature check failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!signatureOk && !reasons.some((r) => r.startsWith("Signature"))) {
    reasons.push("Signature is not valid: the report was changed or not signed by this key");
  }
  const report = safeParse(text);
  if (!report) reasons.push("report_json is not valid JSON");
  if (report && att.method_version && report.method_version && report.method_version !== att.method_version) {
    reasons.push("Method version in the report and the attestation differ");
  }
  return { ...base, ok: reasons.length === 0 && signatureOk, report, sha256: sha, reasons };
}

function safeParse(text: string): Record<string, any> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** The signed envelope inside a report file (.md or .json), as the CLI reads it. */
export function readReportFile(name: string, text: string): { format: "md" | "json"; envelope: SignedEnvelope | null; body: string | null } {
  if (name.toLowerCase().endsWith(".md")) {
    const { body, envelope } = parseMarkdown(text);
    return { format: "md", envelope, body: envelope ? body : null };
  }
  return { format: "json", envelope: safeParse(text) as SignedEnvelope | null, body: null };
}

/** Verifies a report file exactly like `blocra verify <file>`. */
export async function verifyReportFile(
  name: string,
  text: string,
  trusted: string | string[] | null | undefined,
  subtle?: SubtleCrypto | null,
): Promise<VerifyResult> {
  const { format, envelope, body } = readReportFile(name, text);
  if (!envelope) {
    return { ok: false, unsupported: false, format, envelope: null, report: null, sha256: null, reasons: ["No BlocRA signature found"] };
  }
  const check = await verifyEnvelope(envelope, trusted, subtle);
  const result: VerifyResult = { ...check, format };
  if (check.ok && body !== null && !bodyMatchesReport(body, check.report, envelope.attestation)) {
    result.ok = false;
    result.reasons = [...result.reasons, "The Markdown text was edited after signing (it no longer matches the signed report)"];
  }
  return result;
}
