<div align="center">

<img src="public/blocra-logo.png" width="88" alt="BlocRA logo" />

# blocra-frontend

The web app for **BlocRA**, a blockchain analytics platform built for Stellar.

React · TypeScript · Vite · Tailwind CSS · Stellar SDK · Freighter

</div>

---

## Overview

BlocRA is Stellar analytics: explore network activity, analyze Soroban contracts, query collected
ledger data with SQL, build dashboards, and produce traction reports that can be verified on Stellar.
The backend collects every Stellar ledger, so dashboards, SQL and reports run on complete Stellar
data. For comparison, the network dashboard and contract analysis also cover 36 other chains:
Starknet, Solana, 31 EVM networks (Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Smart Chain,
Avalanche and others) and three Cosmos SDK chains (Axelar, Celer, Saga).

This repository is the browser app. It works with:

| Repo | Role |
|------|------|
| [blocra-backend](https://github.com/Blocra-HQ/blocra-backend) | Rust API: network stats, AI analyst, Stellar sign-in, saved queries |
| [blocra-contracts](https://github.com/Blocra-HQ/blocra-contracts) | Soroban report registry contract |
| [blocra-research](https://github.com/Blocra-HQ/blocra-research) | Verified chain and RPC registry the app's chain list is generated from |

## Features

| Page | Route | What it does |
|------|-------|--------------|
| Dashboard | `/` | Live stats for the selected chain's latest ledger or block, from the backend: transactions, active users, gas (compute units on Solana, operations on Stellar), fees in the chain's fee token, success rate, and transaction, message or operation types. EVM chains also show transfers vs contract calls and block utilization. Figures the backend cannot read exactly show as "—" with a note. Charts start from the blocks the backend has stored (the last 60) and add new ones as they arrive; a line above them says what they cover. |
| Contract Analysis | `/contract-events-eda` | Fetches a contract's events and activity: Soroban contracts through Stellar RPC `getEvents` (and, for comparison, EVM contracts through logs, Starknet through `starknet_getEvents`). Shows event mix, users, transfer volume, top callers and timelines, with CSV/JSON/image export. Not yet available for Cosmos chains. |
| Reports | `/reports` | Verifiable Stellar traction report for a Soroban contract or an asset (see [Reports](#reports)). Stellar contracts in Contract Analysis link here. |
| Event summary | in Contract Analysis (non-Stellar chains) | A written summary of the loaded events by the backend AI analyst, or a statistical summary labelled as such when no AI is configured. Download as PDF or DOCX. |
| Publish and verify | `/verify-report` | Checks a report file in the browser (it is never uploaded): a `.md` or `.json` traction report against BlocRA's Ed25519 signature, the same check as `npx blocra verify`, and any file (including PDF/DOCX) against the on-chain report registry. "Publish on Stellar" records an exported file's sha256 in that registry, signed with Freighter. See [Verify](#verify). |
| Query editor | `/query` | SQL over the backend's analytics store (stored Stellar ledgers, transactions and operations; sampled blocks of other chains), with schema and data coverage, sample queries, CSV export and natural-language-to-SQL from the AI analyst. |
| Dashboard builder | `/builder` | Charts, tables and numbers from SQL queries, arranged on a canvas; saved to your account, exported as PNG or JSON, imported from JSON. |
| Library | `/library` | Saved queries and dashboards. |
| AI analyst chat | floating button | Conversation with the backend AI, aware of the selected chain. |
| Wallet sign-in | header | Connect Freighter and sign a one-time challenge (SEP-53) to get a session from the backend. |

## How data flows

```
                       ┌───────────────────────────────┐
                       │          blocra-frontend       │
                       └───┬──────────────┬─────────┬───┘
         REST (VITE_BACKEND_URL)          │         │ sign
                           │              │         ▼
                           ▼              │     Freighter
                  ┌─────────────────┐     │    (Stellar wallet)
                  │ blocra-backend  │     │
                  │ Stellar ledger  │     │ JSON-RPC from the browser
                  │ collector, SQL, │     │
                  │ reports, AI,    │     ▼
                  │ auth            │   Soroban RPC (contract events,
                  └───┬─────────┬───┘   report registry); EVM, Starknet
                      │         │       and Solana RPCs for comparison
                Horizon (every  AI provider
                ledger); other  (gpt-oss)
                chains' RPCs
```

- **Backend:** collects every Stellar ledger into its analytics store and serves the network dashboard
  and its history, SQL, traction reports, the AI analyst, Stellar wallet sign-in, saved queries and
  dashboards.
- **Directly from the browser:** contract events and the report registry are read from public RPCs.
  Every endpoint in `src/config/chains.ts` was checked for a live, current head block and a browser CORS preflight
  in [blocra-research](https://github.com/Blocra-HQ/blocra-research).
- **Freighter:** signs the sign-in challenge and report-registry transactions. Keys never leave the wallet.

## Reports

`/reports` produces a **Stellar traction report**: independent usage figures for a Soroban contract
or a Stellar asset, for teams proving traction to grant reviewers and investors, issuers tracking
holders and flows, and investors comparing projects. The backend computes every figure from the
mainnet ledgers it has collected and **signs** the report with BlocRA's Ed25519 key
(`GET /api/reports/traction?subject=<C… | XLM | CODE:ISSUER>&days=7|30&chain=stellar&signed=true[&relayers=G…,G…]`).
The page renders the signed `report_json` as-is; anything missing shows as "—".

The website and the [blocra CLI](https://github.com/Blocra-HQ/blocra-cli) produce **the same files**:
a report exported here passes `npx blocra verify`, and one written by `blocra report` verifies here.

- **Pick a subject:** contract or asset, from the most active ones (`GET /api/reports/subjects`) or by
  pasting an id; 7 or 30 days. Links of the form `/reports?subject=<id>&days=7[&relayers=G…]` open a
  report directly.
- **Declared relayers (contracts, optional):** comma-separated `G…` accounts your project uses to
  submit transactions for users, sent as `relayers=` (the CLI's `--relayer`). Users who sign their own
  authorization are found automatically; list only relayers that sign everything themselves, so their
  calls are reported separately instead of counting as one very active user.
- **Document:** header (subject, network, UTC period, method version, signature status), a
  partial-data notice when BlocRA's coverage is shorter than the period, scorecard with change vs the
  previous period, key findings, daily activity, retention and user quality (top-10 share, bot-like
  accounts, calls submitted by relayers or sponsors, smart-wallet accounts, declared relayers, top
  accounts), contract functions or asset snapshot, ecosystem rank, coverage and methodology, and a
  verification section with the attestation (signer, method version, report sha256, signed at) and
  the last export's file sha256 and registry status.
- **Exports:**
  - **Verifiable report (.md)**: exactly `blocra report`'s Markdown, with the signed envelope embedded
    at the end. `npx blocra verify file.md` checks the signature and that the text was not edited.
  - **Signed data (.json)**: the signed envelope `{report_json, attestation}`, as the CLI writes it.
  - **PDF (rendering)**: for reading and printing. Not itself verifiable; it says so on every page and
    names the report sha256 and signer in the footer. **Print / Save as PDF** prints the page.

  Each file is built once, and the same bytes are downloaded, hashed and published.
- **Unsigned servers:** if the backend has no signing key (`503` on `signed=true`) the unsigned report
  is shown with a visible "unsigned — this server doesn't sign reports" notice, and its exports cannot
  be verified.
- **Publish:** records the last exported file's sha256 in the report registry with Freighter
  (title `Traction report: <subject> <from>–<to>`, chain `stellar`), an extra check on top of the
  signature; anyone with that exact file can look it up at `/verify-report`.
- **AI summary (optional):** "Add AI summary" asks the backend AI analyst to summarise the figures; it
  is shown in a labelled box and included in the PDF only. The signed .md/.json never contain it.

### One renderer for the website and the CLI

The verifiable format is defined once, in blocra-cli's `src/markdown.js`. Until the `blocra` npm
package is published, `src/lib/blocra/{markdown,strkey,defaults}.js` are exact copies (a header
comment followed by the CLI file, unchanged); `src/lib/blocra/verify.ts` is the browser verifier
(WebCrypto Ed25519) and `src/lib/blocra/files.ts` names and writes the exports like the CLI.

```bash
npm run check:blocra                 # fails if a copy differs from ../blocra-cli/src (skipped if absent)
node scripts/sync-blocra.mjs --write # re-sync after changing the CLI (BLOCRA_CLI_DIR to override the path)
npm run test:reports                 # sync check + report tests + web/CLI cross-check
```

`scripts/blocra-sync.test.ts` takes real signed envelopes (from a backend at `BLOCRA_API`,
`localhost:10000` or `localhost:3001`, else the CLI's signed fixtures), exports them with the website
code, and asserts that `node ../blocra-cli/bin/blocra.js verify` and the browser verifier both say
VALID for the genuine files and FAIL for a tampered figure, a tampered signed number or another key.

## Verify

`/verify-report` checks a file in the browser, the way `npx blocra verify` does:

1. **BlocRA signature** (`.md` or `.json`): reads the signed envelope (embedded in the Markdown, or the
   JSON itself), checks the Ed25519 signature over `report_json` with WebCrypto
   (`crypto.subtle.verify('Ed25519', …)`; the `G…` signer is decoded with the CLI's strkey code,
   checksum included), checks the signer is the trusted key and, for Markdown, re-renders the body
   from the signed report and requires the file text to match exactly. The trusted key is BlocRA's
   official keys built into the site (`OFFICIAL_KEYS`, mirrored from the CLI; empty for now), else the
   key served at `GET /api/attestation/key`; the page shows which key it trusted. Browsers without
   WebCrypto Ed25519 get a clear "cannot check" result, never a pass.
2. **On-chain registry** (any file, including PDF/DOCX): the file's sha256 is looked up in the report
   registry on Stellar, showing who published it and when, or that it was revoked.

## Query editor and dashboards

The backend keeps an analytics database: every Stellar ledger with its transactions and operations,
and a block of any other chain each time its dashboard stats are fetched. The Query Editor and the
Dashboard Builder query it through the backend (`POST /api/query/run`); nothing runs against chain
RPCs from the browser.

| Table | One row per | Main columns |
|-------|-------------|--------------|
| `blocks` | stored block or ledger | `chain`, `block_number`, `timestamp` (unix s), `transaction_count`, `successful_txs`, `failed_txs`, `unique_senders`, `operation_count`, `total_fees`, `fee_unit`, `gas_used` |
| `transactions` | transaction (Stellar) | `chain`, `block_number`, `timestamp`, `hash`, `sender`, `fee`, `operation_count`, `successful` (0/1) |
| `operations` | operation (Stellar) | `chain`, `block_number`, `timestamp`, `id`, `tx_hash`, `type`, `source` |

- **SQL:** SQLite, read-only (`SELECT` or `WITH`), up to 1000 rows per query; results say when they
  were truncated. Group by time with `strftime('%H:%M', timestamp, 'unixepoch')` (UTC).
  `blocks.operation_count` counts operations of successful transactions only; the `operations` table
  holds every operation, including those of failed transactions.
- **Editor:** the sidebar lists tables, columns and how much data is stored per chain, plus sample
  queries. Results export to CSV (RFC 4180 quoting, UTF-8). "Generate SQL" asks the backend AI
  analyst (`POST /api/ai/sql`) and places the query in the editor for review.
- **Dashboard Builder:** each widget is a query and a chart type (bar, line, pie, table, number).
  The first text column labels the chart and the first numeric column is plotted, in the order the
  query returns rows. Saved dashboards re-run their queries when opened. **Export** downloads the
  canvas as a PNG or the definition (name, widgets with SQL, type, position and size) as JSON;
  **Import JSON** loads such a file.

```sql
SELECT strftime('%H:%M', timestamp, 'unixepoch') AS minute, SUM(transaction_count) AS txs
FROM blocks WHERE chain = 'stellar'
GROUP BY minute ORDER BY minute;
```

## Getting started

### Prerequisites

- Node.js 20 or newer and npm
- A running [blocra-backend](https://github.com/Blocra-HQ/blocra-backend) (defaults to `http://localhost:5000`)
- The [Freighter](https://www.freighter.app/) browser extension, for sign-in and publishing reports

### Install and run

```bash
git clone https://github.com/Blocra-HQ/blocra-frontend.git
cd blocra-frontend
npm ci
VITE_BACKEND_URL=http://localhost:5000 npm run dev   # http://localhost:8080
```

### Environment variables

Vite reads these at build time (`.env`, `.env.production`, or your host's settings).

| Variable | Default | Used for |
|----------|---------|----------|
| `VITE_BACKEND_URL` | `http://localhost:5000` in development | Base URL of blocra-backend, without `/api`. **Required in production**: the build refuses to start without it. |
| `VITE_STELLAR_NETWORK` | `testnet` | Network passphrase for Freighter signing and the explorer links (`mainnet` or `testnet`). Match it to where the report registry is deployed. |
| `VITE_STELLAR_RPC_URL` | `soroban-testnet.stellar.org` (testnet) | Soroban RPC for report-registry reads and writes. |
| `VITE_REPORT_REGISTRY_CONTRACT_ID` | testnet registry `CD7UABTK…5CPW` | Report registry contract to publish to and verify against. |
| `VITE_STARKNET_RPC_URL` | none | Optional Starknet RPC tried before the built-in list. |
| `VITE_GOOGLE_CLIENT_ID` | none | Google sign-in button, if enabled. |

Contract events and dashboards use each chain's RPC list in `src/config/chains.ts` (Stellar mainnet
Soroban RPCs for the Stellar chain).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run check:blocra` | Check `src/lib/blocra` matches `../blocra-cli/src` |
| `npm run test:reports` | Report tests and the web/CLI verification cross-check |

## Deployment

The repo includes `vercel.json` (Vite preset, `npm run build`, output `dist/`). Set
`VITE_BACKEND_URL` (and the Stellar variables if you use mainnet) in the project's environment
variables. Any static host works: serve `dist/` with a fallback to `index.html` for client-side routes.

## Project layout

```
src/
├── App.tsx                 routes
├── pages/                  Index (dashboard), ContractEventsEDA, Reports, VerifyReport, QueryEditor,
│                           DashboardBuilder, LibraryPage, Settings, Profile, ...
├── components/             layout, ai (chat), reports, query, dashboard, data-explorer, ui (shadcn/ui)
├── lib/tractionReport*.ts  traction report formatting for the page, PDF rendering
├── lib/blocra/             report renderer copied from blocra-cli, browser verifier, export files
├── config/
│   ├── chains.ts           supported chains and verified RPCs (generated from blocra-research)
│   └── api.ts              backend URL handling
├── contexts/               chain selection, Stellar wallet (Freighter), auth, theme
├── integrations/
│   ├── stellar-network.ts  network passphrase, Soroban RPC, explorer
│   ├── soroban.ts          simulated reads and Freighter-signed contract calls
│   └── report-registry.ts  publish and verify report hashes
├── services/               AIService (backend AI client), UniversalEventFetcher (events per
│                           chain type), MultiChainRPCService, PDFReportService, ...
└── hooks/                  useRpcEndpoint (header RPC status), use-wallet, ...
```

## Maintaining chains and RPCs

`src/config/chains.ts` is generated from `chains.json` in
[blocra-research](https://github.com/Blocra-HQ/blocra-research). To add a chain or change an RPC, edit
`chains.json` there, run `scripts/check_rpcs.py` to confirm every endpoint is alive, current and
browser-callable, then regenerate this file with `scripts/gen_chains_ts.py` (do not edit it by hand).
Stellar stays first so it remains the default chain.

## Notes and known limitations

- **AI quality depends on the model.** Reports, chat and SQL come from whatever model the backend is
  configured with; small local models can misdescribe a contract. Always review generated SQL.
- **Event data has limits.** Some figures (success rate, gas price) show `n/a` in Contract Analysis because
  they can't be measured from events alone; nothing is estimated.
- **Network dashboard coverage.** The dashboard covers every chain in the registry, but it reads only
  the latest block each time it refreshes, so trends cover the blocks observed while the page is open.
- **Soroban event window.** Public Stellar RPCs keep about 7 days of events, so Soroban contract analysis
  covers that window.
- **Traction report history.** Reports cover only the time since BlocRA's ledger collector started;
  until a full period (and the one before it) is collected, reports say so and changes vs the previous
  period show as "—".

## History

The app began as Starklytics (Starknet analytics), was renamed BloDI and then BlocRA, and moved from
Starknet to Stellar. The Stellar wallet context and Freighter transaction helpers were imported from
[stellar-insights](https://github.com/Ndifreke000/stellar-insights) with their commit history. The
bounty feature was removed; the on-chain piece is now the report registry.

## License

[MIT](LICENSE)
