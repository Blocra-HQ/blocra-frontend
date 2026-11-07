// Verify a report file in the browser, like `npx blocra verify <file>`:
//
// 1. BlocRA's signature (.md with the embedded envelope, or the .json
//    envelope): Ed25519 via WebCrypto against a trusted BlocRA key, and for
//    Markdown the text must be exactly what the signed report renders to
//    (same renderer as the CLI, vendored in src/lib/blocra).
// 2. The on-chain report registry: the file's sha256 looked up on Stellar
//    (an additional check; works for any exported format, including PDF).
//
// The file never leaves the browser.
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Upload, ExternalLink, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findReport, REGISTRY_EXPLORER_URL, sha256, toHex, type PublishedReport } from "@/integrations/report-registry";
import { EXPLORER_URL, STELLAR_NETWORK } from "@/integrations/stellar-network";
import { API_CONFIG } from "@/config/api";
import { TractionReportService } from "@/services/TractionReportService";
import { OFFICIAL_KEYS, verifyReportFile, type VerifyResult } from "@/lib/blocra/verify";

type Registry =
  | { state: "checking" }
  | { state: "found"; report: PublishedReport }
  | { state: "missing" }
  | { state: "error"; message: string };

interface Checked {
  name: string;
  fileHash: string | null;
  /** null when the file carries no BlocRA signature to check (e.g. PDF). */
  signature: VerifyResult | null;
  registry: Registry;
}

/** Where the trusted keys come from: built into the site, or the API's key. */
type Trust =
  | { state: "loading" }
  | { state: "ready"; keys: string[]; source: "built-in" | "server" }
  | { state: "error"; message: string };

const short = (s: string) => (s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s);
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const SIGNED_EXT = /\.(md|json)$/i;

export default function VerifyReport() {
  const [trust, setTrust] = useState<Trust>({ state: "loading" });
  const [result, setResult] = useState<Checked | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

  // Built-in official keys (mirrors blocra-cli src/defaults.js) win over the
  // key the API serves, exactly as in the CLI.
  useEffect(() => {
    if (OFFICIAL_KEYS.length) {
      setTrust({ state: "ready", keys: [...OFFICIAL_KEYS], source: "built-in" });
      return;
    }
    TractionReportService.signingKey()
      .then((k) => setTrust({ state: "ready", keys: [k.signer], source: "server" }))
      .catch((e) => setTrust({ state: "error", message: errText(e) }));
  }, []);

  const check = async (file: File | undefined) => {
    if (!file) return;
    setChecking(file.name);
    setResult(null);
    const keys = trust.state === "ready" ? trust.keys : [];
    let signature: VerifyResult | null = null;
    if (SIGNED_EXT.test(file.name)) {
      try {
        signature = await verifyReportFile(file.name, await file.text(), keys);
        if (!keys.length && trust.state === "error") {
          signature.ok = false;
          signature.reasons = [...signature.reasons, `Could not load BlocRA's signing key (${trust.message})`];
        }
      } catch (e) {
        signature = { ok: false, unsupported: false, format: null, envelope: null, report: null, sha256: null, reasons: [errText(e)] };
      }
    }
    const base: Checked = { name: file.name, fileHash: toHex(await sha256(file)), signature, registry: { state: "checking" } };
    setResult(base);
    setChecking(null);
    try {
      const { report } = await findReport(file);
      setResult({ ...base, registry: report ? { state: "found", report } : { state: "missing" } });
    } catch (e) {
      setResult({ ...base, registry: { state: "error", message: errText(e) } });
    }
  };

  const sig = result?.signature;
  const r = sig?.report;
  const att = sig?.envelope?.attestation;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verify a report</h1>
        <p className="text-muted-foreground mt-1">
          Check that a BlocRA traction report is authentic and unmodified. A <span className="font-mono">.md</span> or{" "}
          <span className="font-mono">.json</span> report is checked against BlocRA's signature, the same check as{" "}
          <span className="font-mono">npx blocra verify</span>; any file is also looked up in the BlocRA report registry on Stellar{" "}
          {STELLAR_NETWORK}. The file is read in your browser and never uploaded.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose a report file</CardTitle>
          <CardDescription>
            The verifiable report (.md) or signed data (.json) from BlocRA or <span className="font-mono">blocra report</span>.
            PDF and DOCX files are renderings: they can only be matched against the on-chain registry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">Click to choose a file</span>
            <input
              type="file"
              accept=".md,.json,.pdf,.docx,text/markdown,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={trust.state === "loading"}
              data-testid="verify-file"
              onChange={(e) => {
                check(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground flex items-start gap-2" data-testid="trusted-key">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {trust.state === "loading" && "Loading BlocRA's signing key…"}
            {trust.state === "error" && <span className="text-destructive">Could not load BlocRA's signing key: {trust.message}</span>}
            {trust.state === "ready" && (
              <span className="break-all">
                Trusting {trust.keys.length > 1 ? "keys" : "key"} <span className="font-mono">{trust.keys.join(", ")}</span>{" "}
                {trust.source === "built-in"
                  ? "(BlocRA's official keys built into this site)"
                  : `(served by ${new URL(API_CONFIG.apiUrl, window.location.href).host}/api/attestation/key; pin it with npx blocra verify --key for an independent check)`}
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {checking && <p className="text-muted-foreground">Checking {checking}…</p>}

      {result && sig && (
        <Card className={sig.ok ? "border-green-600" : sig.unsupported ? "border-amber-500" : "border-destructive"} data-testid="signature-result">
          <CardHeader className="flex flex-row items-center gap-3">
            {sig.ok ? (
              <ShieldCheck className="h-6 w-6 text-green-600 shrink-0" />
            ) : sig.unsupported ? (
              <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0" />
            ) : (
              <ShieldX className="h-6 w-6 text-destructive shrink-0" />
            )}
            <div>
              <CardTitle>
                {sig.ok ? "VALID: signed by BlocRA" : sig.unsupported ? "Cannot check the signature in this browser" : "FAIL: signature check failed"}
              </CardTitle>
              <CardDescription>
                {result.name}
                {r ? ` · ${r.subject?.label ?? r.subject?.id} · ${r.chain ?? "stellar"} · ${r.period?.from} – ${r.period?.to}` : ""}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!sig.ok && (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {sig.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            {att && (
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Signed by</dt>
                <dd className="font-mono text-xs break-all">{att.signer}</dd>
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-mono text-xs">{att.method_version}</dd>
                <dt className="text-muted-foreground">Signed at</dt>
                <dd>{att.signed_at}</dd>
                <dt className="text-muted-foreground">Report sha256</dt>
                <dd className="font-mono text-xs break-all">{sig.sha256 ?? att.payload_sha256}</dd>
              </dl>
            )}
          </CardContent>
        </Card>
      )}

      {result && !sig && (
        <Card className="border-amber-500">
          <CardContent className="pt-6 text-sm">
            {result.name} is not a signed report file, so BlocRA's signature cannot be checked. Ask for the{" "}
            <span className="font-mono">.md</span> or <span className="font-mono">.json</span> export, which{" "}
            <span className="font-mono">npx blocra verify</span> and this page can check. The registry lookup below still applies.
          </CardContent>
        </Card>
      )}

      {result && (
        <Card
          className={
            result.registry.state === "found"
              ? result.registry.report.revoked
                ? "border-destructive"
                : "border-green-600"
              : undefined
          }
          data-testid="registry-result"
        >
          <CardHeader>
            <CardTitle className="text-base">On-chain registry ({STELLAR_NETWORK})</CardTitle>
            <CardDescription>
              Whether this exact file's sha256 was published to BlocRA's report registry on Stellar. Optional: a signed report is valid
              without it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {result.registry.state === "checking" && <p className="text-muted-foreground">Looking up…</p>}
            {result.registry.state === "error" && <p className="text-destructive">Lookup failed: {result.registry.message}</p>}
            {result.registry.state === "missing" && <p>Not published (or this copy differs from the published file).</p>}
            {result.registry.state === "found" && (
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{result.registry.report.revoked ? "Published, then revoked by its author" : "Published"}</dd>
                <dt className="text-muted-foreground">Report</dt>
                <dd>
                  #{result.registry.report.id} · {result.registry.report.title}
                </dd>
                <dt className="text-muted-foreground">Published</dt>
                <dd>{result.registry.report.publishedAt.toLocaleString()}</dd>
                <dt className="text-muted-foreground">Author</dt>
                <dd>
                  <a className="underline" href={`${EXPLORER_URL}/account/${result.registry.report.author}`} target="_blank" rel="noreferrer">
                    {short(result.registry.report.author)}
                  </a>
                </dd>
                <dt className="text-muted-foreground">Chain</dt>
                <dd>{result.registry.report.chain}</dd>
                <dt className="text-muted-foreground">Subject</dt>
                <dd className="break-all">{result.registry.report.subject}</dd>
              </dl>
            )}
            {result.fileHash && <p className="text-xs text-muted-foreground break-all">file sha256 {result.fileHash}</p>}
          </CardContent>
        </Card>
      )}

      <Button variant="link" asChild className="px-0">
        <a href={REGISTRY_EXPLORER_URL} target="_blank" rel="noreferrer">
          View the registry contract <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </Button>
    </div>
  );
}
