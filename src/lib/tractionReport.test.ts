// Tests for the traction report formatting and Markdown export.
// Run: npx tsx src/lib/tractionReport.test.ts [extra-report.json ...]
// Fixtures are real /api/reports/traction responses (the `report` field).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  type TractionReport,
  fmtChange,
  fmtInt,
  fmtNum,
  fmtPct,
  partialDataNote,
  reportToJson,
  reportToMarkdown,
  scorecard,
} from "./tractionReport";

const here = dirname(fileURLToPath(import.meta.url));
const load = (p: string): TractionReport => {
  const raw = JSON.parse(readFileSync(p, "utf8"));
  return raw.report ?? raw;
};

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok - ${name}`);
};

// Formatting
test("formatters print numbers and dashes", () => {
  assert.equal(fmtInt(2528423), "2,528,423");
  assert.equal(fmtInt(null), "—");
  assert.equal(fmtNum(1955.073945), "1,955.07");
  assert.equal(fmtNum(NaN), "—");
  assert.equal(fmtPct(60.7), "60.7%");
  assert.equal(fmtPct(undefined), "—");
  assert.equal(fmtChange(12.5), "+12.5%");
  assert.equal(fmtChange(-3), "-3%");
  assert.equal(fmtChange(null), "—");
});

const SECTIONS = [
  "# Stellar Traction Report",
  "## Scorecard",
  "## Key findings",
  "## Activity",
  "## Retention & user quality",
  "## Ecosystem position",
  "## Coverage & methodology",
  "## Verification",
];

const fixtures = [
  join(here, "__fixtures__/traction-usdc.json"),
  join(here, "__fixtures__/traction-contract.json"),
  join(here, "__fixtures__/traction-xlm.json"),
  ...process.argv.slice(2),
];

for (const path of fixtures) {
  const r = load(path);
  const md = reportToMarkdown(r);
  const tag = `${r.subject.id.slice(0, 12)} (${r.subject.kind})`;

  test(`${tag}: template sections in order`, () => {
    let at = -1;
    for (const s of [...SECTIONS.slice(0, 5), r.subject.kind === "contract" ? "## Contract functions" : "## Asset snapshot", ...SECTIONS.slice(5)]) {
      const i = md.indexOf(s);
      assert.ok(i > at, `section "${s}" missing or out of order`);
      at = i;
    }
  });

  test(`${tag}: header carries subject, network and period`, () => {
    assert.ok(md.includes(`\`${r.subject.id}\``));
    assert.ok(md.includes(r.subject.label));
    assert.ok(md.includes(`Stellar ${r.network}`));
    assert.ok(md.includes(`${r.period.from} – ${r.period.to}`));
  });

  test(`${tag}: no NaN / undefined / null leaks`, () => {
    assert.ok(!/\bNaN\b|undefined|\bnull\b|\[object/.test(md), md.match(/.{0,40}(NaN|undefined|null|\[object).{0,40}/)?.[0]);
  });

  test(`${tag}: scorecard numbers formatted from the API`, () => {
    assert.ok(md.includes(`| Active accounts | ${fmtInt(r.kpis.active_accounts.value)} |`));
    assert.ok(md.includes(`| Failure rate | ${fmtPct(r.kpis.failed_pct.value)} |`));
    if (!r.kpis.volume) assert.ok(md.includes("| Volume (asset units) | — (not applicable) |"));
    if (!r.kpis.new_accounts.reliable) assert.ok(md.includes("(insufficient history)"));
    if (!r.period.has_previous) {
      for (const row of scorecard(r)) assert.equal(row.change, "—");
    }
  });

  test(`${tag}: findings verbatim`, () => {
    for (const f of r.findings) assert.ok(md.includes(`- ${f}`), f);
  });

  test(`${tag}: partial-data note matches coverage`, () => {
    const note = partialDataNote(r);
    if (r.coverage.full_period) assert.equal(note, null);
    else {
      assert.ok(note && md.includes(`> **⚠ ${note}**`));
      assert.ok(note!.includes(fmtPct(r.coverage.completeness_pct)));
    }
  });

  test(`${tag}: top accounts link to stellar.expert`, () => {
    for (const a of r.quality.top_accounts.slice(0, 5)) {
      assert.ok(md.includes(`https://stellar.expert/explorer/public/account/${a.account}`));
    }
  });

  test(`${tag}: methodology bullets`, () => {
    for (const m of r.methodology) assert.ok(md.includes(`- ${m}`));
  });

  test(`${tag}: AI summary only when added`, () => {
    assert.ok(!md.includes("AI-written summary"));
    const withAi = reportToMarkdown(r, { aiSummary: "Usage grew." });
    assert.ok(withAi.includes("## AI-written summary (from the figures above)\n\nUsage grew."));
    assert.ok(withAi.indexOf("## AI-written summary") > withAi.indexOf("## Key findings"));
    assert.ok(!("ai_summary" in JSON.parse(reportToJson(r))));
    assert.equal(JSON.parse(reportToJson(r, { aiSummary: "x" })).ai_summary, "x");
  });

  test(`${tag}: deterministic`, () => {
    assert.equal(reportToMarkdown(r), md);
  });
}

// Nulls everywhere still render as dashes.
test("null-heavy report renders dashes", () => {
  const r = load(fixtures[0]);
  const blank: TractionReport = {
    ...r,
    kpis: {
      ...r.kpis,
      active_accounts: { value: null, previous: null, change_pct: null },
      calls_per_account: null,
      volume: null,
    },
    ecosystem: null,
    asset_snapshot: null,
    coverage: { ...r.coverage, ledger_from: null, ledger_to: null, completeness_pct: null },
  };
  const md = reportToMarkdown(blank);
  assert.ok(md.includes("| Active accounts | — | — |"));
  assert.ok(md.includes("| Ledger range | — |"));
  assert.ok(md.includes("not enough peers"));
  assert.ok(!/NaN|undefined|null/.test(md));
});

test("full-period report has no partial note and shows changes", () => {
  const r = load(fixtures[0]);
  const full: TractionReport = {
    ...r,
    period: { ...r.period, has_previous: true },
    kpis: { ...r.kpis, active_accounts: { value: 120, previous: 100, change_pct: 20 } },
    coverage: { ...r.coverage, full_period: true },
  };
  const md = reportToMarkdown(full);
  assert.ok(!md.includes("> **⚠"));
  assert.ok(md.includes("| Active accounts | 120 | +20% |"));
});

console.log(`\n${passed} tests passed`);
