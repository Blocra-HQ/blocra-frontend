// The website's renderer for verifiable reports. It must stay byte-identical to
// the blocra CLI's (Rust, blocra-cli src/markdown.rs): both reproduce the golden
// files in blocra-cli test/fixtures, and `npm run check:blocra` fails otherwise.
// Change the layout in both renderers and regenerate those files together.

// Markdown rendering of a traction report.
//
// The signed envelope is embedded at the end of the file in an HTML comment,
// so a single .md file can be shared and still verified: `blocra verify`
// checks the signature, re-renders the body from the signed report and
// compares it with the file, so an edited figure is caught even though the
// envelope itself is intact.
//
// This module has no Node-only dependencies so the BlocRA website can use the
// exact same renderer (it is exported as "blocra/markdown"): a report exported
// from the website and one written by `blocra report` are byte-identical.

const DASH = "—";
const MARKER = "blocra-attestation:";

// Base64 of UTF-8 text. Node's Buffer when present, otherwise btoa/atob with
// TextEncoder/TextDecoder (browsers); both give identical output.
export function utf8ToBase64(text) {
  if (typeof Buffer !== "undefined") return Buffer.from(text, "utf8").toString("base64");
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function base64ToUtf8(encoded) {
  if (typeof Buffer !== "undefined") return Buffer.from(encoded, "base64").toString("utf8");
  const bin = atob(encoded.replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const isNum = (n) => typeof n === "number" && Number.isFinite(n);
export const fmtInt = (n) => (isNum(n) ? Math.round(n).toLocaleString("en-US") : DASH);
export const fmtNum = (n, d = 2) => (isNum(n) ? n.toLocaleString("en-US", { maximumFractionDigits: d }) : DASH);
export function fmtPct(n) {
  if (!isNum(n)) return DASH;
  if (n > 0 && n < 0.05) return "<0.1%";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}
export function fmtChange(n) {
  if (!isNum(n)) return DASH;
  return `${n > 0 ? "+" : ""}${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}
const short = (id) => (id && id.length > 16 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id ?? DASH);
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

function table(head, rows) {
  return [
    `| ${head.map(cell).join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");
}

function heldTime(c) {
  const days = c.days_covered ?? 0;
  if (days < 1) return `${fmtNum(c.hours_covered ?? days * 24, 1)} hours`;
  return `${fmtNum(days, 1)} days`;
}

const EXPLORERS = {
  stellar: { account: "https://stellar.expert/explorer/public/account/", contract: "https://stellar.expert/explorer/public/contract/" },
};

/** The report body (everything except the embedded attestation). */
export function renderBody(report, attestation) {
  const r = report;
  const kind = r.subject?.kind;
  const noun = kind === "contract" ? "calls" : "payments";
  const Noun = kind === "contract" ? "Contract calls" : "Payments";
  const explorer = EXPLORERS[r.chain ?? "stellar"];
  const out = [];
  const push = (...lines) => out.push(...lines);

  push(`# Traction Report: ${r.subject?.label ?? r.subject?.id}`, "");
  push(
    table(["Field", "Value"], [
      ["Subject", `\`${r.subject?.id}\``],
      ["Kind", kind === "contract" ? "Smart contract" : "Asset"],
      ["Chain", `${r.chain ?? "stellar"} (${r.network ?? "mainnet"})`],
      ["Period", `${r.period?.from} – ${r.period?.to} (UTC, ${r.period?.days} days)`],
      ["Generated", r.generated_at],
      ["Method", r.method_version ?? DASH],
    ]),
    "",
  );

  if (!r.coverage?.full_period) {
    push(
      `> **Partial data:** BlocRA holds ${heldTime(r.coverage ?? {})} of the ${r.period?.days}-day period ` +
        `(${fmtPct(r.coverage?.completeness_pct)} of ledgers in that span), collected since ${r.coverage?.collection_started ?? DASH}. ` +
        `Figures cover only the collected time` + (r.period?.has_previous ? "." : ", and there is no previous period to compare with."),
      "",
    );
  }

  const k = r.kpis ?? {};
  push("## Scorecard", "");
  const rows = [
    ["Active accounts", fmtInt(k.active_accounts?.value), fmtChange(k.active_accounts?.change_pct)],
    ["New accounts", k.new_accounts?.reliable === false ? `${fmtInt(k.new_accounts?.value)} (insufficient history)` : fmtInt(k.new_accounts?.value), DASH],
    [Noun, fmtInt(k.calls?.value), fmtChange(k.calls?.change_pct)],
    ["Failure rate", fmtPct(k.failed_pct?.value), fmtChange(k.failed_pct?.change_pct)],
  ];
  if (k.volume) rows.push(["Volume (asset units)", fmtNum(k.volume.value), fmtChange(k.volume.change_pct)]);
  rows.push([`${Noun} per account`, fmtNum(k.calls_per_account, 1), DASH]);
  push(table(["Metric", "Value", "Change vs previous period"], rows), "");

  push("## Key findings", "", ...(r.findings ?? []).map((f) => `- ${f}`), "");

  push("## Activity", "");
  const vol = kind === "asset";
  push(
    table(
      ["Day (UTC)", "Active accounts", Noun, "Failed", ...(vol ? ["Volume"] : [])],
      (r.daily ?? []).map((d) => [d.day, fmtInt(d.active_accounts), fmtInt(d.calls), fmtInt(d.failed), ...(vol ? [fmtNum(d.volume)] : [])]),
    ),
    "",
  );

  const q = r.quality ?? {};
  push("## User quality", "");
  const qrows = [
    ["Returning accounts", r.retention?.returning_pct == null ? `${DASH} (needs a previous period)` : `${fmtPct(r.retention.returning_pct)} (${fmtInt(r.retention.returning_accounts)} of ${fmtInt(r.retention.previous_active)})`],
    ["Top-10 accounts' share", fmtPct(q.top10_share_pct)],
    [`Automated accounts (≥ ${fmtInt(q.bot_threshold_calls_per_day)} ${noun} on one day)`, fmtInt(q.bot_like_accounts)],
    ["Automated share of activity", fmtPct(q.bot_like_share_pct)],
  ];
  if (vol && q.self_payment_share_pct != null) qrows.push(["Self-payments (excluded from volume)", fmtPct(q.self_payment_share_pct)]);
  if (kind === "contract" && q.relayed_share_pct != null) {
    qrows.push(["Calls submitted by a relayer or sponsor (counted for the signing user)", `${fmtPct(q.relayed_share_pct)} (${fmtInt(q.relayed_calls)})`]);
    qrows.push(["Smart-wallet (contract) accounts", fmtInt(q.smart_wallet_accounts)]);
  }
  const dr = r.declared_relayers;
  if (dr?.accounts?.length) {
    qrows.push(["Declared relayers (excluded from account counts)", dr.accounts.map(short).join(", ")]);
    qrows.push(["Calls from declared relayers without user authorization", fmtInt(dr.calls_without_user_auth ?? 0)]);
  }
  push(table(["Measure", "Value"], qrows), "");
  if (q.top_accounts?.length) {
    push(
      table(
        ["Top account", Noun, "Share", "Automated"],
        q.top_accounts.map((a) => [explorer ? `[${short(a.account)}](${explorer.account}${a.account})` : short(a.account), fmtInt(a.calls), fmtPct(a.share_pct), a.bot_like ? "yes" : "no"]),
      ),
      "",
    );
  }

  if (kind === "contract" && r.functions?.length) {
    push("## Contract functions", "", table(["Function", "Calls", "Failure rate"], r.functions.map((f) => [`\`${f.function}\``, fmtInt(f.calls), fmtPct(f.failed_pct)])), "");
  }
  if (r.asset_snapshot) {
    const a = r.asset_snapshot;
    push(
      "## Asset snapshot",
      "",
      table(["Measure", "Value"], [
        ["Holders", fmtInt(a.holders)],
        ["Supply in accounts", fmtNum(a.supply_in_accounts)],
        ["Supply in contracts", fmtNum(a.supply_in_contracts)],
        ["Supply in liquidity pools", fmtNum(a.supply_in_liquidity_pools)],
      ]),
      "",
    );
  }

  const e = r.ecosystem ?? {};
  push("## Ecosystem position", "", table(["Measure", "Value"], [
    ["Rank by active accounts", e.rank != null ? `#${e.rank} of ${fmtInt(e.of)}` : DASH],
    ["Median failure rate of peers", fmtPct(e.median_failed_pct)],
  ]), "");

  const c = r.coverage ?? {};
  push("## Coverage and methodology", "", table(["Measure", "Value"], [
    ["Ledger range", c.ledger_from != null ? `${fmtInt(c.ledger_from)} – ${fmtInt(c.ledger_to)}` : DASH],
    ["Ledgers collected", fmtInt(c.ledgers_collected)],
    ["Completeness", fmtPct(c.completeness_pct)],
    ["Time covered", `${heldTime(c)} of ${r.period?.days} days`],
  ]), "", ...(r.methodology ?? []).map((m) => `- ${m}`), "");

  push("## Verification", "");
  if (attestation) {
    push(
      table(["Field", "Value"], [
        ["Signed by", `\`${attestation.signer}\` (BlocRA)`],
        ["Signature", "Ed25519 over the embedded report"],
        ["Report sha256", `\`${attestation.payload_sha256}\``],
        ["Signed at", attestation.signed_at],
      ]),
      "",
      "Check this file with `npx blocra verify <file>`. Any edit to the figures above breaks verification.",
    );
  } else {
    push("Unsigned report.");
  }
  return out.join("\n") + "\n";
}

/** Full Markdown file: body plus the embedded signed envelope. */
export function renderMarkdown(envelope) {
  const report = JSON.parse(envelope.report_json);
  const encoded = utf8ToBase64(JSON.stringify(envelope));
  return `${renderBody(report, envelope.attestation)}\n<!-- ${MARKER}${encoded} -->\n`;
}

/** Splits a Markdown report into its body and embedded envelope (or null). */
export function parseMarkdown(text) {
  const i = text.lastIndexOf(`<!-- ${MARKER}`);
  if (i < 0) return { body: text, envelope: null };
  const end = text.indexOf(" -->", i);
  const encoded = text.slice(i + 5 + MARKER.length, end);
  let envelope = null;
  try {
    envelope = JSON.parse(base64ToUtf8(encoded));
  } catch {
    envelope = null;
  }
  return { body: text.slice(0, i).replace(/\n$/, ""), envelope };
}


/**
 * True when a Markdown body (from parseMarkdown) is exactly what renderBody
 * produces for the signed report, i.e. the text was not edited after signing.
 */
export function bodyMatchesReport(body, report, attestation) {
  return body.replace(/\n+$/, "") === renderBody(report, attestation).replace(/\n$/, "");
}
