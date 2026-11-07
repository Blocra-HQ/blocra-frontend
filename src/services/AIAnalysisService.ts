// Statistical event summary used when the AI analyst is unavailable.
// Every figure comes from the events loaded on the page (or the stats
// computed from them); anything that can't be measured from events is
// stated as not measured rather than estimated.

function short(addr: string): string {
  return addr && addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : addr;
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : 'n/a';
}

export class AIAnalysisService {
  static async generateBlockcraReport(data: {
    contractAddress: string;
    contractName: string;
    contractInfo: any;
    stats: any;
    events: any[];
    chain?: string;
  }): Promise<string> {
    const { contractAddress, contractName, contractInfo, stats, events, chain } = data;
    const s = stats || {};
    const totalEvents: number = s.totalEvents ?? events.length;
    const uniqueUsers: number = s.uniqueUsers ?? 0;
    const repeatUsers: number | undefined = s.repeatUsers;
    const eventTypes: Record<string, number> = s.eventTypes || {};
    const typeLines = Object.entries(eventTypes)
      .sort(([, a], [, b]) => b - a)
      .map(([name, n]) => `• ${name}: ${n} (${pct(n, totalEvents)})`);

    // Busiest block, measured from the events themselves.
    const perBlock = new Map<number, number>();
    for (const ev of events) {
      const b = Number(ev?.block_number);
      if (Number.isFinite(b)) perBlock.set(b, (perBlock.get(b) || 0) + 1);
    }
    let peakBlock: number | undefined;
    let peakCount = 0;
    perBlock.forEach((n, b) => { if (n > peakCount) { peakCount = n; peakBlock = b; } });

    const topCallers: { address: string; calls: number }[] = s.topCallers || [];
    const callerLines = topCallers.map((c, i) => `${i + 1}. ${short(c.address)}: ${c.calls} events (${pct(c.calls, totalEvents)})`);
    const top5Share = topCallers.reduce((sum, c) => sum + Number(c.calls || 0), 0);

    const decoded = events.filter(e => e?.decoded_data && Object.keys(e.decoded_data).length > 0).length;
    const range = s.dateRange;

    return `**EVENT SUMMARY**

${contractInfo?.contractType || 'Contract'} "${contractName}"${chain ? ` on ${chain}` : ''}
Address: ${contractAddress}

This summary covers the ${totalEvents} events loaded on this page${range ? `, from block ${range.from} to block ${range.to} (${range.span} blocks)` : ''}. It describes that sample only, not the contract's full history.

**ACTIVITY**

• Events: ${totalEvents}
• Transactions: ${s.totalTransactions ?? 'n/a'}
• Blocks with activity: ${s.uniqueBlocks ?? perBlock.size}
• Events per active block: ${s.avgEventsPerBlock ?? 'n/a'}
• Events per transaction: ${s.avgEventsPerTx ?? 'n/a'}
• Busiest block: ${peakBlock !== undefined ? `${peakBlock} with ${peakCount} events` : 'n/a'}

**EVENT TYPES**

${typeLines.length ? typeLines.join('\n') : '• None decoded'}

**ADDRESSES**

• Unique addresses in decoded event data: ${uniqueUsers}
• Addresses seen in more than one transaction: ${repeatUsers !== undefined ? `${repeatUsers} (${pct(repeatUsers, uniqueUsers)})` : 'not measured'}
${callerLines.length ? `\nMost active senders:\n${callerLines.join('\n')}\nTop ${topCallers.length} share of events: ${pct(top5Share, totalEvents)}` : ''}

**TRANSFERS**

${s.hasTransfers ? `• Transfer events: ${s.transferCount ?? 'n/a'}\n• Total amount transferred: ${s.totalVolume ?? 'n/a'} (token units)` : '• No Transfer events in this sample'}

**DATA QUALITY**

• Events with decoded data: ${decoded} of ${events.length}

**NOT MEASURED**

Failure rate, gas/fees and account types (bots, whales, DAOs) are not part of this summary: events are only emitted by successful transactions and carry no fee or account-type information.`;
  }
}
