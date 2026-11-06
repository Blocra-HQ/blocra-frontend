// Builds Dashboard Builder widgets from the figures Contract Analysis computed.
// Every widget is a snapshot of those figures; nothing is estimated or filled in.
// Pure functions, no React, so they can be tested from node.

import type { Row, WidgetType } from './widgetData';

/** localStorage key Contract Analysis hands a dashboard to the builder under. */
export const HANDOFF_KEY = 'ai_generated_dashboard';

export interface SnapshotWidget {
  title: string;
  type: WidgetType;
  /** Rows drawn with the same mapping as query results. */
  rows: Row[];
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface HandoffDashboard {
  name: string;
  description: string;
  contractAddress: string;
  widgets: SnapshotWidget[];
}

/** The subset of ContractEventsEDA's `stats` used here. */
export interface ContractStats {
  totalEvents?: unknown;
  totalTransactions?: unknown;
  uniqueUsers?: unknown;
  transferCount?: unknown;
  eventTypes?: Record<string, unknown>;
  topCallers?: { address?: unknown; calls?: unknown }[];
  volumeOverTime?: { name?: unknown; block?: unknown; value?: unknown; transactions?: unknown }[];
}

const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const NUMBER_SIZE = { width: 220, height: 150 };
const CHART_SIZE = { width: 460, height: 320 };
const GAP = 20;

export function contractStatsToWidgets(stats: ContractStats | null | undefined): SnapshotWidget[] {
  if (!stats) return [];
  const numbers: Omit<SnapshotWidget, 'position' | 'size'>[] = [];
  const charts: Omit<SnapshotWidget, 'position' | 'size'>[] = [];

  const kpis: [string, string, unknown][] = [
    ['Total events', 'events', stats.totalEvents],
    ['Transactions', 'transactions', stats.totalTransactions],
    ['Unique addresses', 'addresses', stats.uniqueUsers],
  ];
  const transfers = finite(stats.transferCount);
  if (transfers !== null && transfers > 0) kpis.push(['Transfers', 'transfers', transfers]);
  for (const [title, column, raw] of kpis) {
    const value = finite(raw);
    if (value !== null) numbers.push({ title, type: 'number', rows: [{ [column]: value }] });
  }

  const eventRows = Object.entries(stats.eventTypes ?? {})
    .map(([event, count]) => ({ event, count: finite(count) }))
    .filter((r): r is { event: string; count: number } => r.count !== null && r.count > 0)
    .sort((a, b) => b.count - a.count);
  if (eventRows.length > 0) {
    charts.push({
      title: 'Events by type',
      type: eventRows.length <= 6 ? 'pie' : 'bar',
      rows: eventRows,
    });
  }

  const callerRows = (stats.topCallers ?? [])
    .map((c) => ({ address: typeof c.address === 'string' ? c.address : null, calls: finite(c.calls) }))
    .filter((r): r is { address: string; calls: number } => r.address !== null && r.calls !== null);
  if (callerRows.length > 0) {
    charts.push({ title: 'Most active addresses', type: 'table', rows: callerRows });
  }

  // volumeOverTime holds cumulative Transfer volume per block. Without
  // transfers it is only placeholder points, so it is left out.
  const volumeRows = (stats.volumeOverTime ?? [])
    .filter((p) => finite(p.block) !== null && finite(p.value) !== null)
    .map((p) => ({
      block: `#${finite(p.block)}`,
      cumulative_volume: finite(p.value) as number,
    }));
  if (transfers !== null && transfers > 0 && volumeRows.length > 1) {
    charts.push({ title: 'Cumulative transfer volume', type: 'line', rows: volumeRows });
  }

  const widgets: SnapshotWidget[] = [];
  numbers.forEach((w, i) => {
    widgets.push({ ...w, position: { x: GAP + i * (NUMBER_SIZE.width + GAP), y: GAP }, size: NUMBER_SIZE });
  });
  const chartTop = numbers.length > 0 ? GAP * 2 + NUMBER_SIZE.height : GAP;
  charts.forEach((w, i) => {
    widgets.push({
      ...w,
      position: {
        x: GAP + (i % 2) * (CHART_SIZE.width + GAP),
        y: chartTop + Math.floor(i / 2) * (CHART_SIZE.height + GAP),
      },
      size: CHART_SIZE,
    });
  });
  return widgets;
}

/** Reads a hand-off left by Contract Analysis; null when absent or malformed. */
export function parseHandoff(raw: string | null, contract: string): HandoffDashboard | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object' || !Array.isArray(d.widgets)) return null;
    if (String(d.contractAddress ?? '').toLowerCase() !== contract.toLowerCase()) return null;
    return {
      name: typeof d.name === 'string' ? d.name : 'Contract dashboard',
      description: typeof d.description === 'string' ? d.description : '',
      contractAddress: String(d.contractAddress),
      widgets: d.widgets.filter(
        (w: any) => w && typeof w.title === 'string' && Array.isArray(w.rows) && typeof w.type === 'string',
      ),
    };
  } catch {
    return null;
  }
}
