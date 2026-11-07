// Types for the vendored blocra-cli renderer (markdown.js).
import type { Attestation, SignedEnvelope } from "./types";

export function utf8ToBase64(text: string): string;
export function base64ToUtf8(encoded: string): string;
export function fmtInt(n: unknown): string;
export function fmtNum(n: unknown, d?: number): string;
export function fmtPct(n: unknown): string;
export function fmtChange(n: unknown): string;
/** The report body (everything except the embedded attestation). */
export function renderBody(report: unknown, attestation?: Attestation | null): string;
/** Full verifiable Markdown file: body plus the embedded signed envelope. */
export function renderMarkdown(envelope: SignedEnvelope): string;
/** Splits a Markdown report into its body and embedded envelope (or null). */
export function parseMarkdown(text: string): { body: string; envelope: SignedEnvelope | null };
/** True when the body is exactly what renderBody gives for the signed report. */
export function bodyMatchesReport(body: string, report: unknown, attestation?: Attestation | null): boolean;
