<div align="center">

<img src="public/blocra-logo.png" width="88" alt="BlocRA logo" />

# blocra-frontend

The web app for **BlocRA**, a blockchain analytics platform built for Stellar.

React · TypeScript · Vite · Tailwind CSS · Stellar SDK · Freighter

</div>

---

## Overview

BlocRA lets analysts explore on-chain activity, analyze smart contracts, write queries, build
dashboards and produce reports that can be verified on Stellar. Stellar is the default chain. The app
supports 37 chains in total: Stellar, Starknet, Solana and 34 EVM networks (Ethereum, Base,
Arbitrum, Optimism, Polygon, BNB Smart Chain, Avalanche and others).

This repository is the browser app. It works with:

| Repo | Role |
|------|------|
| [blocra-backend](https://github.com/Blocra-HQ/blocra-backend) | Rust API: network stats, AI analyst, Stellar sign-in, saved queries |
| [blocra-contracts](https://github.com/Blocra-HQ/blocra-contracts) | Soroban report registry contract |
| [blocra-research](https://github.com/Blocra-HQ/blocra-research) | Verified chain and RPC registry the app's chain list is generated from |

## Features

| Page | Route | What it does |
|------|-------|--------------|
| Dashboard | `/` | Live stats for the latest Stellar ledger (transactions, operations, XLM fees, success rate, operation types) or Starknet block, from the backend. Charts build up as new ledgers arrive. |
| Contract Analysis | `/contract-events-eda` | Fetches a contract's events and activity: Soroban contracts through Stellar RPC `getEvents`, EVM contracts through logs, Starknet through `starknet_getEvents`. Shows event mix, users, transfer volume, top callers and timelines, with CSV/JSON/image export. |
| Contract reports | in Contract Analysis | The backend AI analyst writes a report from the computed statistics; if no AI is configured, a statistical summary is used and labelled as such. Download as PDF. |
| Publish and verify | `/verify-report` | "Publish on Stellar" records the downloaded PDF's sha256 in the report registry, signed with Freighter. The verify page hashes a file in the browser (it is never uploaded) and shows whether it is an authentic, unmodified BlocRA report, who published it and when. |
| Query editor | `/query` | SQL over blocks, transactions and contracts, with natural-language-to-SQL from the AI analyst. |
| Dashboard builder | `/builder` | Compose charts and widgets into dashboards. |
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
                  │ stats, AI, auth │     │ JSON-RPC from the browser
                  └───┬─────────┬───┘     │
                      │         │         ▼
                Horizon /   AI provider   Soroban RPC (contract events,
                Starknet RPC              report registry), EVM, Starknet
                                          and Solana RPCs
```

- **Backend:** network dashboard stats, the AI analyst (chat, reports, SQL), Stellar wallet sign-in and
  saved queries.
- **Directly from the browser:** contract events and the report registry are read from public RPCs.
  Every endpoint in `src/config/chains.ts` was checked for a live head block and a browser CORS preflight
  in [blocra-research](https://github.com/Blocra-HQ/blocra-research).
- **Freighter:** signs the sign-in challenge and report-registry transactions. Keys never leave the wallet.

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

## Deployment

The repo includes `vercel.json` (Vite preset, `npm run build`, output `dist/`). Set
`VITE_BACKEND_URL` (and the Stellar variables if you use mainnet) in the project's environment
variables. Any static host works: serve `dist/` with a fallback to `index.html` for client-side routes.

## Project layout

```
src/
├── App.tsx                 routes
├── pages/                  Index (dashboard), ContractEventsEDA, VerifyReport, QueryEditor,
│                           DashboardBuilder, LibraryPage, Settings, Profile, ...
├── components/             layout, ai (chat), query, dashboard, data-explorer, ui (shadcn/ui)
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
`chains.json` there, run `scripts/check_rpcs.py` to confirm every endpoint is alive and browser-callable,
then regenerate this file. Stellar stays first so it remains the default chain.

## Notes and known limitations

- **AI quality depends on the model.** Reports, chat and SQL come from whatever model the backend is
  configured with; small local models can misdescribe a contract. Always review generated SQL.
- **Event data has limits.** Some figures (success rate, gas price) show `n/a` in Contract Analysis because
  they can't be measured from events alone; nothing is estimated.
- **Network dashboard coverage.** The network dashboard has stats for Stellar and Starknet. Other chains
  show the backend's "not supported yet" message; use Contract Analysis for them.
- **Soroban event window.** Public Stellar RPCs keep about 7 days of events, so Soroban contract analysis
  covers that window.
- **DOCX export.** `services/DocumentService.ts` can build DOCX reports but no button uses it yet; reports
  download as PDF.

## History

The app began as Starklytics (Starknet analytics), was renamed BloDI and then BlocRA, and moved from
Starknet to Stellar. The Stellar wallet context and Freighter transaction helpers were imported from
[stellar-insights](https://github.com/Ndifreke000/stellar-insights) with their commit history. The
bounty feature was removed; the on-chain piece is now the report registry.

## License

[MIT](LICENSE)
