// Browse the blocks, transactions and operations BlocRA has stored, straight
// from the backend's analytics store (POST /api/query/run). Nothing here is
// generated client-side: an empty store shows an empty table.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, RefreshCw, Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_CONFIG } from "@/config/api";
import {
  fetchQuerySchema,
  formatCoverage,
  runQueryDetailed,
  type ChainCoverage,
  type QueryResult,
  type QueryValue,
} from "@/lib/queryEngine";

type View = "blocks" | "transactions" | "operations";

const PAGE_SIZE = 50;

interface ViewDef {
  label: string;
  columns: string;
  filterHint: string;
  /** WHERE clause for the search text (already escaped), or null when it doesn't apply. */
  filter: (q: string, isNumber: boolean) => string;
  order: string;
}

const VIEWS: Record<View, ViewDef> = {
  blocks: {
    label: "Blocks / ledgers",
    columns:
      "block_number, timestamp, transaction_count, successful_txs, failed_txs, unique_senders, operation_count, total_fees, fee_unit",
    filterHint: "Block or ledger number",
    filter: (q, isNumber) => (isNumber ? `block_number = ${q}` : "0"),
    order: "block_number DESC",
  },
  transactions: {
    label: "Transactions",
    columns: "block_number, timestamp, hash, sender, fee, fee_unit, operation_count, successful",
    filterHint: "Hash, sender or block number",
    filter: (q, isNumber) =>
      isNumber ? `block_number = ${q}` : `(hash = '${q}' OR sender = '${q}')`,
    order: "block_number DESC, hash",
  },
  operations: {
    label: "Operations",
    columns: "block_number, timestamp, tx_hash, type, source",
    filterHint: "Type, source, tx hash or block number",
    filter: (q, isNumber) =>
      isNumber ? `block_number = ${q}` : `(type = '${q}' OR source = '${q}' OR tx_hash = '${q}')`,
    order: "block_number DESC, id",
  },
};

function sqlString(s: string): string {
  return s.replace(/'/g, "''");
}

/** Hashes, addresses, operation types and block numbers only use these characters. */
function cleanSearch(s: string): string {
  return s.trim().replace(/[^A-Za-z0-9_:.]/g, "");
}

function formatCell(column: string, value: QueryValue): string {
  if (value === null || value === undefined) return "—";
  if (column === "timestamp" && typeof value === "number") {
    return new Date(value * 1000).toLocaleString();
  }
  if (column === "successful") return value === 1 || value === true ? "yes" : value === 0 || value === false ? "no" : String(value);
  if (typeof value === "number") return value.toLocaleString(undefined, { maximumFractionDigits: 7 });
  return String(value);
}

function isLong(column: string): boolean {
  return column === "hash" || column === "tx_hash" || column === "sender" || column === "source";
}

export function DataExplorer() {
  const [coverage, setCoverage] = useState<ChainCoverage[]>([]);
  const [chain, setChain] = useState<string>("stellar");
  const [view, setView] = useState<View>("blocks");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchQuerySchema({ apiUrl: API_CONFIG.apiUrl, signal: controller.signal })
      .then((schema) => {
        setCoverage(schema.coverage);
        if (schema.coverage.length > 0 && !schema.coverage.some((c) => c.chain === "stellar")) {
          setChain(schema.coverage[0].chain);
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") console.warn("Query schema unavailable:", e);
      });
    return () => controller.abort();
  }, []);

  const sql = useMemo(() => {
    const def = VIEWS[view];
    const where = [`chain = '${sqlString(chain)}'`];
    const q = cleanSearch(appliedSearch);
    if (q) where.push(def.filter(q, /^\d+$/.test(q)));
    return `SELECT ${def.columns}
FROM ${view}
WHERE ${where.join(" AND ")}
ORDER BY ${def.order}
LIMIT ${PAGE_SIZE} OFFSET ${page * PAGE_SIZE};`;
  }, [view, chain, appliedSearch, page]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        setResult(await runQueryDetailed(sql, { apiUrl: API_CONFIG.apiUrl, signal }));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setResult(null);
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    },
    [sql],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const chains = coverage.length > 0 ? coverage.map((c) => c.chain) : [chain];
  const currentCoverage = coverage.find((c) => c.chain === chain);
  const columns = result?.columns ?? [];
  const rows = result?.rows ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Data Explorer
          </h1>
          <p className="text-sm text-muted-foreground">
            The blocks, transactions and operations stored in BlocRA's analytics database, newest first.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {coverage.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {coverage.map((c) => (
            <Badge key={c.chain} variant={c.chain === chain ? "default" : "secondary"}>
              {formatCoverage(c)}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <Tabs
              value={view}
              onValueChange={(v) => {
                setView(v as View);
                setPage(0);
              }}
            >
              <TabsList>
                {(Object.keys(VIEWS) as View[]).map((v) => (
                  <TabsTrigger key={v} value={v}>
                    {VIEWS[v].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Select
                value={chain}
                onValueChange={(c) => {
                  setChain(c);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedSearch(cleanSearch(search));
                  setPage(0);
                }}
              >
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={VIEWS[view].filterHint}
                  className="w-64"
                />
                <Button type="submit" variant="secondary" size="icon" aria-label="Search">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
          <CardTitle className="text-base">{VIEWS[view].label}</CardTitle>
          <CardDescription>
            {currentCoverage
              ? `${formatCoverage(currentCoverage)} stored.`
              : "Coverage depends on what the backend has collected."}
            {appliedSearch.trim() && ` Filtered by "${appliedSearch.trim()}".`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-start gap-2 text-sm text-destructive py-6">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {loading ? "Loading…" : "No rows stored for this selection."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c} className="whitespace-nowrap">
                        {c}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={`${page}-${i}`}>
                      {columns.map((c) => (
                        <TableCell
                          key={c}
                          className={`text-xs ${isLong(c) ? "font-mono max-w-[14rem] truncate" : "whitespace-nowrap"}`}
                          title={isLong(c) ? String(row[c] ?? "") : undefined}
                        >
                          {formatCell(c, row[c])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <span>
              {rows.length > 0
                ? `Rows ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + rows.length}`
                : ""}
              {result?.elapsed_ms != null ? ` · ${result.elapsed_ms} ms` : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Newer
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={rows.length < PAGE_SIZE || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Older <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
