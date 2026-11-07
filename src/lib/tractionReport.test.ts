// Tests for the traction report: on-screen/PDF helpers and the exports.
// Run: npx tsx src/lib/tractionReport.test.ts [extra-report.json ...]
// Fixtures are real /api/reports/traction responses: traction-*.json (the
// unsigned `report` field) and signed-*.json (signed envelopes, same as
// blocra-cli/test/fixtures).
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
  qualityRows,
  scorecard,
} from "./tractionReport";
import * as cli from "./blocra/markdown";
import { cliFileBase, envelopeJson, unsignedMarkdown, verifiableMarkdown } from "./blocra/files";
import type { SignedEnvelope } from "./blocra/types";

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const load = (p: string): TractionReport => {
  const raw = readJson(p);
  return raw.report_json ? JSON.parse(raw.report_json) : raw.report ?? raw;
};

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok - ${name}`);
};

test("formatters print numbers and dashes", () => {
  assert.equal(fmtInt(2528423), "2,528,423");
  assert.equal(fmtInt(null), "—");
  assert.equal(fmtNum(1955.073945), "1,955.07");
  assert.equal(fmtNum(NaN), "—");
  assert.equal(fmtPct(60.7), "60.7%");
  assert.equal(fmtPct(0.01), "<0.1%");
  assert.equal(fmtPct(undefined), "—");
  assert.equal(fmtChange(12.5), "+12.5%");
  assert.equal(fmtChange(-3), "-3%");
  assert.equal(fmtChange(null), "—");
});

test("screen formatters agree with the CLI renderer's", () => {
  for (const n of [0, 0.01, 0.049, 0.05, 1, 12.345, -3, 1955.073945, 2528423, null, undefined, NaN]) {
    assert.equal(fmtInt(n as number), cli.fmtInt(n));
    assert.equal(fmtNum(n as number), cli.fmtNum(n));
    assert.equal(fmtPct(n as number), cli.fmtPct(n));
    assert.equal(fmtChange(n as number), cli.fmtChange(n));
  }
});

const SECTIONS = ["## Scorecard", "## Key findings", "## Activity", "## User quality", "## Ecosystem position", "## Coverage and methodology", "## Verification"];

const unsigned = [
  join(here, "__fixtures__/traction-usdc.json"),
  join(here, "__fixtures__/traction-contract.json"),
  join(here, "__fixtures__/traction-xlm.json"),
  ...process.argv.slice(2),
];

for (const path of unsigned) {
  const r = load(path);
  const md = unsignedMarkdown(r);
  const tag = `${r.subject.id.slice(0, 12)} (${r.subject.kind})`;

  test(`${tag}: unsigned Markdown uses the CLI template and says it is unsigned`, () => {
    assert.ok(md.startsWith(`# Traction Report: ${r.subject.label}`));
    let at = -1;
    for (const s of SECTIONS) {
      const i = md.indexOf(s);
      assert.ok(i > at, `section "${s}" missing or out of order`);
      at = i;
    }
    assert.ok(md.trimEnd().endsWith("Unsigned report."));
    assert.ok(!md.includes("blocra-attestation:"));
    assert.ok(!/\bNaN\b|undefined|\[object/.test(md));
  });

  test(`${tag}: scorecard and quality rows formatted from the API`, () => {
    const rows = scorecard(r);
    assert.equal(rows[0].value, fmtInt(r.kpis.active_accounts.value));
    if (!r.period.has_previous) for (const row of rows) assert.equal(row.change, "—");
    for (const [, v] of qualityRows(r)) assert.ok(!/NaN|undefined|null/.test(v), v);
  });

  test(`${tag}: partial-data note matches coverage`, () => {
    const note = partialDataNote(r);
    if (r.coverage.full_period) assert.equal(note, null);
    else assert.ok(note!.includes(fmtPct(r.coverage.completeness_pct)));
  });
}

for (const name of ["signed-asset.json", "signed-contract.json", "signed-relayed.json"]) {
  const env: SignedEnvelope = readJson(join(here, "__fixtures__", name));
  const r: TractionReport = JSON.parse(env.report_json);

  test(`${name}: verifiable .md is the CLI's renderMarkdown output and round-trips`, () => {
    const md = verifiableMarkdown(env);
    assert.equal(md, cli.renderMarkdown(env));
    const parsed = cli.parseMarkdown(md);
    assert.deepEqual(parsed.envelope, env);
    assert.ok(cli.bodyMatchesReport(parsed.body, r, env.attestation));
    assert.ok(md.includes(`\`${env.attestation.payload_sha256}\``));
  });

  test(`${name}: signed .json is the envelope, as the CLI writes it`, () => {
    const json = envelopeJson(env);
    assert.equal(json, JSON.stringify(env, null, 2) + "\n");
    assert.equal(JSON.parse(json).report_json, env.report_json);
  });

  test(`${name}: file name matches the CLI`, () => {
    assert.match(cliFileBase(r), new RegExp(`^blocra-stellar-[a-z0-9]{1,12}-${r.period.to}-${r.period.days}d$`));
  });
}

test("relayer fields appear in the on-screen quality rows", () => {
  const r = load(join(here, "__fixtures__/signed-relayed.json"));
  const rows = Object.fromEntries(qualityRows(r));
  const relayed = rows["Calls submitted by a relayer or sponsor (counted for the signing user)"];
  assert.equal(relayed, `${fmtPct(r.quality.relayed_share_pct)} (${fmtInt(r.quality.relayed_calls)})`);
  assert.equal(rows["Smart-wallet (contract) accounts"], fmtInt(r.quality.smart_wallet_accounts));
  assert.match(rows["Declared relayers (excluded from account counts)"], /^GDYZ7L…Q5L7 \(0 of 1 active\)$/);
  assert.equal(rows["Calls from declared relayers without user authorization"], "0");
});

test("null-heavy report renders dashes", () => {
  const r = load(unsigned[0]);
  const blank: TractionReport = {
    ...r,
    kpis: { ...r.kpis, active_accounts: { value: null, previous: null, change_pct: null }, calls_per_account: null, volume: null },
    ecosystem: null,
    asset_snapshot: null,
    coverage: { ...r.coverage, ledger_from: null, ledger_to: null, completeness_pct: null },
  };
  assert.equal(scorecard(blank)[0].value, "—");
  const md = unsignedMarkdown(blank);
  assert.ok(md.includes("| Active accounts | — | — |"));
  assert.ok(md.includes("| Ledger range | — |"));
  assert.ok(!/NaN|undefined/.test(md));
});

console.log(`\n${passed} tests passed`);
