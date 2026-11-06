import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Upload, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findReport, REGISTRY_EXPLORER_URL, type PublishedReport } from "@/integrations/report-registry";
import { EXPLORER_URL, STELLAR_NETWORK } from "@/integrations/stellar-network";

type Result =
  | { kind: "idle" }
  | { kind: "checking"; name: string }
  | { kind: "found"; name: string; hash: string; report: PublishedReport }
  | { kind: "missing"; name: string; hash: string }
  | { kind: "error"; message: string };

const short = (s: string) => (s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s);

export default function VerifyReport() {
  const [result, setResult] = useState<Result>({ kind: "idle" });

  const check = async (file: File | undefined) => {
    if (!file) return;
    setResult({ kind: "checking", name: file.name });
    try {
      const { hash, report } = await findReport(file);
      setResult(report ? { kind: "found", name: file.name, hash, report } : { kind: "missing", name: file.name, hash });
    } catch (err) {
      setResult({ kind: "error", message: err instanceof Error ? err.message : "Lookup failed" });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verify a report</h1>
        <p className="text-muted-foreground mt-1">
          Check that a BlocRA analysis report is authentic and unmodified. The file is hashed in your
          browser (it is never uploaded) and looked up in the BlocRA report registry on Stellar {STELLAR_NETWORK}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose a report file</CardTitle>
          <CardDescription>PDF or DOCX, exactly as it was downloaded from BlocRA.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">Click to choose a file</span>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              data-testid="verify-file"
              onChange={(e) => check(e.target.files?.[0])}
            />
          </label>
        </CardContent>
      </Card>

      {result.kind === "checking" && <p className="text-muted-foreground">Checking {result.name}…</p>}

      {result.kind === "error" && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{result.message}</CardContent>
        </Card>
      )}

      {result.kind === "missing" && (
        <Card className="border-amber-500">
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
            <div>
              <CardTitle>Not found in the registry</CardTitle>
              <CardDescription>
                {result.name} was never published, or it has been modified since.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground break-all">sha256 {result.hash}</CardContent>
        </Card>
      )}

      {result.kind === "found" && (
        <Card className={result.report.revoked ? "border-destructive" : "border-green-600"}>
          <CardHeader className="flex flex-row items-center gap-3">
            {result.report.revoked ? (
              <ShieldX className="h-6 w-6 text-destructive" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-green-600" />
            )}
            <div>
              <CardTitle>{result.report.revoked ? "Published, then revoked by its author" : "Authentic BlocRA report"}</CardTitle>
              <CardDescription>{result.report.title}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Report</dt>
              <dd>#{result.report.id}</dd>
              <dt className="text-muted-foreground">Published</dt>
              <dd>{result.report.publishedAt.toLocaleString()}</dd>
              <dt className="text-muted-foreground">Author</dt>
              <dd>
                <a className="underline" href={`${EXPLORER_URL}/account/${result.report.author}`} target="_blank" rel="noreferrer">
                  {short(result.report.author)}
                </a>
              </dd>
              <dt className="text-muted-foreground">Chain</dt>
              <dd>{result.report.chain}</dd>
              <dt className="text-muted-foreground">Contract</dt>
              <dd className="break-all">{result.report.subject}</dd>
              <dt className="text-muted-foreground">sha256</dt>
              <dd className="break-all text-xs">{result.hash}</dd>
            </dl>
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
