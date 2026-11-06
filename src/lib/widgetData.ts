// Turns query result rows into what a Dashboard Builder widget draws.
// Pure functions, no React, so they can be tested from node.

export type WidgetType = 'bar' | 'line' | 'pie' | 'table' | 'number';
export const WIDGET_TYPES: WidgetType[] = ['bar', 'line', 'pie', 'table', 'number'];

export type Row = Record<string, unknown>;

export interface WidgetPoint {
  label: string;
  value: number;
}

export interface WidgetView {
  /** All columns, in first-seen order (what a table shows). */
  columns: string[];
  rows: Row[];
  /** Points for bar/line/pie/number; empty for tables. */
  points: WidgetPoint[];
  labelColumn?: string;
  valueColumn?: string;
  /** Why the rows can't be drawn as this widget type. */
  error?: string;
}

const DECIMAL = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/;

/** A finite number, or a decimal string. Hex strings (hashes, felts) are text. */
export function toNumeric(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && DECIMAL.test(v.trim())) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function columnsOf(rows: Row[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) for (const k of Object.keys(row)) seen.add(k);
  return [...seen];
}

/** A column is numeric when it has a value and every value is numeric. */
function isNumericColumn(rows: Row[], col: string): boolean {
  let any = false;
  for (const row of rows) {
    const v = row[col];
    if (v === null || v === undefined || v === '') continue;
    if (toNumeric(v) === null) return false;
    any = true;
  }
  return any;
}

export function humanize(column: string): string {
  const s = column.replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * First text column -> label, first numeric column -> value. With no text
 * column, the first column labels the points and the next numeric column is
 * the value (e.g. block_number, transaction_count). A number widget shows the
 * value column of the first row.
 */
export function mapRowsToWidget(rows: Row[], type: WidgetType): WidgetView {
  const columns = columnsOf(rows);
  const view: WidgetView = { columns, rows, points: [] };
  if (type === 'table' || rows.length === 0) return view;

  const numeric = columns.filter((c) => isNumericColumn(rows, c));
  const text = columns.filter((c) => !numeric.includes(c));

  if (type === 'number') {
    const valueColumn = numeric[0];
    if (!valueColumn) {
      return { ...view, error: `No numeric column to show (columns: ${columns.join(', ')})` };
    }
    const value = toNumeric(rows[0][valueColumn]);
    if (value === null) return { ...view, valueColumn, error: `${valueColumn} is empty in the first row` };
    return { ...view, valueColumn, points: [{ label: humanize(valueColumn), value }] };
  }

  let labelColumn = text[0];
  let valueColumn = numeric[0];
  if (!labelColumn && numeric.length >= 2) {
    labelColumn = columns[0];
    valueColumn = numeric.find((c) => c !== labelColumn);
  }
  if (!valueColumn) {
    return { ...view, error: `No numeric column to plot (columns: ${columns.join(', ')})` };
  }
  if (!labelColumn) {
    return { ...view, valueColumn, error: `Need a label column besides ${valueColumn} to draw a ${type} chart` };
  }

  const points: WidgetPoint[] = [];
  for (const row of rows) {
    const value = toNumeric(row[valueColumn]);
    if (value === null) continue; // skip rows without a value rather than plotting 0
    const raw = row[labelColumn];
    points.push({ label: raw === null || raw === undefined ? '—' : String(raw), value });
  }
  if (type === 'pie' && points.some((p) => p.value < 0)) {
    return { ...view, labelColumn, valueColumn, error: 'A pie chart cannot show negative values' };
  }
  return { ...view, labelColumn, valueColumn, points };
}

interface Box { position: { x: number; y: number }; size: { width: number; height: number } }

/**
 * Top-left position for a new widget of `size` that doesn't overlap the
 * existing ones: left to right, then top to bottom, in 20px steps.
 */
export function findFreeSpot(existing: Box[], size: Box['size'], canvasWidth: number, gap = 20): { x: number; y: number } {
  const overlaps = (x: number, y: number) =>
    existing.some((w) =>
      x < w.position.x + w.size.width + gap &&
      x + size.width + gap > w.position.x &&
      y < w.position.y + w.size.height + gap &&
      y + size.height + gap > w.position.y,
    );
  const maxX = Math.max(gap, canvasWidth - size.width - gap);
  for (let y = gap; y < 20_000; y += gap) {
    for (let x = gap; x <= maxX; x += gap) {
      if (!overlaps(x, y)) return { x, y };
    }
  }
  return { x: gap, y: gap };
}
