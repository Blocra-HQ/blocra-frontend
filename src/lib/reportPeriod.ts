// The time frame of a traction report, as the backend takes it: a range
// (today, 7d, 30d, 90d, 1y, all, ...) or custom from/to dates (UTC, both
// days included). Reports always cover whole UTC days.

export type ReportPeriod = { range: string } | { from: string; to: string };

export const PRESETS: { range: string; label: string }[] = [
  { range: "today", label: "Today" },
  { range: "7d", label: "7 days" },
  { range: "30d", label: "30 days" },
  { range: "90d", label: "90 days" },
  { range: "1y", label: "1 year" },
  { range: "all", label: "All time" },
];

export const DEFAULT_PERIOD: ReportPeriod = { range: "7d" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RANGE_RE = /^(all|today|yesterday|\d+[hdwmy])$/;

export const isCustom = (p: ReportPeriod): p is { from: string; to: string } => "from" in p;

/** Query parameters for the API and the page URL. */
export function periodParams(p: ReportPeriod): Record<string, string> {
  return isCustom(p) ? { from: p.from, to: p.to } : { range: p.range };
}

/** Reads ?range= or ?from=&to= (and the older ?days=N) from a URL. */
export function periodFromSearch(params: URLSearchParams): ReportPeriod {
  const from = params.get("from");
  const to = params.get("to");
  if (from && DATE_RE.test(from)) return { from, to: to && DATE_RE.test(to) ? to : from };
  const range = params.get("range")?.toLowerCase();
  if (range && RANGE_RE.test(range)) return { range };
  const days = Number(params.get("days"));
  if (Number.isInteger(days) && days > 0) return { range: `${days}d` };
  return DEFAULT_PERIOD;
}

/** Why a custom period can't be used, or null when it can. */
export function periodError(p: ReportPeriod, today = new Date().toISOString().slice(0, 10)): string | null {
  if (!isCustom(p)) return RANGE_RE.test(p.range) ? null : `Unknown period "${p.range}"`;
  if (!DATE_RE.test(p.from) || !DATE_RE.test(p.to)) return "Pick a start and an end date";
  if (p.from > p.to) return "The start date is after the end date";
  if (p.from > today) return "The start date is in the future";
  return null;
}

const fmtDay = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Words for headings: "the last 7 days", "all time", "1 Nov 2026 – 16 Nov 2026". */
export function periodLabel(p: ReportPeriod): string {
  if (isCustom(p)) return p.from === p.to ? fmtDay(p.from) : `${fmtDay(p.from)} – ${fmtDay(p.to)}`;
  const preset = PRESETS.find((x) => x.range === p.range);
  if (p.range === "all") return "all time";
  if (p.range === "today") return "today";
  if (p.range === "yesterday") return "yesterday";
  const m = /^(\d+)([hdwmy])$/.exec(p.range);
  if (!m) return preset?.label ?? p.range;
  const n = Number(m[1]);
  const unit = { h: "hour", d: "day", w: "week", m: "month", y: "year" }[m[2] as "h" | "d" | "w" | "m" | "y"];
  return n === 1 ? `the last ${unit}` : `the last ${n} ${unit}s`;
}

export const samePeriod = (a: ReportPeriod, b: ReportPeriod) =>
  JSON.stringify(periodParams(a)) === JSON.stringify(periodParams(b));
