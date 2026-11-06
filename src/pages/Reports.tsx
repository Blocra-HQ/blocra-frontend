// Stellar traction reports: pick a contract or asset, render the backend's
// report as a printable document, export it (Markdown / PDF / JSON) and
// publish the exported file's hash to the BlocRA report registry on Stellar.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bot, Download, FileBarChart, Loader2, Printer, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TractionReportDocument } from "@/components/reports/TractionReportDocument";
import { TractionReportService } from "@/services/TractionReportService";
import { AIService } from "@/services/AIService";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { findReport, publishReport, sha256, toHex, type PublishedReport } from "@/integrations/report-registry";
import { EXPLORER_URL, STELLAR_NETWORK } from "@/integrations/stellar-network";
import {
  type ReportSubject,
  type TractionReport,
  fmtInt,
  reportFileBase,
  reportTitle,
  reportToJson,
  reportToMarkdown,
} from "@/lib/tractionReport";
import { loadLogo, reportToPdf } from "@/lib/tractionReportPdf";

type Kind = "contract" | "asset";
type Format = "md" | "pdf" | "json";

interface ExportedFile {
  format: Format;
  name: string;
  blob: Blob;
  hash: string;
  registry: { state: "checking" } | { state: "found"; report: PublishedReport } | { state: "missing" } | { state: "error"; message: string };
}

const FORMAT_LABEL: Record<Format, string> = { md: "Markdown", pdf: "PDF", json: "JSON" };
const kindOf = (id: string): Kind => (/^C[A-Z2-7]{55}$/.test(id.trim()) ? "contract" : "asset");
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const initialSubject = params.get("subject") ?? "";
  const [kind, setKind] = useState<Kind>(
    (params.get("kind") as Kind) || (initialSubject ? kindOf(initialSubject) : "contract"),
  );
  const [days, setDays] = useState<7 | 30>(params.get("days") === "30" ? 30 : 7);
  const [subjectId, setSubjectId] = useState(initialSubject);

  const [subjects, setSubjects] = useState<ReportSubject[]>([]);
  const [subjectsState, setSubjectsState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  const [report, setReport] = useState<TractionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiState, setAiState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  // Exported files are generated once per report state; the same Blob is
  // downloaded, hashed and published.
  const [files, setFiles] = useState<Partial<Record<Format, ExportedFile>>>({});
  const [lastFormat, setLastFormat] = useState<Format | null>(null);
  const [exporting, setExporting] = useState<Format | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ id: number; hash: string; txHash: string; format: Format } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { address, connectWallet, isConnecting } = useStellarWallet();

  useEffect(() => {
    let cancelled = false;
    setSubjectsState({ loading: true, error: null });
    TractionReportService.subjects(kind, days, 20)
      .then((s) => !cancelled && (setSubjects(s), setSubjectsState({ loading: false, error: null })))
      .catch((e) => !cancelled && (setSubjects([]), setSubjectsState({ loading: false, error: errText(e) })));
    return () => {
      cancelled = true;
    };
  }, [kind, days]);

  const resetExports = () => {
    setFiles({});
    setLastFormat(null);
    setPublishResult(null);
    setPublishError(null);
  };

  const generate = useCallback(
    async (id: string, d: 7 | 30) => {
      const subject = id.trim();
      if (!subject) return;
      setLoading(true);
      setError(null);
      setReport(null);
      setAiSummary(null);
      setAiState({ loading: false, error: null });
      resetExports();
      setParams({ subject, days: String(d), kind: kindOf(subject) }, { replace: true });
      try {
        setReport(await TractionReportService.traction(subject, d));
      } catch (e) {
        setError(errText(e));
      } finally {
        setLoading(false);
      }
    },
    [setParams],
  );

  // ?subject=&days= opens straight into a report.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !initialSubject) return;
    autoRan.current = true;
    generate(initialSubject, days);
  }, [initialSubject, days, generate]);

  const buildFile = async (format: Format): Promise<ExportedFile> => {
    if (!report) throw new Error("Generate a report first");
    const cached = files[format];
    if (cached) return cached;
    const extras = { aiSummary };
    const blob =
      format === "md"
        ? new Blob([reportToMarkdown(report, extras)], { type: "text/markdown;charset=utf-8" })
        : format === "json"
          ? new Blob([reportToJson(report, extras)], { type: "application/json" })
          : reportToPdf(report, extras, await loadLogo());
    const hash = toHex(await sha256(blob));
    return { format, name: `${reportFileBase(report)}.${format}`, blob, hash, registry: { state: "checking" } };
  };

  const exportFile = async (format: Format) => {
    setExporting(format);
    try {
      const file = await buildFile(format);
      setFiles((f) => ({ ...f, [format]: file }));
      setLastFormat(format);
      download(file.blob, file.name);
      if (file.registry.state === "checking") {
        findReport(file.blob)
          .then(({ report: found }) => (found ? ({ state: "found", report: found } as const) : ({ state: "missing" } as const)))
          .catch((e) => ({ state: "error", message: errText(e) }) as const)
          .then((registry) => setFiles((f) => (f[format]?.hash === file.hash ? { ...f, [format]: { ...f[format]!, registry } } : f)));
      }
    } catch (e) {
      setError(`Could not export ${FORMAT_LABEL[format]}: ${errText(e)}`);
    } finally {
      setExporting(null);
    }
  };

  const publish = async () => {
    const file = lastFormat ? files[lastFormat] : undefined;
    if (!report || !file) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const author = address || (await connectWallet());
      const result = await publishReport({
        author,
        file: file.blob,
        title: reportTitle(report),
        chain: "stellar",
        subject: report.subject.id,
      });
      setPublishResult({ ...result, format: file.format });
      findReport(file.blob)
        .then(({ report: found }) =>
          setFiles((f) => (found && f[file.format] ? { ...f, [file.format]: { ...f[file.format]!, registry: { state: "found", report: found } } } : f)),
        )
        .catch(() => undefined);
    } catch (e) {
      const msg = errText(e);
      setPublishError(
        /freighter|wallet|not installed|not connected/i.test(msg)
          ? `${msg} — install and unlock the Freighter extension, then try again.`
          : msg,
      );
    } finally {
      setPublishing(false);
    }
  };

  const addAiSummary = async () => {
    if (!report) return;
    setAiState({ loading: true, error: null });
    try {
      const { report: text } = await AIService.report({
        contractName: report.subject.label,
        contractAddress: report.subject.id,
        chain: `Stellar ${report.network}`,
        stats: report,
      });
      setAiSummary(text);
      resetExports();
      setAiState({ loading: false, error: null });
    } catch (e) {
      setAiState({ loading: false, error: `AI summary unavailable: ${errText(e)}` });
    }
  };

  const removeAiSummary = () => {
    setAiSummary(null);
    resetExports();
  };

  const last = lastFormat ? files[lastFormat] : undefined;

  const verification = useMemo(() => {
    if (!last) {
      return (
        <p>
          <span className="font-semibold text-zinc-800">Verification.</span> Export the report (Markdown, PDF or JSON) to get the
          file's sha256; publishing records that hash in BlocRA's report registry on Stellar {STELLAR_NETWORK}, and anyone holding the
          same file can check it at <span className="font-mono">/verify-report</span>.
        </p>
      );
    }
    const reg = last.registry;
    return (
      <div className="space-y-1">
        <p>
          <span className="font-semibold text-zinc-800">Verification.</span> {FORMAT_LABEL[last.format]} export{" "}
          <span className="font-mono">{last.name}</span>
        </p>
        <p className="font-mono break-all" data-testid="report-sha256">
          sha256 {last.hash}
        </p>
        <p>
          Registry ({STELLAR_NETWORK}):{" "}
          {reg.state === "checking" && "checking…"}
          {reg.state === "missing" && "not published yet."}
          {reg.state === "error" && `lookup failed (${reg.message}).`}
          {reg.state === "found" && (
            <>
              published as report #{reg.report.id} by <span className="font-mono">{reg.report.author.slice(0, 6)}…{reg.report.author.slice(-4)}</span> on{" "}
              {reg.report.publishedAt.toISOString().slice(0, 10)}
              {reg.report.revoked ? " (revoked)" : ""}.
            </>
          )}
        </p>
      </div>
    );
  }, [last]);

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white">
      <Header title="Reports" subtitle="Verifiable Stellar traction reports" />
      <main className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto print:p-0 print:max-w-none">
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5" /> Stellar traction report
            </CardTitle>
            <CardDescription>
              Independent usage figures for a Soroban contract or a Stellar asset — active and returning accounts, failure rate,
              concentration and bot share, ecosystem rank — computed by BlocRA from mainnet ledgers. Export it and publish its hash on
              Stellar so grant reviewers and investors can verify the copy they receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Subject kind">
                {(["contract", "asset"] as Kind[]).map((k) => (
                  <Button key={k} size="sm" variant={kind === k ? "default" : "ghost"} onClick={() => setKind(k)}>
                    {k === "contract" ? "Contract" : "Asset"}
                  </Button>
                ))}
              </div>
              <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Period">
                {([7, 30] as const).map((d) => (
                  <Button key={d} size="sm" variant={days === d ? "default" : "ghost"} onClick={() => setDays(d)}>
                    {d} days
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Most active {kind === "contract" ? "contracts" : "assets"} in the last {days} days
              </p>
              {subjectsState.loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : subjectsState.error ? (
                <p className="text-sm text-destructive">{subjectsState.error}</p>
              ) : subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-auto" data-testid="subject-list">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSubjectId(s.id)}
                      title={s.id}
                      className={`text-left rounded-md border px-3 py-1.5 text-xs hover:bg-muted ${subjectId === s.id ? "border-primary bg-primary/10" : ""}`}
                    >
                      <span className="font-medium">{s.label}</span>
                      <span className="text-muted-foreground"> · {fmtInt(s.active_accounts)} accounts</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="flex flex-col sm:flex-row gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                generate(subjectId, days);
              }}
            >
              <Input
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                placeholder={kind === "contract" ? "Contract id (C…)" : "XLM or CODE:ISSUER"}
                className="font-mono text-xs"
                data-testid="subject-input"
              />
              <Button type="submit" disabled={!subjectId.trim() || loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileBarChart className="h-4 w-4 mr-2" />}
                Generate report
              </Button>
            </form>
            {error && <p className="text-sm text-destructive" data-testid="report-error">{error}</p>}
          </CardContent>
        </Card>

        {report && (
          <Card className="print:hidden">
            <CardContent className="pt-6 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(["md", "pdf", "json"] as Format[]).map((f) => (
                  <Button key={f} variant="outline" size="sm" onClick={() => exportFile(f)} disabled={exporting !== null} data-testid={`export-${f}`}>
                    {exporting === f ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    {FORMAT_LABEL[f]}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
                </Button>
                {aiSummary ? (
                  <Button variant="ghost" size="sm" onClick={removeAiSummary}>
                    <Bot className="h-4 w-4 mr-2" /> Remove AI summary
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={addAiSummary} disabled={aiState.loading}>
                    {aiState.loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
                    Add AI summary
                  </Button>
                )}
                <Button size="sm" onClick={publish} disabled={!last || publishing || isConnecting} data-testid="publish">
                  {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  {last ? `Publish ${FORMAT_LABEL[last.format]} on Stellar` : "Publish on Stellar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {last
                  ? `Publishing records the sha256 of the ${FORMAT_LABEL[last.format]} file you exported last; only that exact file will verify. Requires the Freighter wallet${address ? "" : " (you will be asked to connect)"}.`
                  : "Export a file first; publishing records that exact file's hash on Stellar. Requires the Freighter wallet."}
              </p>
              {aiState.error && <p className="text-xs text-destructive">{aiState.error}</p>}
              {publishError && <p className="text-xs text-destructive" data-testid="publish-error">Could not publish: {publishError}</p>}
              {publishResult && (
                <p className="text-xs break-all">
                  Published {FORMAT_LABEL[publishResult.format]} as report #{publishResult.id} · sha256 {publishResult.hash} ·{" "}
                  <a className="underline" href={`${EXPLORER_URL}/tx/${publishResult.txHash}`} target="_blank" rel="noreferrer">
                    view transaction
                  </a>{" "}
                  · <Link className="underline" to="/verify-report">verify a copy</Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2 print:hidden">
            <Loader2 className="h-4 w-4 animate-spin" /> Building report…
          </p>
        )}

        {report && <TractionReportDocument report={report} aiSummary={aiSummary} verification={verification} />}
      </main>
    </div>
  );
}
