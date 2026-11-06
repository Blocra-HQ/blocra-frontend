// Pure helpers that turn GET /api/dashboards/stats responses into the labels
// and figures the dashboard shows. No React, so they can be tested against
// real backend responses for every chain.
//
// The backend reports a figure it cannot read exactly as null (with
// stats.partial saying why); every helper here shows that as DASH, never as
// 0, NaN or "undefined".

import type { ChainConfig } from '@/config/chains';

export type ChainKind = ChainConfig['type'];

/** Latest-block statistics, as returned by the backend for any chain type. */
export interface BlockchainStats {
  total_transactions: number;
  active_users: number;
  unique_senders: number;
  /** Gas (EVM, Cosmos), L1 + L2 gas (Starknet) or compute units (Solana). */
  gas_used?: number | null;
  gas_limit?: number | null;
  /** Gas requested by the block's transactions (Cosmos). */
  gas_wanted?: number | null;
  total_fees: string | null;
  avg_fee: string | null;
  /** Token the fees are counted in (STRK on Starknet, the native token elsewhere). */
  fee_unit?: string;
  successful_txs: number | null;
  failed_txs: number | null;
  /** Why some figures are null, e.g. "receipts unavailable". */
  partial?: string;
  l1_gas?: number;
  l2_gas?: number;
  l1_data_gas?: number;
  /** Operations in the ledger (Stellar). */
  operations?: number;
  /** Transaction envelope, message or operation type counts. */
  tx_types?: Record<string, number>;
  /** EVM: transfer / call / contract_creation counts. */
  tx_kinds?: Record<string, number>;
  /** Celo: transactions that paid fees in another token (left out of total_fees). */
  non_native_fee_txs?: number;
  /** Solana: vote transactions in the block. */
  vote_txs?: number;
}

export interface BlockchainStatsResponse {
  success: boolean;
  chain?: string;
  network?: string;
  block_number: number;
  timestamp: number;
  stats: BlockchainStats;
  block_info: { block_number: number; timestamp: number; transaction_count: number };
}

export const DASH = '—';

/** A finite number from a number or numeric string; null for anything else. */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatCount(value: unknown): string {
  const n = toNumber(value);
  return n === null ? DASH : Math.round(n).toLocaleString();
}

/** "0.0109 ETH"; values too small for `digits` show as "<0.0001 ETH". */
export function formatAmount(value: unknown, unit: string, digits = 4): string {
  const n = toNumber(value);
  if (n === null) return DASH;
  const suffix = unit ? ` ${unit}` : '';
  if (n === 0) return `0${suffix}`;
  const floor = 10 ** -digits;
  if (Math.abs(n) < floor) return `<${floor.toFixed(digits)}${suffix}`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

/** "29.6M", "186.9K", "776". */
export function formatCompact(value: unknown): string {
  const n = toNumber(value);
  if (n === null) return DASH;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

/** part / total as a percentage, or DASH when either is missing or total is 0. */
export function formatPercent(part: unknown, total: unknown, digits = 1): string {
  const p = toNumber(part);
  const t = toNumber(total);
  if (p === null || t === null || t === 0) return DASH;
  return `${((p / t) * 100).toFixed(digits)}%`;
}

export function formatSeconds(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined || !Number.isFinite(value) ? DASH : `${value.toFixed(digits)}s`;
}

const ACRONYMS = new Set(['EIP', 'CIP', 'IBC', 'EVM', 'NFT', 'ARB', 'XDR', 'ICA', 'WASM']);

function titleWord(word: string): string {
  const upper = word.toUpperCase();
  const eip = /^(EIP|CIP)(\d+)$/.exec(upper);
  if (eip) return `${eip[1]}-${eip[2]}`;
  if (ACRONYMS.has(upper) || /\d/.test(word)) return upper;
  return upper.charAt(0) + upper.slice(1).toLowerCase();
}

/**
 * A readable name for a transaction, message or operation type:
 * "path_payment_strict_send" -> "Path Payment Strict Send",
 * "DEPLOY_ACCOUNT" -> "Deploy Account", "EIP1559" -> "EIP-1559",
 * "/cosmos.bank.v1beta1.MsgSend" -> "Send", "MsgUpdateClient" -> "Update Client".
 */
export function formatTxType(raw: string): string {
  let name = (raw ?? '').trim();
  if (!name) return 'Unknown';
  // Cosmos type URLs: keep the message name after the last '.' or '/'.
  name = name.split(/[./]/).filter(Boolean).pop() ?? name;
  // Cosmos message names: MsgSend, MsgUpdateClient.
  name = name.replace(/^Msg(?=[A-Z])/, '');
  const words = /[a-z]/.test(name) && /[A-Z]/.test(name) && !name.includes('_')
    ? name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(/\s+/)
    : name.split(/[_\s-]+/);
  return words.filter(Boolean).map(titleWord).join(' ') || 'Unknown';
}

export interface ChainLabels {
  /** "block" or "ledger". */
  blockWord: string;
  /** "Block" or "Ledger". */
  BlockWord: string;
  /** Title of the work metric: "Gas used", "Compute units", "Operations". */
  work: string;
  /** Axis/legend label for the charted work metric. */
  workChart: string;
  /** One-line description of the work metric. */
  workDescription: string;
  /** Operations are charted as-is; gas and compute units in millions. */
  workInMillions: boolean;
  /** "Reverted" where a failed transaction still lands in the block (EVM, Starknet), else "Failed". */
  failed: string;
}

export function chainLabels(type: ChainKind): ChainLabels {
  switch (type) {
    case 'stellar':
      return {
        blockWord: 'ledger', BlockWord: 'Ledger',
        work: 'Operations', workChart: 'Operations',
        workDescription: 'Operations applied in each ledger',
        workInMillions: false, failed: 'Failed',
      };
    case 'starknet':
      return {
        blockWord: 'block', BlockWord: 'Block',
        work: 'Gas used', workChart: 'L1 + L2 gas (M)',
        workDescription: 'L1 + L2 gas consumed in each block (millions)',
        workInMillions: true, failed: 'Reverted',
      };
    case 'solana':
      return {
        blockWord: 'block', BlockWord: 'Block',
        work: 'Compute units', workChart: 'Compute units (M)',
        workDescription: 'Compute units consumed in each block (millions)',
        workInMillions: true, failed: 'Failed',
      };
    case 'cosmos':
      return {
        blockWord: 'block', BlockWord: 'Block',
        work: 'Gas used', workChart: 'Gas used (M)',
        workDescription: 'Gas used by each block\'s transactions (millions)',
        workInMillions: true, failed: 'Failed',
      };
    default:
      return {
        blockWord: 'block', BlockWord: 'Block',
        work: 'Gas used', workChart: 'Gas used (M)',
        workDescription: 'Gas used in each block (millions)',
        workInMillions: true, failed: 'Reverted',
      };
  }
}

/** The raw work figure: operations (Stellar) or gas / compute units. */
export function workValue(stats: BlockchainStats, type: ChainKind): number | null {
  return toNumber(type === 'stellar' ? stats.operations : stats.gas_used);
}

/** The work figure as charted (millions for gas and compute units). */
export function workChartValue(stats: BlockchainStats, type: ChainKind): number | null {
  const v = workValue(stats, type);
  return v === null ? null : chainLabels(type).workInMillions ? v / 1e6 : v;
}

export function formatWorkChartValue(value: unknown, type: ChainKind): string {
  const n = toNumber(value);
  if (n === null) return DASH;
  return chainLabels(type).workInMillions ? `${n.toFixed(2)}M` : Math.round(n).toLocaleString();
}

export function feeUnit(stats: BlockchainStats | null | undefined, chain: Pick<ChainConfig, 'nativeCurrency'>): string {
  return stats?.fee_unit || chain.nativeCurrency;
}

export interface Slice { name: string; value: number; color: string }

const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

/** Pie slices for tx_types, largest first; past seven types the rest are grouped as "Other". */
export function txTypeSlices(stats: BlockchainStats): Slice[] {
  const merged = new Map<string, number>();
  for (const [raw, count] of Object.entries(stats.tx_types ?? {})) {
    const n = toNumber(count);
    if (n === null || n <= 0) continue;
    const name = formatTxType(raw);
    merged.set(name, (merged.get(name) ?? 0) + n);
  }
  const sorted = [...merged.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.length > 8 ? sorted.slice(0, 7) : sorted;
  const rest = sorted.length > 8 ? sorted.slice(7).reduce((sum, [, n]) => sum + n, 0) : 0;
  const slices = top.map(([name, value], i) => ({ name, value, color: TYPE_COLORS[i % TYPE_COLORS.length] }));
  if (rest > 0) slices.push({ name: 'Other', value: rest, color: '#94a3b8' });
  return slices;
}

/** Succeeded / failed slices; empty when the counts are unknown or the block is empty. */
export function statusSlices(stats: BlockchainStats, type: ChainKind): Slice[] {
  const ok = toNumber(stats.successful_txs);
  const failed = toNumber(stats.failed_txs);
  if (ok === null || failed === null || ok + failed === 0) return [];
  return [
    { name: 'Succeeded', value: ok, color: '#10b981' },
    { name: chainLabels(type).failed, value: failed, color: '#ef4444' },
  ].filter((s) => s.value > 0);
}

/**
 * Transfers / contract calls / contract creations (EVM) or vote / other
 * transactions (Solana). Empty where the chain does not report them.
 */
export function txKindRows(stats: BlockchainStats, type: ChainKind): { name: string; value: number }[] {
  if (stats.tx_kinds) {
    const k = stats.tx_kinds;
    return [
      { name: 'Transfers', value: toNumber(k.transfer) ?? 0 },
      { name: 'Contract calls', value: toNumber(k.call) ?? 0 },
      { name: 'Contract creations', value: toNumber(k.contract_creation) ?? 0 },
    ];
  }
  const votes = toNumber(stats.vote_txs);
  if (type === 'solana' && votes !== null) {
    return [
      { name: 'Vote', value: votes },
      { name: 'Non-vote', value: Math.max(0, (toNumber(stats.total_transactions) ?? 0) - votes) },
    ];
  }
  return [];
}

/** gas_used / gas_limit as a percentage (EVM only), else null. */
export function blockUtilization(stats: BlockchainStats): number | null {
  const used = toNumber(stats.gas_used);
  const limit = toNumber(stats.gas_limit);
  return used === null || limit === null || limit === 0 ? null : (used / limit) * 100;
}

/** Notes to show under the figures: why some are missing, or what totals leave out. */
export function statsNotes(stats: BlockchainStats, unit: string): string[] {
  const notes: string[] = [];
  if (stats.partial) notes.push(`Partial data: ${stats.partial}.`);
  const nonNative = toNumber(stats.non_native_fee_txs);
  if (nonNative) {
    notes.push(`${nonNative.toLocaleString()} transaction${nonNative === 1 ? '' : 's'} paid fees in other tokens and ${nonNative === 1 ? 'is' : 'are'} not counted in the ${unit} totals.`);
  }
  return notes;
}

/** Average fee, or null for an empty block (there is no average of nothing). */
export function averageFee(stats: BlockchainStats): number | null {
  return toNumber(stats.total_transactions) ? toNumber(stats.avg_fee) : null;
}

/** Seconds per block between two observed heads, or null when it cannot be measured. */
export function blockTime(
  prev: { block_number: number; timestamp: number } | null | undefined,
  next: { block_number: number; timestamp: number },
): number | null {
  if (!prev) return null;
  const blocks = next.block_number - prev.block_number;
  const secs = next.timestamp - prev.timestamp;
  return blocks > 0 && secs >= 0 ? secs / blocks : null;
}

/** Transactions per second in a block, or null without a block time. */
export function tps(transactions: unknown, secondsPerBlock: number | null | undefined): number | null {
  const n = toNumber(transactions);
  return n === null || !secondsPerBlock ? null : n / secondsPerBlock;
}

/** One point of the dashboard's history charts; null values leave gaps. */
export interface HistoryPoint {
  time: string;
  timestamp: number;
  block_number: number;
  transactions: number;
  work: number | null;
  addresses: number;
  avgFee: number | null;
  fees: number | null;
  succeeded: number | null;
  failed: number | null;
  failRate: number | null;
  /** Seconds per block since the previous observed head. */
  block_time: number | null;
  tps: number | null;
  utilization: number | null;
}

export function historyPoint(
  data: BlockchainStatsResponse,
  type: ChainKind,
  prev: HistoryPoint | null | undefined,
): HistoryPoint {
  const s = data.stats;
  const failed = toNumber(s.failed_txs);
  const total = toNumber(s.total_transactions) ?? 0;
  const bt = blockTime(prev, data);
  return {
    time: new Date(data.timestamp * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: data.timestamp,
    block_number: data.block_number,
    transactions: total,
    work: workChartValue(s, type),
    addresses: toNumber(s.unique_senders) ?? 0,
    avgFee: averageFee(s),
    fees: toNumber(s.total_fees),
    succeeded: toNumber(s.successful_txs),
    failed,
    failRate: failed === null || total === 0 ? null : (failed / total) * 100,
    block_time: bt,
    tps: tps(total, bt),
    utilization: blockUtilization(s),
  };
}

/** Blocks bucketed by their total fees. Blocks with unknown fees are left out. */
export function feeDistribution(points: HistoryPoint[], unit: string): { range: string; count: number }[] {
  const known = points.map((p) => p.fees).filter((f): f is number => f !== null);
  if (known.length === 0) return [];
  const buckets: [string, (f: number) => boolean][] = [
    [`< 0.001 ${unit}`, (f) => f < 0.001],
    [`0.001–0.01 ${unit}`, (f) => f >= 0.001 && f < 0.01],
    [`0.01–0.1 ${unit}`, (f) => f >= 0.01 && f < 0.1],
    [`≥ 0.1 ${unit}`, (f) => f >= 0.1],
  ];
  return buckets.map(([range, test]) => ({ range, count: known.filter(test).length }));
}

/** How long ago the head block was produced, e.g. "12s ago", "3m ago". */
export function formatAge(timestamp: unknown, nowSecs: number): string {
  const t = toNumber(timestamp);
  if (t === null || t <= 0) return DASH;
  const age = Math.max(0, Math.round(nowSecs - t));
  if (age < 120) return `${age}s ago`;
  if (age < 7200) return `${Math.round(age / 60)}m ago`;
  return `${Math.round(age / 3600)}h ago`;
}

/** Every headline figure the dashboard prints for one response, as display strings. */
export function summarize(data: BlockchainStatsResponse, chain: Pick<ChainConfig, 'type' | 'nativeCurrency'>) {
  const s = data.stats;
  const unit = feeUnit(s, chain);
  const labels = chainLabels(chain.type);
  const work = workValue(s, chain.type);
  const failedCount = toNumber(s.failed_txs);
  const util = blockUtilization(s);
  return {
    block: `${labels.BlockWord} #${formatCount(data.block_number)}`,
    transactions: formatCount(s.total_transactions),
    activeUsers: formatCount(s.active_users),
    uniqueSenders: formatCount(s.unique_senders),
    workTitle: labels.work,
    work: chain.type === 'stellar' ? formatCount(work) : formatCompact(work),
    totalFees: formatAmount(s.total_fees, unit, 4),
    avgFee: formatAmount(averageFee(s), unit, 6),
    successRate: formatPercent(s.successful_txs, s.total_transactions),
    failedLine: failedCount === null
      ? `${labels.failed} count unavailable`
      : `${failedCount.toLocaleString()} ${labels.failed.toLowerCase()} in the latest ${labels.blockWord}`,
    utilization: util === null ? DASH : `${util.toFixed(1)}%`,
    txTypes: txTypeSlices(s).map((t) => `${t.name}: ${t.value}`),
    status: statusSlices(s, chain.type).map((t) => `${t.name}: ${t.value} (${formatPercent(t.value, s.total_transactions)})`),
    kinds: txKindRows(s, chain.type).map((k) => `${k.name}: ${k.value.toLocaleString()}`),
    notes: statsNotes(s, unit),
    unit,
  };
}

/** Points the landing dashboard keeps for its charts. */
export const HISTORY_LIMIT = 60;

/** The stats responses in GET /api/dashboards/history, or null if the body is not one. */
export function parseHistory(body: unknown): BlockchainStatsResponse[] | null {
  const b = body as { success?: boolean; points?: unknown } | null;
  if (!b || b.success === false || !Array.isArray(b.points)) return null;
  return b.points.filter(
    (p): p is BlockchainStatsResponse =>
      !!p && typeof p === 'object' &&
      typeof (p as BlockchainStatsResponse).block_number === 'number' &&
      typeof (p as BlockchainStatsResponse).timestamp === 'number' &&
      !!(p as BlockchainStatsResponse).stats,
  );
}

/**
 * Adds responses to the stored ones: one per block number (the newer response
 * wins), ascending by block number, the last `limit` kept.
 */
export function mergeHistory(
  prev: BlockchainStatsResponse[],
  incoming: BlockchainStatsResponse[],
  limit = HISTORY_LIMIT,
): BlockchainStatsResponse[] {
  const byBlock = new Map<number, BlockchainStatsResponse>();
  for (const r of prev) byBlock.set(r.block_number, r);
  for (const r of incoming) byBlock.set(r.block_number, r);
  return [...byBlock.values()].sort((a, b) => a.block_number - b.block_number).slice(-limit);
}

/** Chart points for ascending responses; each point's block time uses the one before it. */
export function historyPoints(responses: BlockchainStatsResponse[], type: ChainKind): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (const r of responses) points.push(historyPoint(r, type, points[points.length - 1]));
  return points;
}

function shortTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * What the history charts cover, e.g. "60 ledgers stored · 05:51–05:57" or
 * "History: 12 blocks sampled since 05:12". `stored` is false when the
 * history endpoint was unavailable and only blocks seen on this page are shown.
 */
export function historyCoverage(responses: BlockchainStatsResponse[], type: ChainKind, stored: boolean): string {
  const n = responses.length;
  if (n === 0) return '';
  const { blockWord } = chainLabels(type);
  const noun = `${blockWord}${n === 1 ? '' : 's'}`;
  const first = responses[0].timestamp;
  const last = responses[n - 1].timestamp;
  const sameDay = new Date(first * 1000).toDateString() === new Date(last * 1000).toDateString();
  const since = sameDay ? shortTime(first) : `${new Date(first * 1000).toLocaleDateString()} ${shortTime(first)}`;
  if (!stored) return `History unavailable: showing ${n} ${noun} observed since ${since}`;
  if (type === 'stellar') return `${n} ${noun} stored · ${since}–${shortTime(last)}`;
  return `History: ${n} ${noun} sampled since ${since}`;
}
