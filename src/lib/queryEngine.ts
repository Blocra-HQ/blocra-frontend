// The SQL engine behind the Query Editor and the Dashboard Builder.
//
// Queries run on the backend (POST /api/query/run) against BlocRA's analytics
// store: SQLite tables of every Stellar ledger with its transactions and
// operations, plus the blocks of other chains sampled whenever their
// dashboard stats were fetched. The SQL is real SQLite (WHERE, GROUP BY,
// aggregates, CTEs, joins), read-only, capped at 1000 rows.
//
// No React and no import.meta here, so it can be exercised from node: callers
// pass the API base URL (API_CONFIG.apiUrl in the app).

export type QueryValue = string | number | boolean | null;
export type QueryRow = Record<string, QueryValue>;

export interface QueryResult {
  /** Output columns in SELECT order. */
  columns: string[];
  rows: QueryRow[];
  row_count: number;
  /** More rows matched than the backend returns (1000). */
  truncated: boolean;
  elapsed_ms: number | null;
}

export interface SchemaColumn {
  name: string;
  type: string;
  description?: string;
}

export interface SchemaTable {
  name: string;
  description?: string;
  columns: SchemaColumn[];
}

export interface ChainCoverage {
  chain: string;
  blocks: number;
  first_block: number | null;
  last_block: number | null;
  first_time: number | null;
  last_time: number | null;
}

export interface QuerySchema {
  tables: SchemaTable[];
  coverage: ChainCoverage[];
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface EngineOptions {
  /** Backend API base, e.g. "https://api.example.com/api". */
  apiUrl: string;
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
}

/** Sample queries that run on the analytics tables. */
export const SAMPLE_QUERIES: { title: string; description: string; sql: string; chart: 'bar' | 'line' | 'pie' | 'table' | 'number' }[] = [
  {
    title: 'Stellar transactions per minute',
    description: 'Transactions in stored ledgers, grouped by minute (UTC)',
    chart: 'line',
    sql: `SELECT strftime('%H:%M', timestamp, 'unixepoch') AS minute,
       SUM(transaction_count) AS txs
FROM blocks
WHERE chain = 'stellar'
GROUP BY minute
ORDER BY minute;`,
  },
  {
    title: 'Stellar failed rate per minute',
    description: 'Share of failed transactions per minute (UTC), in percent',
    chart: 'line',
    sql: `SELECT strftime('%H:%M', timestamp, 'unixepoch') AS minute,
       ROUND(100.0 * SUM(failed_txs) / NULLIF(SUM(transaction_count), 0), 2) AS failed_pct
FROM blocks
WHERE chain = 'stellar' AND failed_txs IS NOT NULL
GROUP BY minute
ORDER BY minute;`,
  },
  {
    title: 'Top 10 Stellar senders',
    description: 'Source accounts with the most transactions',
    chart: 'bar',
    sql: `SELECT sender, COUNT(*) AS txs, SUM(fee) AS fees
FROM transactions
WHERE chain = 'stellar'
GROUP BY sender
ORDER BY txs DESC
LIMIT 10;`,
  },
  {
    title: 'Stellar operation types',
    description: 'Operations by type across stored ledgers',
    chart: 'pie',
    sql: `SELECT type, COUNT(*) AS operations
FROM operations
WHERE chain = 'stellar'
GROUP BY type
ORDER BY operations DESC;`,
  },
  {
    title: 'Fees per Stellar ledger',
    description: 'Total fees in the latest 50 stored ledgers',
    chart: 'line',
    sql: `SELECT block_number AS ledger, total_fees
FROM (
  SELECT block_number, total_fees
  FROM blocks
  WHERE chain = 'stellar'
  ORDER BY block_number DESC
  LIMIT 50
)
ORDER BY ledger;`,
  },
  {
    title: 'Blocks stored per chain',
    description: 'How many blocks or ledgers the store holds for each chain',
    chart: 'bar',
    sql: `SELECT chain, COUNT(*) AS blocks,
       datetime(MIN(timestamp), 'unixepoch') AS first_seen,
       datetime(MAX(timestamp), 'unixepoch') AS last_seen
FROM blocks
GROUP BY chain
ORDER BY blocks DESC;`,
  },
];

function stripComments(sql: string): string {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Instant client-side check before sending a query; the backend enforces
 * read-only access itself. Returns an error message, or null when the query
 * may run.
 */
export function validateSQL(sql: string): string | null {
  if (!sql.trim()) return 'Query cannot be empty';

  // Look at the SQL outside string literals and comments.
  const code = stripComments(sql).replace(/'(?:[^']|'')*'/g, "''").trim();
  if (!code) return 'Query cannot be empty';
  if (!/^(select|with)\b/i.test(code)) {
    return 'Only read-only queries are allowed: the query must start with SELECT or WITH.';
  }
  const dangerous = code.match(/\b(drop|delete|update|insert|alter|create|truncate|attach|detach|pragma|vacuum|reindex)\b/i);
  if (dangerous) {
    return `'${dangerous[1].toUpperCase()}' is not allowed. Only SELECT queries are permitted.`;
  }

  let openParens = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  const text = stripComments(sql);
  for (const char of text) {
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote) {
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (openParens < 0) return 'Invalid SQL: unmatched closing parenthesis.';
    }
  }
  if (inSingleQuote) return 'Invalid SQL: unclosed single quote.';
  if (inDoubleQuote) return 'Invalid SQL: unclosed double quote.';
  if (openParens > 0) return 'Invalid SQL: unmatched opening parenthesis.';
  return null;
}

/** The SQL in an AI reply: strips ```sql fences and surrounding prose. */
export function extractSQL(text: string): string {
  const fenced = text.match(/```(?:sql|sqlite)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/\b(select|with)\b/i);
  return start > 0 && !fenced ? body.slice(start).trim() : body;
}

function joinUrl(apiUrl: string, path: string): string {
  return `${apiUrl.replace(/\/+$/, '')}/${path}`;
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const body = JSON.parse(text);
    if (body && typeof body.message === 'string' && body.message) return body.message;
    if (body && typeof body.error === 'string' && body.error) return body.error;
  } catch {
    // not JSON
  }
  if (res.status === 404) return 'The query service is not available on this backend (404).';
  if (res.status === 429) return 'Too many queries; wait a moment and try again.';
  return text.trim() && text.length < 300 ? text.trim() : `Query failed (HTTP ${res.status})`;
}

function toValue(v: unknown): QueryValue {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' || typeof v === 'boolean') return v;
  return JSON.stringify(v);
}

/** Runs a query and returns columns, rows and execution details. */
export async function runQueryDetailed(sql: string, options: EngineOptions): Promise<QueryResult> {
  const error = validateSQL(sql);
  if (error) throw new Error(error);
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));

  let res: Response;
  try {
    res = await fetchImpl(joinUrl(options.apiUrl, 'query/run'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sql.trim() }),
      signal: options.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new Error(`Could not reach the BlocRA backend: ${e?.message ?? e}`);
  }
  if (!res.ok) throw new Error(await readError(res));

  const body: any = await res.json().catch(() => null);
  if (!body || body.success === false) {
    throw new Error(body?.message || 'The backend returned an invalid query response');
  }
  const rawRows: unknown[] = Array.isArray(body.rows) ? body.rows : [];
  const columns: string[] = Array.isArray(body.columns)
    ? body.columns.map(String)
    : rawRows.length > 0 && rawRows[0] && typeof rawRows[0] === 'object' ? Object.keys(rawRows[0] as object) : [];
  const rows: QueryRow[] = rawRows.map((r) => {
    const row: QueryRow = {};
    if (Array.isArray(r)) {
      columns.forEach((c, i) => { row[c] = toValue(r[i]); });
    } else if (r && typeof r === 'object') {
      for (const c of columns) row[c] = toValue((r as Record<string, unknown>)[c]);
    }
    return row;
  });
  return {
    columns,
    rows,
    row_count: typeof body.row_count === 'number' ? body.row_count : rows.length,
    truncated: body.truncated === true,
    elapsed_ms: typeof body.elapsed_ms === 'number' ? body.elapsed_ms : null,
  };
}

/** Runs a query and returns its rows. Throws a readable Error on failure. */
export async function runQuery(sql: string, options: EngineOptions): Promise<QueryRow[]> {
  return (await runQueryDetailed(sql, options)).rows;
}

/** Tables, columns and per-chain data coverage of the analytics store. */
export async function fetchQuerySchema(options: EngineOptions): Promise<QuerySchema> {
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const res = await fetchImpl(joinUrl(options.apiUrl, 'query/schema'), { signal: options.signal });
  if (!res.ok) throw new Error(await readError(res));
  const body: any = await res.json();
  if (!body || body.success === false) throw new Error(body?.message || 'Invalid schema response');
  return {
    tables: Array.isArray(body.tables) ? body.tables : [],
    coverage: Array.isArray(body.coverage) ? body.coverage : [],
  };
}

function clock(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** "stellar: 1,234 ledgers, 05:51–06:30" (with dates when the range spans days). */
export function formatCoverage(c: ChainCoverage): string {
  const unit = c.chain === 'stellar' ? (c.blocks === 1 ? 'ledger' : 'ledgers') : (c.blocks === 1 ? 'block' : 'blocks');
  let range = '';
  if (c.first_time && c.last_time) {
    const a = new Date(c.first_time * 1000);
    const b = new Date(c.last_time * 1000);
    range = a.toDateString() === b.toDateString()
      ? `, ${clock(c.first_time)}–${clock(c.last_time)}`
      : `, ${a.toLocaleDateString()} ${clock(c.first_time)} – ${b.toLocaleDateString()} ${clock(c.last_time)}`;
  }
  return `${c.chain}: ${c.blocks.toLocaleString()} ${unit}${range}`;
}
