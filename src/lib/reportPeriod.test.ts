// Tests for report time frames. Run: npx tsx src/lib/reportPeriod.test.ts
import assert from "node:assert/strict";
import { DEFAULT_PERIOD, periodError, periodFromSearch, periodLabel, periodParams, samePeriod } from "./reportPeriod";

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok - ${name}`);
};
const q = (s: string) => new URLSearchParams(s);

test("reads ranges, custom dates and the older days= from the URL", () => {
  assert.deepEqual(periodFromSearch(q("range=all")), { range: "all" });
  assert.deepEqual(periodFromSearch(q("range=1Y")), { range: "1y" });
  assert.deepEqual(periodFromSearch(q("from=2026-11-01&to=2026-11-10")), { from: "2026-11-01", to: "2026-11-10" });
  assert.deepEqual(periodFromSearch(q("from=2026-11-01")), { from: "2026-11-01", to: "2026-11-01" });
  assert.deepEqual(periodFromSearch(q("days=30")), { range: "30d" });
  assert.deepEqual(periodFromSearch(q("")), DEFAULT_PERIOD);
  assert.deepEqual(periodFromSearch(q("range=forever&days=-2")), DEFAULT_PERIOD, "junk falls back to the default");
});

test("builds API parameters", () => {
  assert.deepEqual(periodParams({ range: "90d" }), { range: "90d" });
  assert.deepEqual(periodParams({ from: "2026-11-01", to: "2026-11-02" }), { from: "2026-11-01", to: "2026-11-02" });
  assert.ok(samePeriod({ range: "7d" }, { range: "7d" }));
  assert.ok(!samePeriod({ range: "7d" }, { range: "30d" }));
});

test("labels periods in words", () => {
  assert.equal(periodLabel({ range: "7d" }), "the last 7 days");
  assert.equal(periodLabel({ range: "1y" }), "the last year");
  assert.equal(periodLabel({ range: "24h" }), "the last 24 hours");
  assert.equal(periodLabel({ range: "all" }), "all time");
  assert.equal(periodLabel({ range: "today" }), "today");
  assert.equal(periodLabel({ from: "2026-11-01", to: "2026-11-16" }), "1 Nov 2026 – 16 Nov 2026");
  assert.equal(periodLabel({ from: "2026-11-05", to: "2026-11-05" }), "5 Nov 2026");
});

test("validates custom periods", () => {
  const today = "2026-11-16";
  assert.equal(periodError({ from: "2026-11-01", to: "2026-11-16" }, today), null);
  assert.match(periodError({ from: "2026-11-10", to: "2026-11-01" }, today)!, /after the end/);
  assert.match(periodError({ from: "2026-12-01", to: "2026-12-02" }, today)!, /future/);
  assert.match(periodError({ from: "", to: "2026-11-02" }, today)!, /start and an end/);
  assert.equal(periodError({ range: "30d" }, today), null);
  assert.match(periodError({ range: "lots" }, today)!, /Unknown/);
});

console.log(`\n${passed} tests passed`);
