// PDF rendering of the Stellar traction report (same template as the page).
// Built with jsPDF's standard fonts, so text is reduced to Latin-1 (dashes,
// ellipses and symbols are spelled out).
//
// The PDF is a human-friendly rendering, not the verifiable artifact: it says
// so on every page and names the signed report's sha256 and signer, so a
// reader can ask for (or match it with) the .md / .json that
// `blocra verify` checks.
import { jsPDF } from "jspdf";
import type { Attestation } from "@/lib/blocra/types";
import {
  type ReportExtras,
  type TractionReport,
  activityLabel,
  fmtInt,
  fmtNum,
  fmtPct,
  fmtUtc,
  heldTime,
  partialDataNote,
  qualityRows,
  scorecard,
  shortId,
} from "@/lib/tractionReport";

const latin1 = (s: string) =>
  s
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/Δ/g, "Change")
    .replace(/≥/g, ">=")
    .replace(/[⚠✓]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "?");

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18;
const W = PAGE_W - 2 * M;

export async function loadLogo(src = "/blocra-logo.png"): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function reportToPdf(
  r: TractionReport,
  extras: ReportExtras = {},
  logo: string | null = null,
  attestation: Attestation | null = null,
): Blob {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setProperties({ title: latin1(`Stellar Traction Report - ${r.subject.label}`), creator: "BlocRA" });
  let y = M;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - M) {
      pdf.addPage();
      y = M;
    }
  };

  const text = (s: string, size = 10, style: "normal" | "bold" | "italic" = "normal", color = 30) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lines: string[] = pdf.splitTextToSize(latin1(s), W);
    const lh = size * 0.42;
    for (const line of lines) {
      ensure(lh);
      pdf.text(line, M, y + lh * 0.8);
      y += lh;
    }
    y += 1.5;
  };

  const heading = (s: string) => {
    ensure(14);
    y += 4;
    text(s, 13, "bold", 20);
    pdf.setDrawColor(200);
    pdf.line(M, y - 1, M + W, y - 1);
    y += 2;
  };

  const bullets = (items: string[]) => {
    for (const it of items) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const lines: string[] = pdf.splitTextToSize(latin1(it), W - 5);
      lines.forEach((line, i) => {
        ensure(4.4);
        if (i === 0) pdf.text("-", M, y + 3.4);
        pdf.text(line, M + 5, y + 3.4);
        y += 4.4;
      });
      y += 0.8;
    }
    y += 1;
  };

  /** Columns get the given width fractions; first column left-aligned, rest right-aligned. */
  const table = (head: string[], rows: string[][], fractions?: number[]) => {
    const fr = fractions ?? head.map((_, i) => (i === 0 ? 0.4 : 0.6 / (head.length - 1)));
    const widths = fr.map((f) => f * W);
    const row = (cells: string[], bold: boolean) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(9);
      const wrapped = cells.map((c, i) => pdf.splitTextToSize(latin1(c), widths[i] - 2) as string[]);
      const h = Math.max(...wrapped.map((w) => w.length)) * 3.9 + 2;
      ensure(h);
      if (bold) {
        pdf.setFillColor(242, 242, 245);
        pdf.rect(M, y, W, h, "F");
      }
      let x = M;
      wrapped.forEach((lines, i) => {
        lines.forEach((line, j) => {
          const ty = y + 4 + j * 3.9;
          if (i === 0) pdf.text(line, x + 1, ty);
          else pdf.text(line, x + widths[i] - 1, ty, { align: "right" });
        });
        x += widths[i];
      });
      y += h;
      pdf.setDrawColor(225);
      pdf.line(M, y, M + W, y);
    };
    pdf.setTextColor(30);
    row(head, true);
    rows.forEach((r) => row(r, false));
    y += 3;
  };

  // 1. Header
  if (logo) {
    try {
      pdf.addImage(logo, "PNG", M + W - 14, y, 14, 14);
    } catch {
      /* logo is decorative */
    }
  }
  text("Stellar Traction Report", 20, "bold", 15);
  text(r.subject.label, 13, "bold", 40);
  text(r.subject.id, 8.5, "normal", 90);
  y += 1;
  table(
    ["Field", "Value"],
    [
      ["Kind", r.subject.kind === "contract" ? "Soroban contract" : "Asset"],
      ["Network", `Stellar ${r.network}`],
      ["Period", `${r.period.from} to ${r.period.to} (UTC, ${r.period.days} days)`],
      ["Generated", fmtUtc(r.generated_at)],
      ["Method", r.method_version ?? "-"],
    ],
    [0.3, 0.7],
  );

  // 2. Partial data
  const partial = partialDataNote(r);
  if (partial) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    const lines: string[] = pdf.splitTextToSize(latin1(partial), W - 6);
    const h = lines.length * 4.1 + 4;
    ensure(h);
    pdf.setFillColor(255, 244, 214);
    pdf.setDrawColor(230, 170, 40);
    pdf.rect(M, y, W, h, "FD");
    pdf.setTextColor(110, 70, 0);
    lines.forEach((l, i) => pdf.text(l, M + 3, y + 5 + i * 4.1));
    y += h + 3;
    pdf.setTextColor(30);
  }

  // 3. Scorecard
  heading("Scorecard");
  table(
    ["Metric", "Value", "Change vs previous period"],
    scorecard(r).map((s) => [s.label, s.note ? `${s.value} (${s.note})` : s.value, s.change]),
    [0.4, 0.35, 0.25],
  );

  // 4. Findings
  heading("Key findings");
  bullets(r.findings.length ? r.findings : ["-"]);

  if (extras.aiSummary?.trim()) {
    heading("AI-written summary (from the figures above)");
    extras.aiSummary
      .trim()
      .split(/\n{2,}/)
      .forEach((p) => text(p.replace(/\*\*/g, ""), 10));
  }

  // 5. Activity
  heading("Activity");
  if (r.daily.length) {
    const vol = !!r.kpis.volume;
    table(
      ["Day (UTC)", "Active accounts", activityLabel(r), "Failed", ...(vol ? ["Volume"] : [])],
      r.daily.map((d) => [d.day, fmtInt(d.active_accounts), fmtInt(d.calls), fmtInt(d.failed), ...(vol ? [fmtNum(d.volume)] : [])]),
    );
  } else text("No activity recorded in this period.");

  // 6. Retention & quality
  const q = r.quality;
  heading("Retention & user quality");
  table(
    ["Measure", "Value"],
    qualityRows(r, { dash: "-", ge: ">=" }),
    [0.6, 0.4],
  );
  if (q.top_accounts.length) {
    table(
      ["Top account", activityLabel(r), "Share", "Bot-like"],
      q.top_accounts.slice(0, 5).map((a) => [shortId(a.account, 8, 6), fmtInt(a.calls), fmtPct(a.share_pct), a.bot_like ? "yes" : "no"]),
    );
  }

  // 7. Contract functions / asset snapshot
  if (r.subject.kind === "contract") {
    heading("Contract functions");
    if (r.functions.length) {
      table(
        ["Function", "Calls", "Failed", "Failure rate"],
        r.functions.map((f) => [f.function, fmtInt(f.calls), fmtInt(f.failed), fmtPct(f.failed_pct)]),
      );
    } else text("No function calls recorded in this period.");
  } else {
    heading("Asset snapshot");
    const a = r.asset_snapshot;
    if (a) {
      table(
        ["Measure", "Value"],
        [
          ["Holders (accounts with a trustline)", fmtInt(a.holders)],
          ["Supply in accounts", fmtNum(a.supply_in_accounts)],
          ["Supply in contracts", fmtNum(a.supply_in_contracts)],
          ["Supply in liquidity pools", fmtNum(a.supply_in_liquidity_pools)],
          ["Contracts holding the asset", fmtInt(a.contract_holders)],
          ["Liquidity pools", fmtInt(a.liquidity_pools)],
          ["Stellar Asset Contract", a.sac_contract_id ?? "-"],
          ["stellar.toml", a.toml ?? "-"],
        ],
        [0.4, 0.6],
      );
      text(`Snapshot from Horizon at ${fmtUtc(a.as_of)}.`, 8.5, "italic", 90);
    } else text("No Horizon snapshot for this asset.");
  }

  // 8. Ecosystem
  heading("Ecosystem position");
  const e = r.ecosystem;
  const peers = r.subject.kind === "contract" ? "contracts" : "assets";
  if (e && e.rank != null) {
    table(
      ["Measure", "Value"],
      [
        [`Rank by ${e.metric.replace(/_/g, " ")}`, `#${fmtInt(e.rank)} of ${fmtInt(e.of)} ${peers}`],
        ["Percentile", fmtNum(e.percentile, 1)],
        [`Median failure rate of peer ${peers}`, fmtPct(e.median_failed_pct)],
      ],
      [0.6, 0.4],
    );
  } else text("- (not enough peers in this period)");

  // 9. Coverage & methodology
  const c = r.coverage;
  heading("Coverage & methodology");
  table(
    ["Measure", "Value"],
    [
      ["Ledger range", c.ledger_from != null && c.ledger_to != null ? `${fmtInt(c.ledger_from)} - ${fmtInt(c.ledger_to)}` : "-"],
      ["Ledgers collected", fmtInt(c.ledgers_collected)],
      ["Expected ledgers in period", fmtInt(c.expected_ledgers)],
      ["Completeness", fmtPct(c.completeness_pct)],
      ["Time covered", `${heldTime(c)} of ${r.period.days} days`],
      ["Collection started", c.collection_started ?? "-"],
    ],
    [0.6, 0.4],
  );
  bullets(r.methodology);

  // 10. Verification
  heading("Verification");
  text(
    "This PDF is a rendering for reading and printing. It is not itself signed: the verifiable artifact is the " +
      "report's .md or .json file exported from BlocRA (or written by `blocra report`), checked with `blocra verify <file>` " +
      "or at BlocRA > Verify Report (/verify-report).",
    9.5,
  );
  if (attestation) {
    table(
      ["Field", "Value"],
      [
        ["Signed by (BlocRA)", attestation.signer],
        ["Signature", "Ed25519 over the signed report data"],
        ["Report sha256", attestation.payload_sha256],
        ["Method", attestation.method_version],
        ["Signed at", attestation.signed_at],
      ],
      [0.3, 0.7],
    );
  } else {
    text("Unsigned report: the server that produced it does not sign reports, so no signature can be checked.", 9.5, "bold");
  }

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(140);
    pdf.text(latin1(`BlocRA - Stellar Traction Report - ${r.subject.label}`), M, PAGE_H - 13);
    pdf.text(`Page ${i} of ${pages}`, PAGE_W - M, PAGE_H - 13, { align: "right" });
    pdf.setFontSize(6.5);
    pdf.text(
      attestation
        ? "Rendering only - the verifiable artifact is the signed .md/.json (blocra verify)."
        : "Rendering of an UNSIGNED report - it cannot be verified.",
      M,
      PAGE_H - 9.5,
    );
    if (attestation) {
      pdf.text(`sha256 ${attestation.payload_sha256}  signer ${attestation.signer}`, M, PAGE_H - 6.5);
    }
  }

  return pdf.output("blob");
}
