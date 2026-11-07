// Client for the backend traction reports (blocra-backend /api/reports/*).
//
// Reports are fetched signed (?signed=true): the envelope's report_json is
// the exact report BlocRA signed, and the page renders from it. A server
// without a signing key answers 503; then the unsigned report is used and
// the page says so.
import { apiClient } from "@/lib/api";
import { API_CONFIG } from "@/config/api";
import type { ReportSubject, TractionReport } from "@/lib/tractionReport";
import type { SignedEnvelope } from "@/lib/blocra/types";

export interface FetchedReport {
  report: TractionReport;
  /** The signed envelope, or null when the server does not sign reports. */
  envelope: SignedEnvelope | null;
  /** Why the report is unsigned (server message), when envelope is null. */
  unsignedReason: string | null;
}

export interface SigningKey {
  signer: string;
  algorithm: string;
  method_version: string;
  chains: string[];
}

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_CONFIG.apiUrl}${path}`);
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) throw new HttpError(body?.message ?? `HTTP ${res.status}`, res.status);
  return body as T;
}

export const TractionReportService = {
  async subjects(kind: "contract" | "asset", days: number, limit = 20): Promise<ReportSubject[]> {
    const res = await apiClient.request<{ subjects: ReportSubject[] }>(
      `/reports/subjects?kind=${kind}&days=${days}&limit=${limit}`,
    );
    return res.subjects ?? [];
  },

  /** A signed report (falls back to unsigned if the server cannot sign). */
  async traction(subject: string, days: number, opts: { relayers?: string[]; chain?: string } = {}): Promise<FetchedReport> {
    const params = new URLSearchParams({ subject, days: String(days), chain: opts.chain ?? "stellar" });
    if (opts.relayers?.length) params.set("relayers", opts.relayers.join(","));
    try {
      const res = await getJson<{ signed: SignedEnvelope }>(`/reports/traction?${params}&signed=true`);
      return { report: JSON.parse(res.signed.report_json), envelope: res.signed, unsignedReason: null };
    } catch (e) {
      if (!(e instanceof HttpError) || e.status !== 503) throw e;
      const res = await getJson<{ report: TractionReport }>(`/reports/traction?${params}`);
      return { report: res.report, envelope: null, unsignedReason: e.message };
    }
  },

  /** The key this server signs reports with (GET /api/attestation/key). */
  async signingKey(): Promise<SigningKey> {
    return getJson<SigningKey>("/attestation/key");
  },
};
