// Deterministic outlier checks over the events actually loaded for a
// contract. No sampling, no guesses: each finding names the method, the
// threshold and the real blocks/transactions it comes from.

export interface EventAnomaly {
  type: 'large_transfer' | 'block_spike';
  severity: 'medium' | 'high';
  description: string;
  method: string;
  blocks: number[];
}

const LARGE_TRANSFER_X = 10; // amount ≥ 10× the median transfer
const BLOCK_SPIKE_X = 5; // events in one block ≥ 5× the median per active block
const MIN_SAMPLE = 10;

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function amountOf(ev: any): number {
  const raw = ev?.decoded_data?.amount ?? ev?.decoded_data?.value;
  if (raw === undefined || raw === null || raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export class EventAnomalyService {
  static detect(events: any[]): EventAnomaly[] {
    const out: EventAnomaly[] = [];
    const large = this.largeTransfers(events);
    if (large) out.push(large);
    const spike = this.blockSpikes(events);
    if (spike) out.push(spike);
    return out;
  }

  // Transfers whose amount is far above the median transfer in the sample.
  private static largeTransfers(events: any[]): EventAnomaly | null {
    const transfers = events
      .map(ev => ({ ev, amount: amountOf(ev) }))
      .filter(t => t.amount > 0 && /transfer/i.test(t.ev?.event_name || ''));
    if (transfers.length < MIN_SAMPLE) return null;

    const med = median(transfers.map(t => t.amount));
    if (med <= 0) return null;
    const outliers = transfers.filter(t => t.amount >= med * LARGE_TRANSFER_X);
    if (outliers.length === 0) return null;

    const top = outliers.reduce((a, b) => (b.amount > a.amount ? b : a));
    const blocks = [...new Set(outliers.map(t => Number(t.ev.block_number)).filter(Number.isFinite))].sort((a, b) => a - b);
    return {
      type: 'large_transfer',
      severity: top.amount >= med * 100 ? 'high' : 'medium',
      description: `${outliers.length} of ${transfers.length} transfers are at least ${LARGE_TRANSFER_X}× the median amount; the largest is ${(top.amount / med).toFixed(0)}× the median (block ${top.ev.block_number}).`,
      method: `Transfer amount ≥ ${LARGE_TRANSFER_X}× median of the ${transfers.length} loaded transfers`,
      blocks,
    };
  }

  // Blocks carrying far more of this contract's events than a typical active block.
  private static blockSpikes(events: any[]): EventAnomaly | null {
    const perBlock = new Map<number, number>();
    for (const ev of events) {
      const b = Number(ev?.block_number);
      if (!Number.isFinite(b)) continue;
      perBlock.set(b, (perBlock.get(b) || 0) + 1);
    }
    if (perBlock.size < MIN_SAMPLE) return null;

    const med = median([...perBlock.values()]);
    const spikes = [...perBlock.entries()].filter(([, n]) => n >= Math.max(med * BLOCK_SPIKE_X, med + 3));
    if (spikes.length === 0) return null;

    const [peakBlock, peak] = spikes.reduce((a, b) => (b[1] > a[1] ? b : a));
    return {
      type: 'block_spike',
      severity: peak >= med * BLOCK_SPIKE_X * 2 ? 'high' : 'medium',
      description: `${spikes.length} block${spikes.length === 1 ? '' : 's'} carried at least ${BLOCK_SPIKE_X}× the median ${med} event${med === 1 ? '' : 's'} per active block; the peak is ${peak} events in block ${peakBlock}.`,
      method: `Events per block ≥ ${BLOCK_SPIKE_X}× median over ${perBlock.size} active blocks in the sample`,
      blocks: spikes.map(([b]) => b).sort((a, b) => a - b),
    };
  }
}
