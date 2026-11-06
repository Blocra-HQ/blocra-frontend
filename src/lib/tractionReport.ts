// Stellar traction report: types, number formatting and the Markdown export.
//
// The report itself is computed by the backend (GET /api/reports/traction);
// everything here only formats the figures it returns. Nothing is estimated:
// a missing figure is printed as "—".

export interface Kpi {
  value: number | null;
  previous: number | null;
  change_pct: number | null;
}

export interface TractionReport {
  version: number;
  type: string;
  subject: { id: string; kind: "contract" | "asset"; label: string };
  network: string;
  generated_at: string;
  period: {
    days: number;
    from: string;
    to: string;
    previous_from: string;
    previous_to: string;
    has_previous: boolean;
  };
  kpis: {
    active_accounts: Kpi;
    new_accounts: { value: number | null; reliable: boolean };
    calls: Kpi;
    failed_pct: Kpi;
    volume: Kpi | null;
    calls_per_account: number | null;
  };
  daily: { day: string; active_accounts: number; calls: number; failed: number; volume: number | null }[];
  retention: { returning_accounts: number | null; previous_active: number | null; returning_pct: number | null };
  quality: {
    top10_share_pct: number | null;
    bot_like_accounts: number | null;
    bot_like_share_pct: number | null;
    bot_threshold_calls_per_day: number;
    top_accounts: { account: string; calls: number; share_pct: number; bot_like: boolean }[];
    /** Assets only: payments an account sent to itself (arbitrage loops), excluded from volume. */
    self_payments?: number | null;
    self_payment_share_pct?: number | null;
  };
  functions: { function: string; calls: number; failed: number; failed_pct: number }[];
  ecosystem: {
    rank: number | null;
    of: number | null;
    percentile: number | null;
    median_failed_pct: number | null;
    metric: string;
  } | null;
  asset_snapshot: {
    holders: number | null;
    supply_in_accounts: number | null;
    supply_in_contracts: number | null;
    supply_in_liquidity_pools: number | null;
    contract_holders: number | null;
    liquidity_pools: number | null;
    sac_contract_id: string | null;
    toml: string | null;
    as_of: string;
  } | null;
  findings: string[];
  coverage: {
    collection_started: string | null;
    ledgers_collected: number | null;
    ledger_from: number | null;
    ledger_to: number | null;
    completeness_pct: number | null;
    days_covered: number | null;
    hours_covered?: number | null;
    expected_ledgers: number | null;
    full_period: boolean;
  };
  methodology: string[];
}

export interface ReportSubject {
  id: string;
  label: string;
  kind: "contract" | "asset";
  active_accounts: number;
  calls: number;
  volume: number | null;
}

/** Optional AI-written text; only exported when the user added it. */
export interface ReportExtras {
  aiSummary?: string | null;
}

export const DASH = "—";

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

export function fmtInt(n: number | null | undefined): string {
  return isNum(n) ? Math.round(n).toLocaleString("en-US") : DASH;
}

export function fmtNum(n: number | null | undefined, maxDigits = 2): string {
  return isNum(n) ? n.toLocaleString("en-US", { maximumFractionDigits: maxDigits }) : DASH;
}

export function fmtPct(n: number | null | undefined): string {
  if (!isNum(n)) return DASH;
  // Tiny but non-zero shares would otherwise round to a misleading "0%".
  if (n > 0 && n < 0.05) return "<0.1%";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

/** "+12.5%" / "-3%" vs the previous period, or "—" without one. */
export function fmtChange(n: number | null | undefined): string {
  if (!isNum(n)) return DASH;
  return `${n > 0 ? "+" : ""}${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

/** Date-time as "2026-11-06 08:35 UTC". */
export function fmtUtc(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function shortId(id: string, head = 6, tail = 4): string {
  return id.length > head + tail + 1 ? `${id.slice(0, head)}…${id.slice(-tail)}` : id;
}

export function explorerBase(network: string): string {
  return network === "testnet"
    ? "https://stellar.expert/explorer/testnet"
    : "https://stellar.expert/explorer/public";
}

export const accountUrl = (network: string, account: string) => `${explorerBase(network)}/account/${account}`;
export const contractUrl = (network: string, id: string) => `${explorerBase(network)}/contract/${id}`;

/** Label of the activity measure: contract calls or asset payments. */
export const activityLabel = (r: TractionReport) => (r.subject.kind === "contract" ? "Contract calls" : "Payments");
/** Lower-case noun for one unit of activity: "calls" or "payments". */
export const activityNoun = (r: TractionReport) => (r.subject.kind === "contract" ? "calls" : "payments");

/** Rows of the retention & quality table, shared by the page, Markdown and PDF. */
export function qualityRows(r: TractionReport, opts: { dash?: string; ge?: string } = {}): [string, string][] {
  const dash = opts.dash ?? DASH;
  const ge = opts.ge ?? "≥";
  const q = r.quality;
  const rows: [string, string][] = [
    [
      "Returning accounts (active in previous period too)",
      r.retention.returning_pct == null
        ? `${dash} (needs a previous period)`
        : `${fmtPct(r.retention.returning_pct)} (${fmtInt(r.retention.returning_accounts)} of ${fmtInt(r.retention.previous_active)})`,
    ],
    ["Top-10 accounts' share of activity", fmtPct(q.top10_share_pct)],
    [`Bot-like accounts (${ge} ${fmtInt(q.bot_threshold_calls_per_day)} ${activityNoun(r)} on one day)`, fmtInt(q.bot_like_accounts)],
    ["Bot-like share of activity", fmtPct(q.bot_like_share_pct)],
  ];
  if (r.subject.kind === "asset" && q.self_payment_share_pct != null) {
    rows.push(["Self-payments (to own account, excluded from volume)", `${fmtPct(q.self_payment_share_pct)} (${fmtInt(q.self_payments ?? 0)})`]);
  }
  return rows;
}

export interface ScorecardRow {
  label: string;
  value: string;
  change: string;
  changePct: number | null;
  /** True when a rise is bad (failure rate). */
  invert?: boolean;
  note?: string;
}

/** The scorecard rows shared by the page, Markdown and PDF. */
export function scorecard(r: TractionReport): ScorecardRow[] {
  const k = r.kpis;
  const kpi = (label: string, x: Kpi | null, fmt: (n: number | null) => string, invert = false): ScorecardRow => ({
    label,
    value: x ? fmt(x.value) : DASH,
    change: x ? fmtChange(x.change_pct) : DASH,
    changePct: x?.change_pct ?? null,
    invert,
  });
  return [
    kpi("Active accounts", k.active_accounts, fmtInt),
    {
      label: "New accounts",
      value: fmtInt(k.new_accounts?.value),
      change: DASH,
      changePct: null,
      note: k.new_accounts?.reliable ? undefined : "insufficient history",
    },
    kpi(activityLabel(r), k.calls, fmtInt),
    kpi("Failure rate", k.failed_pct, fmtPct, true),
    k.volume
      ? kpi("Volume (asset units)", k.volume, (n) => fmtNum(n))
      : { label: "Volume (asset units)", value: DASH, change: DASH, changePct: null, note: "not applicable" },
    { label: `${activityLabel(r)} per account`, value: fmtNum(k.calls_per_account, 1), change: DASH, changePct: null },
  ];
}

export const reportTitle = (r: TractionReport) =>
  `Traction report: ${r.subject.label} ${r.period.from}–${r.period.to}`;

export const reportFileBase = (r: TractionReport) =>
  `blocra-traction-${r.subject.id.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 40)}-${r.period.from}_${r.period.to}`;

/** "5.2 hours" under a day, otherwise "3.4 days". */
export function heldTime(c: TractionReport["coverage"]): string {
  const days = c.days_covered ?? 0;
  if (days < 1) return `${fmtNum(c.hours_covered ?? days * 24, 1)} hours`;
  return `${fmtNum(days, 1)} days`;
}

export function partialDataNote(r: TractionReport): string | null {
  if (r.coverage.full_period) return null;
  const c = r.coverage;
  return (
    `Partial data: BlocRA holds ${heldTime(c)} of the ${r.period.days}-day period ` +
    `(${fmtPct(c.completeness_pct)} of ledgers in that span), collected since ${c.collection_started ?? DASH}. ` +
    `All figures cover only the collected time` +
    (r.period.has_previous ? "." : ", and there is no previous period to compare with.")
  );
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.map(cell).join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");
}

/** The report as a Markdown document, following the same template as the page. */
export function reportToMarkdown(r: TractionReport, extras: ReportExtras = {}): string {
  const out: string[] = [];
  const net = r.network;
  const push = (...lines: string[]) => out.push(...lines);

  // 1. Header
  push(
    "# Stellar Traction Report",
    "",
    `**${r.subject.label}**`,
    "",
    table(
      ["Field", "Value"],
      [
        ["Subject", `\`${r.subject.id}\``],
        ["Kind", r.subject.kind === "contract" ? "Soroban contract" : "Asset"],
        ["Network", `Stellar ${net}`],
        ["Period", `${r.period.from} – ${r.period.to} (UTC, ${r.period.days} days)`],
        ["Generated", fmtUtc(r.generated_at)],
        ["Source", "BlocRA, from Stellar ledgers it collected"],
      ],
    ),
    "",
  );

  // 2. Partial data
  const partial = partialDataNote(r);
  if (partial) push(`> **⚠ ${partial}**`, "");

  // 3. Scorecard
  push("## Scorecard", "");
  push(
    table(
      ["Metric", "Value", r.period.has_previous ? `Δ vs ${r.period.previous_from} – ${r.period.previous_to}` : "Δ vs previous period"],
      scorecard(r).map((s) => [s.label, s.note ? `${s.value} (${s.note})` : s.value, s.change]),
    ),
    "",
  );

  // 4. Findings
  push("## Key findings", "");
  if (r.findings.length) r.findings.forEach((f) => push(`- ${f}`));
  else push(`- ${DASH}`);
  push("");

  if (extras.aiSummary?.trim()) {
    push("## AI-written summary (from the figures above)", "", extras.aiSummary.trim(), "");
  }

  // 5. Activity
  push("## Activity", "");
  if (r.daily.length) {
    push(
      table(
        ["Day (UTC)", "Active accounts", activityLabel(r), "Failed", ...(r.kpis.volume ? ["Volume"] : [])],
        r.daily.map((d) => [
          d.day,
          fmtInt(d.active_accounts),
          fmtInt(d.calls),
          fmtInt(d.failed),
          ...(r.kpis.volume ? [fmtNum(d.volume)] : []),
        ]),
      ),
    );
  } else push("No activity recorded in this period.");
  push("");

  // 6. Retention & quality
  const q = r.quality;
  push("## Retention & user quality", "");
  push(
    table(
      ["Measure", "Value"],
      qualityRows(r),
    ),
    "",
  );
  if (q.top_accounts.length) {
    push("Top accounts:", "");
    push(
      table(
        ["Account", activityLabel(r), "Share", "Bot-like"],
        q.top_accounts.slice(0, 5).map((a) => [
          `[${shortId(a.account)}](${accountUrl(net, a.account)})`,
          fmtInt(a.calls),
          fmtPct(a.share_pct),
          a.bot_like ? "yes" : "no",
        ]),
      ),
      "",
    );
  }

  // 7. Contract functions / asset snapshot
  if (r.subject.kind === "contract") {
    push("## Contract functions", "");
    if (r.functions.length) {
      push(
        table(
          ["Function", "Calls", "Failed", "Failure rate"],
          r.functions.map((f) => [`\`${f.function}\``, fmtInt(f.calls), fmtInt(f.failed), fmtPct(f.failed_pct)]),
        ),
      );
    } else push("No function calls recorded in this period.");
    push("");
  } else {
    push("## Asset snapshot", "");
    const a = r.asset_snapshot;
    if (a) {
      push(
        table(
          ["Measure", "Value"],
          [
            ["Holders (accounts with a trustline)", fmtInt(a.holders)],
            ["Supply in accounts", fmtNum(a.supply_in_accounts)],
            ["Supply in contracts", fmtNum(a.supply_in_contracts)],
            ["Supply in liquidity pools", fmtNum(a.supply_in_liquidity_pools)],
            ["Contracts holding the asset", fmtInt(a.contract_holders)],
            ["Liquidity pools", fmtInt(a.liquidity_pools)],
            ["Stellar Asset Contract", a.sac_contract_id ? `[\`${a.sac_contract_id}\`](${contractUrl(net, a.sac_contract_id)})` : DASH],
            ["stellar.toml", a.toml ? `<${a.toml}>` : DASH],
          ],
        ),
        "",
        `Snapshot from Horizon at ${fmtUtc(a.as_of)}.`,
      );
    } else push(`No Horizon snapshot for this asset${r.subject.id === "XLM" ? " (XLM is the native asset and has no issuer record)" : ""}.`);
    push("");
  }

  // 8. Ecosystem
  push("## Ecosystem position", "");
  const e = r.ecosystem;
  const peers = r.subject.kind === "contract" ? "contracts" : "assets";
  if (e && e.rank != null) {
    push(
      table(
        ["Measure", "Value"],
        [
          [`Rank by ${e.metric.replace(/_/g, " ")}`, `#${fmtInt(e.rank)} of ${fmtInt(e.of)} ${peers}`],
          ["Percentile", fmtNum(e.percentile, 1)],
          [`Median failure rate of peer ${peers}`, fmtPct(e.median_failed_pct)],
        ],
      ),
    );
  } else push(`${DASH} (not enough peers in this period)`);
  push("");

  // 9. Coverage & methodology
  const c = r.coverage;
  push("## Coverage & methodology", "");
  push(
    table(
      ["Measure", "Value"],
      [
        ["Ledger range", c.ledger_from != null && c.ledger_to != null ? `${fmtInt(c.ledger_from)} – ${fmtInt(c.ledger_to)}` : DASH],
        ["Ledgers collected", fmtInt(c.ledgers_collected)],
        ["Expected ledgers in period", fmtInt(c.expected_ledgers)],
        ["Completeness", fmtPct(c.completeness_pct)],
        ["Time covered", `${heldTime(c)} of ${r.period.days} days`],
        ["Collection started", c.collection_started ?? DASH],
      ],
    ),
    "",
  );
  r.methodology.forEach((m) => push(`- ${m}`));
  push("");

  // 10. Verification
  push(
    "## Verification",
    "",
    "This file is verifiable: its sha256 hash can be recorded in BlocRA's report registry on Stellar. " +
      "Upload this exact file at BlocRA → Verify Report (/verify-report) to check that it was published and has not been modified.",
    "",
  );

  return out.join("\n");
}

/** Raw JSON export (with the AI summary only when the user added one). */
export function reportToJson(r: TractionReport, extras: ReportExtras = {}): string {
  const body = extras.aiSummary?.trim() ? { ...r, ai_summary: extras.aiSummary.trim() } : r;
  return JSON.stringify(body, null, 2);
}
