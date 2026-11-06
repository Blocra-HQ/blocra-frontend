// Client for the backend traction reports (blocra-backend /api/reports/*).
import { apiClient } from "@/lib/api";
import type { ReportSubject, TractionReport } from "@/lib/tractionReport";

export const TractionReportService = {
  async subjects(kind: "contract" | "asset", days: number, limit = 20): Promise<ReportSubject[]> {
    const res = await apiClient.request<{ subjects: ReportSubject[] }>(
      `/reports/subjects?kind=${kind}&days=${days}&limit=${limit}`,
    );
    return res.subjects ?? [];
  },

  async traction(subject: string, days: number): Promise<TractionReport> {
    const res = await apiClient.request<{ report: TractionReport }>(
      `/reports/traction?subject=${encodeURIComponent(subject)}&days=${days}`,
    );
    return res.report;
  },
};
