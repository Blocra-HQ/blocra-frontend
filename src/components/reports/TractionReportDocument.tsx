// The traction report rendered as a printable document (white "paper" sheet),
// in the same section order as the PDF rendering and the CLI's Markdown.
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Copy, AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  type TractionReport,
  DASH,
  accountUrl,
  activityLabel,
  contractUrl,
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

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section className="mt-8 break-inside-avoid-page">
    <h2 className="text-lg font-semibold text-zinc-900 border-b border-zinc-200 pb-1 mb-3">
      <span className="text-zinc-400 mr-2">{n}.</span>
      {title}
    </h2>
    {children}
  </section>
);

const KV = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <table className="w-full text-sm">
    <tbody>
      {rows.map(([k, v]) => (
        <tr key={k} className="border-b border-zinc-100 last:border-0">
          <td className="py-1.5 pr-4 text-zinc-500">{k}</td>
          <td className="py-1.5 text-right font-medium tabular-nums text-zinc-900 break-all">{v}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

function DailyChart({ title, data, dataKey }: { title: string; data: TractionReport["daily"]; dataKey: "active_accounts" | "calls" }) {
  return (
    <div className="border border-zinc-200 rounded-md p-3">
      <p className="text-xs font-medium text-zinc-600 mb-2">{title} per day (UTC)</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="#eceef2" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={{ stroke: "#d4d4d8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(v: number) => [fmtInt(v), title]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey={dataKey} fill="#3b6fd8" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TractionReportDocument({
  report: r,
  aiSummary,
  verification,
  signed = false,
}: {
  report: TractionReport;
  aiSummary?: string | null;
  verification: React.ReactNode;
  /** The report came with BlocRA's signature (shown in the header). */
  signed?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const partial = partialDataNote(r);
  const net = r.network;
  const act = activityLabel(r);
  const peers = r.subject.kind === "contract" ? "contracts" : "assets";
  const q = r.quality;
  const c = r.coverage;
  const e = r.ecosystem;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(r.subject.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the id is still selectable */
    }
  };

  return (
    <article
      id="traction-report"
      className="traction-report bg-white text-zinc-800 rounded-lg shadow-sm border border-zinc-200 p-6 sm:p-10 print:shadow-none print:border-0 print:rounded-none print:p-0"
    >
      {/* 1. Header */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-zinc-900 pb-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-zinc-500">BlocRA · Stellar {net}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">Stellar Traction Report</h1>
          <p className="text-lg font-semibold text-zinc-800 mt-2">{r.subject.label}</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-zinc-600 break-all" data-testid="subject-id">{r.subject.id}</code>
            <button onClick={copyId} className="print:hidden text-zinc-400 hover:text-zinc-700" title="Copy id">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm mt-3">
            <dt className="text-zinc-500">Kind</dt>
            <dd>{r.subject.kind === "contract" ? "Soroban contract" : "Asset"}</dd>
            <dt className="text-zinc-500">Period</dt>
            <dd>
              {r.period.from} – {r.period.to} (UTC, {r.period.days} days)
            </dd>
            <dt className="text-zinc-500">Generated</dt>
            <dd>{fmtUtc(r.generated_at)}</dd>
            <dt className="text-zinc-500">Method</dt>
            <dd className="font-mono text-xs leading-5">{r.method_version ?? DASH}</dd>
            <dt className="text-zinc-500">Signature</dt>
            <dd data-testid="signature-status">
              {signed ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Signed by BlocRA (see Verification)
                </span>
              ) : (
                <span className="text-amber-700">Unsigned</span>
              )}
            </dd>
          </dl>
        </div>
        <img src="/blocra-logo.png" alt="BlocRA" className="h-14 w-14 rounded-full border border-zinc-200 shrink-0" />
      </header>

      {/* 2. Partial data */}
      {partial && (
        <div
          role="note"
          className="mt-5 flex gap-3 rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 print:[-webkit-print-color-adjust:exact]"
          data-testid="partial-banner"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p>{partial}</p>
        </div>
      )}

      {/* 3. Scorecard */}
      <Section n={1} title="Scorecard">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {scorecard(r).map((s) => {
            const up = s.changePct != null && s.changePct > 0;
            const down = s.changePct != null && s.changePct < 0;
            const good = s.invert ? down : up;
            const bad = s.invert ? up : down;
            return (
              <div key={s.label} className="border border-zinc-200 rounded-md p-3">
                <p className="text-xs text-zinc-500">{s.label}</p>
                <p className="text-2xl font-semibold tabular-nums text-zinc-900 mt-1">{s.value}</p>
                <p className="text-xs mt-1 flex items-center gap-1">
                  {s.changePct == null ? (
                    <span className="text-zinc-400">{s.note ?? (r.period.has_previous ? DASH : "no previous period")}</span>
                  ) : (
                    <span className={good ? "text-emerald-700" : bad ? "text-red-700" : "text-zinc-500"}>
                      {up ? <ArrowUpRight className="inline h-3.5 w-3.5" /> : down ? <ArrowDownRight className="inline h-3.5 w-3.5" /> : null}
                      {s.change} vs previous
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 4. Findings */}
      <Section n={2} title="Key findings">
        {r.findings.length ? (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {r.findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">{DASH}</p>
        )}
        {aiSummary && (
          <div className="mt-4 rounded-md border border-violet-300 bg-violet-50 p-4 print:[-webkit-print-color-adjust:exact]" data-testid="ai-summary">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 mb-2">
              AI-written summary (from the figures above)
            </p>
            <div className="text-sm whitespace-pre-wrap text-zinc-800">{aiSummary}</div>
          </div>
        )}
      </Section>

      {/* 5. Activity */}
      <Section n={3} title="Activity">
        {r.daily.length > 1 && (
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <DailyChart title="Active accounts" data={r.daily} dataKey="active_accounts" />
            <DailyChart title={act} data={r.daily} dataKey="calls" />
          </div>
        )}
        {r.daily.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 border-b border-zinc-200">
                <th className="text-left py-1.5 font-medium">Day (UTC)</th>
                <th className="text-right font-medium">Active accounts</th>
                <th className="text-right font-medium">{act}</th>
                <th className="text-right font-medium">Failed</th>
                {r.kpis.volume && <th className="text-right font-medium">Volume</th>}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {r.daily.map((d) => (
                <tr key={d.day} className="border-b border-zinc-100">
                  <td className="py-1.5">{d.day}</td>
                  <td className="text-right">{fmtInt(d.active_accounts)}</td>
                  <td className="text-right">{fmtInt(d.calls)}</td>
                  <td className="text-right">{fmtInt(d.failed)}</td>
                  {r.kpis.volume && <td className="text-right">{fmtNum(d.volume)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-zinc-500">No activity recorded in this period.</p>
        )}
        {r.daily.length === 1 && (
          <p className="text-xs text-zinc-500 mt-2">One day of data so far; a daily chart appears once there are two or more days.</p>
        )}
      </Section>

      {/* 6. Retention & quality */}
      <Section n={4} title="Retention & user quality">
        <div className="grid sm:grid-cols-2 gap-6">
          <KV
            rows={qualityRows(r)}
          />
          {q.top_accounts.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-zinc-200">
                  <th className="text-left py-1.5 font-medium">Top account</th>
                  <th className="text-right font-medium">{act}</th>
                  <th className="text-right font-medium">Share</th>
                  <th className="text-right font-medium">Bot-like</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {q.top_accounts.slice(0, 5).map((a) => (
                  <tr key={a.account} className="border-b border-zinc-100">
                    <td className="py-1.5">
                      <a href={accountUrl(net, a.account)} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-700 hover:underline">
                        {shortId(a.account)}
                      </a>
                    </td>
                    <td className="text-right">{fmtInt(a.calls)}</td>
                    <td className="text-right">{fmtPct(a.share_pct)}</td>
                    <td className="text-right">{a.bot_like ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* 7. Contract functions / asset snapshot */}
      {r.subject.kind === "contract" ? (
        <Section n={5} title="Contract functions">
          {r.functions.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-zinc-200">
                  <th className="text-left py-1.5 font-medium">Function</th>
                  <th className="text-right font-medium">Calls</th>
                  <th className="text-right font-medium">Failed</th>
                  <th className="text-right font-medium">Failure rate</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {r.functions.map((f) => (
                  <tr key={f.function} className="border-b border-zinc-100">
                    <td className="py-1.5 font-mono text-xs">{f.function}</td>
                    <td className="text-right">{fmtInt(f.calls)}</td>
                    <td className="text-right">{fmtInt(f.failed)}</td>
                    <td className="text-right">{fmtPct(f.failed_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-zinc-500">No function calls recorded in this period.</p>
          )}
        </Section>
      ) : (
        <Section n={5} title="Asset snapshot">
          {r.asset_snapshot ? (
            <>
              <KV
                rows={[
                  ["Holders (accounts with a trustline)", fmtInt(r.asset_snapshot.holders)],
                  ["Supply in accounts", fmtNum(r.asset_snapshot.supply_in_accounts)],
                  ["Supply in contracts", fmtNum(r.asset_snapshot.supply_in_contracts)],
                  ["Supply in liquidity pools", fmtNum(r.asset_snapshot.supply_in_liquidity_pools)],
                  ["Contracts holding the asset", fmtInt(r.asset_snapshot.contract_holders)],
                  ["Liquidity pools", fmtInt(r.asset_snapshot.liquidity_pools)],
                  [
                    "Stellar Asset Contract",
                    r.asset_snapshot.sac_contract_id ? (
                      <a href={contractUrl(net, r.asset_snapshot.sac_contract_id)} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-700 hover:underline">
                        {r.asset_snapshot.sac_contract_id}
                      </a>
                    ) : (
                      DASH
                    ),
                  ],
                  [
                    "stellar.toml",
                    r.asset_snapshot.toml ? (
                      <a href={r.asset_snapshot.toml} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1">
                        {r.asset_snapshot.toml} <ExternalLink className="h-3 w-3 print:hidden" />
                      </a>
                    ) : (
                      DASH
                    ),
                  ],
                ]}
              />
              <p className="text-xs text-zinc-500 mt-2">Snapshot from Horizon at {fmtUtc(r.asset_snapshot.as_of)}.</p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              No Horizon snapshot for this asset{r.subject.id === "XLM" ? " (XLM is the native asset and has no issuer record)" : ""}.
            </p>
          )}
        </Section>
      )}

      {/* 8. Ecosystem */}
      <Section n={6} title="Ecosystem position">
        {e && e.rank != null ? (
          <KV
            rows={[
              [`Rank by ${e.metric.replace(/_/g, " ")}`, `#${fmtInt(e.rank)} of ${fmtInt(e.of)} ${peers}`],
              ["Percentile", fmtNum(e.percentile, 1)],
              [`Median failure rate of peer ${peers}`, fmtPct(e.median_failed_pct)],
            ]}
          />
        ) : (
          <p className="text-sm text-zinc-500">{DASH} (not enough peers in this period)</p>
        )}
      </Section>

      {/* 9. Coverage & methodology */}
      <Section n={7} title="Coverage & methodology">
        <KV
          rows={[
            ["Ledger range", c.ledger_from != null && c.ledger_to != null ? `${fmtInt(c.ledger_from)} – ${fmtInt(c.ledger_to)}` : DASH],
            ["Ledgers collected", fmtInt(c.ledgers_collected)],
            ["Expected ledgers in period", fmtInt(c.expected_ledgers)],
            ["Completeness", fmtPct(c.completeness_pct)],
            ["Time covered", `${heldTime(c)} of ${r.period.days} days`],
            ["Collection started", c.collection_started ?? DASH],
          ]}
        />
        <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-600 mt-3">
          {r.methodology.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Section>

      {/* 10. Verification */}
      <section className="mt-8 border-t-2 border-zinc-900 pt-3 text-xs text-zinc-600" data-testid="verification">
        {verification}
      </section>
    </article>
  );
}
