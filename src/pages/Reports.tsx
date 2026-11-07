// Stellar traction reports: pick a contract or asset, fetch the report BlocRA
// signs, render it as a printable document, export it and publish the
// exported file's hash to the BlocRA report registry on Stellar.
//
// Exports match the CLI byte for byte (renderer vendored from blocra-cli in
// src/lib/blocra): the .md is `blocra report`'s Markdown with the signed
// envelope embedded, the .json is the envelope; both pass `npx blocra verify`.
// The PDF is a rendering for people and says so.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Bot, Download, FileBarChart, Loader2, Printer, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TractionReportDocument } from "@/components/reports/TractionReportDocument";
import { TractionReportService, type FetchedReport } from "@/services/TractionReportService";
import { AIService } from "@/services/AIService";
import { useStellarWallet } from "@/contexts/StellarWalletContext";
import { findReport, publishReport, sha256, toHex, type PublishedReport } from "@/integrations/report-registry";
import { EXPLORER_URL, STELLAR_NETWORK } from "@/integrations/stellar-network";
import { type ReportSubject, fmtInt, reportTitle } from "@/lib/tractionReport";
import { loadLogo, reportToPdf } from "@/lib/tractionReportPdf";
import { cliFileBase, envelopeJson, unsignedMarkdown, verifiableMarkdown } from "@/lib/blocra/files";

type Kind = "contract" | "asset";
type Format = "md" | "pdf" | "json";

interface ExportedFile {
  format: Format;
  name: string;
  blob: Blob;
  hash: string;
  registry: { state: "checking" } | { state: "found"; report: PublishedReport } | { state: "missing" } | { state: "error"; message: string };
}

const FORMATS: Format[] = ["md", "json", "pdf"];
const SIGNED_LABEL: Record<Format, string> = { md: "Verifiable report (.md)", json: "Signed data (.json)", pdf: "PDF (rendering)" };
const UNSIGNED_LABEL: Record<Format, string> = { md: "Markdown (unsigned)", json: "JSON (unsigned)", pdf: "PDF (unsigned)" };
const ACCOUNT_RE = /^G[A-Z2-7]{55}$/;
/** Comma/space-separated G... accounts, like the CLI's repeated --relayer. */
const parseRelayers = (text: string) => text.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
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
  const [relayersText, setRelayersText] = useState(params.get("relayers") ?? "");

  const [subjects, setSubjects] = useState<ReportSubject[]>([]);
  const [subjectsState, setSubjectsState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  const [fetched, setFetched] = useState<FetchedReport | null>(null);
  const report = fetched?.report ?? null;
  const envelope = fetched?.envelope ?? null;
  const FORMAT_LABEL = envelope || !report ? SIGNED_LABEL : UNSIGNED_LABEL;
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

  // The AI summary only appears on screen and in the PDF; the signed .md/.json
  // never change.
  const resetPdf = () => {
    setFiles(({ pdf: _pdf, ...rest }) => rest);
    if (lastFormat === "pdf") {
      setLastFormat(null);
      setPublishResult(null);
    }
  };

  const resetExports = () => {
    setFiles({});
    setLastFormat(null);
    setPublishResult(null);
    setPublishError(null);
  };

  const generate = useCallback(
    async (id: string, d: 7 | 30, relayerText: string) => {
      const subject = id.trim();
      if (!subject) return;
      // Declared relayers apply to contract calls only (as with the CLI).
      const relayers = kindOf(subject) === "contract" ? parseRelayers(relayerText) : [];
      const badRelayer = relayers.find((a) => !ACCOUNT_RE.test(a));
      if (badRelayer) {
        setError(`"${badRelayer}" is not a Stellar account id (G…, 56 characters).`);
        return;
      }
      setLoading(true);
      setError(null);
      setFetched(null);
      setAiSummary(null);
      setAiState({ loading: false, error: null });
      resetExports();
      setParams(
        { subject, days: String(d), kind: kindOf(subject), ...(relayers.length ? { relayers: relayers.join(",") } : {}) },
        { replace: true },
      );
      try {
        setFetched(await TractionReportService.traction(subject, d, { relayers }));
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
    generate(initialSubject, days, relayersText);
  }, [initialSubject, days, relayersText, generate]);

  const buildFile = async (format: Format): Promise<ExportedFile> => {
    if (!report) throw new Error("Generate a report first");
    const cached = files[format];
    if (cached) return cached;
    // .md and .json are exactly what `blocra report` writes for this envelope.
    const blob =
      format === "md"
        ? new Blob([envelope ? verifiableMarkdown(envelope) : unsignedMarkdown(report)], { type: "text/markdown;charset=utf-8" })
        : format === "json"
          ? new Blob([envelope ? envelopeJson(envelope) : JSON.stringify(report, null, 2) + "\n"], { type: "application/json" })
          : reportToPdf(report, { aiSummary }, await loadLogo(), envelope?.attestation ?? null);
    const hash = toHex(await sha256(blob));
    return { format, name: `${cliFileBase(report)}${envelope ? "" : "-unsigned"}.${format}`, blob, hash, registry: { state: "checking" } };
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
      resetPdf();
      setAiState({ loading: false, error: null });
    } catch (e) {
      setAiState({ loading: false, error: `AI summary unavailable: ${errText(e)}` });
    }
  };

  const removeAiSummary = () => {
    setAiSummary(null);
    resetPdf();
  };

  const last = lastFormat ? files[lastFormat] : undefined;

  const att = envelope?.attestation ?? null;

  const verification = useMemo(() => {
    const reg = last?.registry;
    return (
      <div className="space-y-2">
        <p>
          <span className="font-semibold text-zinc-800">Verification.</span>{" "}
          {att ? (
            <>
              This report is signed by BlocRA (Ed25519 over the exact report data). Export the{" "}
              <span className="font-medium">verifiable report (.md)</span> or <span className="font-medium">signed data (.json)</span>{" "}
              and anyone can check it with <span className="font-mono">npx blocra verify &lt;file&gt;</span> or at{" "}
              <span className="font-mono">/verify-report</span>; editing any figure breaks verification. The PDF is a rendering for
              reading, not the verifiable artifact.
            </>
          ) : (
            <>Unsigned report: this server does not sign reports, so its exports cannot be verified.</>
          )}
        </p>
        {att && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-0.5" data-testid="attestation">
            <dt className="text-zinc-500">Signed by</dt>
            <dd className="font-mono break-all">{att.signer} (BlocRA)</dd>
            <dt className="text-zinc-500">Method</dt>
            <dd className="font-mono">{att.method_version}</dd>
            <dt className="text-zinc-500">Report sha256</dt>
            <dd className="font-mono break-all" data-testid="payload-sha256">{att.payload_sha256}</dd>
            <dt className="text-zinc-500">Signed at</dt>
            <dd>{att.signed_at}</dd>
          </dl>
        )}
        {last && reg && (
          <div className="space-y-0.5">
            <p>
              Last export: {FORMAT_LABEL[last.format]} <span className="font-mono">{last.name}</span>
            </p>
            <p className="font-mono break-all" data-testid="report-sha256">
              file sha256 {last.hash}
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
        )}
      </div>
    );
  }, [last, att, FORMAT_LABEL]);

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
              concentration and bot share, relayed calls, ecosystem rank — computed and signed by BlocRA from mainnet ledgers. The
              exported .md / .json are the same files <span className="font-mono">npx blocra report</span> writes, so reviewers and
              investors can check them with <span className="font-mono">npx blocra verify</span>.
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
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                generate(subjectId, days, relayersText);
              }}
            >
              <div className="flex flex-col sm:flex-row gap-2">
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
              </div>
              {kind === "contract" && (
                <div>
                  <Input
                    value={relayersText}
                    onChange={(e) => setRelayersText(e.target.value)}
                    placeholder="Declared relayers (optional): G…, G…"
                    className="font-mono text-xs"
                    data-testid="relayers-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accounts your project uses to submit transactions for users (like the CLI's <span className="font-mono">--relayer</span>).
                    Users who sign their own authorization are found automatically; list only relayers that sign everything themselves,
                    so their calls are reported separately instead of counting as one very active user.
                  </p>
                </div>
              )}
            </form>
            {error && <p className="text-sm text-destructive" data-testid="report-error">{error}</p>}
          </CardContent>
        </Card>

        {report && (
          <Card className="print:hidden">
            <CardContent className="pt-6 space-y-3">
              {!envelope && (
                <p className="flex items-start gap-2 rounded-md border border-amber-400 bg-amber-50 p-2 text-xs text-amber-900" data-testid="unsigned-notice">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Unsigned — this server doesn't sign reports{fetched?.unsignedReason ? ` (${fetched.unsignedReason})` : ""}. Exports
                    can't be checked with <span className="font-mono">npx blocra verify</span>.
                  </span>
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
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
                  ? `Publishing records the sha256 of the ${FORMAT_LABEL[last.format]} file you exported last; only that exact file matches the registry. Requires the Freighter wallet${address ? "" : " (you will be asked to connect)"}.`
                  : "Export a file first; publishing records that exact file's hash on Stellar (in addition to BlocRA's signature). Requires the Freighter wallet."}
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

        {report && <TractionReportDocument report={report} aiSummary={aiSummary} verification={verification} signed={!!envelope} />}
      </main>
    </div>
  );
}
