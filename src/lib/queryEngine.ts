// The SQL engine behind the Query Editor and the Dashboard Builder.
//
// There is no SQL database: a query picks a table (blocks or transactions),
// the rows are read live from Starknet JSON-RPC, then the SELECT column list,
// a single-column ORDER BY and LIMIT are applied in the browser. WHERE,
// GROUP BY and joins are not evaluated.
//
// No React and no import.meta here, so it can be exercised from node.

export type QueryValue = string | number | boolean | null;
export type QueryRow = Record<string, QueryValue>;

export const QUERY_TABLES = {
  blocks: ['block_number', 'timestamp', 'transaction_count', 'gas_used', 'hash'],
  transactions: ['transaction_hash', 'sender_address', 'max_fee', 'version', 'nonce', 'type'],
} as const;

export type QueryTable = keyof typeof QUERY_TABLES;

const MAX_BLOCKS = 50;
const DEFAULT_BLOCKS = 10;
const DEFAULT_TRANSACTIONS = 100;
const RPC_TIMEOUT_MS = 10_000;

function stripComments(sql: string): string {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Returns an error message, or null when the query may run. */
export function validateSQL(sql: string): string | null {
  const trimmedSQL = sql.trim();
  if (!trimmedSQL) return 'Query cannot be empty';

  const lowerSQL = trimmedSQL.toLowerCase();
  const dangerousKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
  for (const keyword of dangerousKeywords) {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(lowerSQL)) {
      return `Dangerous operation '${keyword.toUpperCase()}' is not allowed. Only SELECT queries are permitted.`;
    }
  }

  const sqlWithoutComments = stripComments(lowerSQL).trim();
  if (!sqlWithoutComments.startsWith('select')) {
    return 'Only SELECT queries are allowed. Query must start with SELECT.';
  }
  if (!/\bfrom\b/.test(sqlWithoutComments)) {
    return 'Invalid SQL: Missing FROM clause.';
  }

  let openParens = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '';
    if (char === "'" && prevChar !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote) {
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (openParens < 0) return 'Invalid SQL: Unmatched closing parenthesis.';
    }
  }
  if (openParens > 0) return 'Invalid SQL: Unmatched opening parenthesis.';
  if (inSingleQuote) return 'Invalid SQL: Unclosed single quote.';
  if (inDoubleQuote) return 'Invalid SQL: Unclosed double quote.';
  return null;
}

export interface ParsedQuery {
  table: QueryTable;
  /** Output columns in SELECT order; null means SELECT *. */
  columns: { source: string; alias: string }[] | null;
  orderBy: { column: string; desc: boolean } | null;
  limit: number | null;
}

/** Parses the parts of a SELECT the engine evaluates. Throws on errors. */
export function parseQuery(sql: string): ParsedQuery {
  const error = validateSQL(sql);
  if (error) throw new Error(error);
  const text = stripComments(sql).replace(/;\s*$/, '').trim();

  const fromMatch = text.match(/\bfrom\s+([a-z_][a-z0-9_]*)/i);
  const tableName = fromMatch?.[1].toLowerCase();
  if (!tableName || !(tableName in QUERY_TABLES)) {
    throw new Error(`Unsupported table${tableName ? ` '${tableName}'` : ''}. Available tables: ${Object.keys(QUERY_TABLES).join(', ')}`);
  }
  const table = tableName as QueryTable;
  const known: readonly string[] = QUERY_TABLES[table];

  const selectList = text.match(/^select\s+([\s\S]*?)\s+from\s/i)?.[1].trim() ?? '*';
  let columns: ParsedQuery['columns'] = null;
  if (selectList !== '*') {
    columns = selectList.split(',').map((part) => {
      const m = part.trim().match(/^([a-z_][a-z0-9_]*)(?:\s+(?:as\s+)?([a-z_][a-z0-9_]*))?$/i);
      if (!m) {
        throw new Error(`Only plain column names are supported in SELECT (got '${part.trim()}'). Columns of ${table}: ${known.join(', ')}`);
      }
      const source = m[1].toLowerCase();
      if (!known.includes(source)) {
        throw new Error(`Unknown column '${m[1]}' in ${table}. Columns: ${known.join(', ')}`);
      }
      return { source, alias: m[2] ?? source };
    });
  }

  let orderBy: ParsedQuery['orderBy'] = null;
  const orderMatch = text.match(/\border\s+by\s+([a-z_][a-z0-9_]*)(?:\s+(asc|desc))?/i);
  if (orderMatch) {
    const name = orderMatch[1].toLowerCase();
    const alias = columns?.find((c) => c.alias.toLowerCase() === name);
    const column = alias ? alias.source : name;
    if (!known.includes(column)) {
      throw new Error(`Unknown ORDER BY column '${orderMatch[1]}'. Columns of ${table}: ${known.join(', ')}`);
    }
    orderBy = { column, desc: orderMatch[2]?.toLowerCase() === 'desc' };
  }

  const limitMatch = text.match(/\blimit\s+(\d+)/i);
  return { table, columns, orderBy, limit: limitMatch ? parseInt(limitMatch[1], 10) : null };
}

function compare(a: QueryValue, b: QueryValue): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/** Applies ORDER BY, LIMIT and the SELECT list to rows read for a table. */
export function shapeRows(rows: QueryRow[], parsed: ParsedQuery): QueryRow[] {
  let out = rows;
  if (parsed.orderBy) {
    const { column, desc } = parsed.orderBy;
    out = [...out].sort((x, y) => (desc ? -1 : 1) * compare(x[column] ?? null, y[column] ?? null));
  }
  if (parsed.limit !== null) out = out.slice(0, parsed.limit);
  if (parsed.columns) {
    const cols = parsed.columns;
    out = out.map((row) => Object.fromEntries(cols.map((c) => [c.alias, row[c.source] ?? null])));
  }
  return out;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function rpc(endpoint: string, method: string, params: unknown[], fetchImpl: FetchLike, id = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`RPC request failed: ${res.status}`);
    const body = await res.json();
    if (body.error) throw new Error(body.error.message || `RPC error in ${method}`);
    return body.result;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Request timeout - please try again with a smaller limit');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  // Starknet 0.13+ reports gas as { l1_gas, l1_data_gas, l2_gas }-style objects.
  return null;
}

async function fetchBlocks(endpoint: string, count: number, fetchImpl: FetchLike): Promise<QueryRow[]> {
  const head = toNumber(await rpc(endpoint, 'starknet_blockNumber', [], fetchImpl));
  if (head === null) throw new Error('Invalid block number response');

  const rows: QueryRow[] = [];
  for (let i = 0; i < count; i += 5) {
    const batch = [];
    for (let j = 0; j < Math.min(5, count - i); j++) {
      const n = head - (i + j);
      if (n < 0) break;
      batch.push(
        rpc(endpoint, 'starknet_getBlockWithTxHashes', [{ block_number: n }], fetchImpl, n).then((b: any) => ({
          block_number: b?.block_number ?? n,
          timestamp: toNumber(b?.timestamp),
          transaction_count: Array.isArray(b?.transactions) ? b.transactions.length : null,
          gas_used: toNumber(b?.gas_consumed ?? b?.gas_used),
          hash: typeof b?.block_hash === 'string' ? b.block_hash : null,
        })),
      );
    }
    rows.push(...(await Promise.all(batch)));
  }
  return rows;
}

async function fetchTransactions(endpoint: string, fetchImpl: FetchLike): Promise<QueryRow[]> {
  const block = await rpc(endpoint, 'starknet_getBlockWithTxs', ['latest'], fetchImpl);
  const txs: any[] = Array.isArray(block?.transactions) ? block.transactions : [];
  return txs.map((tx) => ({
    transaction_hash: tx.transaction_hash ?? null,
    sender_address: tx.sender_address ?? null,
    max_fee: tx.max_fee ?? null,
    version: tx.version ?? null,
    nonce: tx.nonce ?? null,
    type: tx.type ?? null,
  }));
}

/**
 * Runs a query against the first Starknet endpoint that answers.
 * Throws with a readable message when the query is invalid or every
 * endpoint fails; never fills in values it could not read.
 */
export async function runQuery(sql: string, endpoints: string[], fetchImpl: FetchLike = (input, init) => fetch(input, init)): Promise<QueryRow[]> {
  const parsed = parseQuery(sql);
  if (endpoints.length === 0) throw new Error('No Starknet RPC endpoint is configured');

  let lastError: Error | null = null;
  for (const endpoint of endpoints) {
    try {
      const rows = parsed.table === 'blocks'
        ? await fetchBlocks(
            endpoint,
            Math.min(parsed.limit ?? DEFAULT_BLOCKS, MAX_BLOCKS),
            fetchImpl,
          )
        : (await fetchTransactions(endpoint, fetchImpl)).slice(0, parsed.orderBy ? undefined : parsed.limit ?? DEFAULT_TRANSACTIONS);
      return shapeRows(rows, parsed);
    } catch (e: any) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw new Error(`Failed to fetch ${parsed.table} from Starknet RPC: ${lastError?.message ?? 'all endpoints failed'}`);
}
