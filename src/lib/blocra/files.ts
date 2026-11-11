// The report files the website exports, written exactly like `blocra report`
// (blocra-cli bin/blocra.js cmdReport), so web and CLI exports are the same
// bytes and both pass `blocra verify`.
import { renderBody, renderMarkdown } from "./markdown";
import type { SignedEnvelope } from "./types";

/** "blocra-stellar-cdl74rf5blyr-2026-11-06-7d", the CLI's file name. */
export function cliFileBase(report: { chain?: string; subject: { id: string }; period: { to: string; days: number } }): string {
  const chain = (report.chain ?? "stellar").toLowerCase();
  return `blocra-${chain}-${String(report.subject.id).split(":")[0].slice(0, 12).toLowerCase()}-${report.period.to}-${report.period.days}d`;
}

/** Verifiable Markdown: the CLI's renderMarkdown output. */
export const verifiableMarkdown = (envelope: SignedEnvelope): string => renderMarkdown(envelope);

/** Signed data: the envelope as the CLI writes <name>.json. */
export const envelopeJson = (envelope: SignedEnvelope): string => JSON.stringify(envelope, null, 2) + "\n";

/** Markdown of an unsigned report (same template, "Unsigned report." in place of the signature). */
export const unsignedMarkdown = (report: unknown): string => renderBody(report, null);
