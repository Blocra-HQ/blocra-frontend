// RFC 4180 CSV for query results and exports. Pure, so it can be tested from node.

/** One CSV field: quoted when it holds a comma, quote, CR/LF or edge whitespace. */
export function csvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV text for rows; columns default to every key in first-seen order. */
export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [cols.map(csvField).join(',')];
  for (const row of rows) lines.push(cols.map((c) => csvField(row[c])).join(','));
  return lines.join('\r\n') + '\r\n';
}

/** Starts a browser download of `content`. */
export function downloadText(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
