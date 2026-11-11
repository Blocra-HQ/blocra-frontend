#!/usr/bin/env node
// Keeps the website's report files identical to the blocra CLI's (Rust,
// Blocra-HQ/blocra-cli), so a report exported here is byte-for-byte what
// `blocra report` writes and `blocra verify` accepts.
//
//   node scripts/sync-blocra.mjs          check (exit 1 on any difference)
//   node scripts/sync-blocra.mjs --write  rewrite src/lib/blocra/defaults.js
//                                         from the CLI's defaults.json
//
// Checks, against blocra-cli at ../blocra-cli (override with BLOCRA_CLI_DIR):
//  1. src/lib/blocra/markdown.js renders every golden file in the CLI's
//     test/fixtures byte for byte (the CLI's own tests check the same files);
//  2. src/lib/blocra/defaults.js has the CLI's official API and keys.
// When the CLI is not checked out next to this repo the check is skipped.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = resolve(process.env.BLOCRA_CLI_DIR ?? join(root, "..", "blocra-cli"));
const fixtures = join(cliDir, "test", "fixtures");
const write = process.argv.includes("--write");

if (!existsSync(join(cliDir, "defaults.json")) || !existsSync(fixtures)) {
  console.log(`blocra-cli not found at ${cliDir}; skipping the renderer check.`);
  process.exit(0);
}

const lib = join(root, "src", "lib", "blocra");
const md = await import(pathToFileURL(join(lib, "markdown.js")).href);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
let differ = 0;
const check = (label, ok) => {
  if (ok) console.log(`✓ ${label}`);
  else {
    differ++;
    console.error(`✗ ${label}`);
  }
};

for (const file of readdirSync(fixtures).filter((f) => /^signed-.*\.json$/.test(f))) {
  const golden = join(fixtures, file.replace(/\.json$/, ".md"));
  if (!existsSync(golden)) continue;
  check(`renderMarkdown(${file}) matches ${file.replace(/\.json$/, ".md")}`, md.renderMarkdown(readJson(join(fixtures, file))) === readFileSync(golden, "utf8"));
}
const cases = join(fixtures, "render");
for (const file of existsSync(cases) ? readdirSync(cases).filter((f) => f.endsWith(".json")) : []) {
  const { report, attestation } = readJson(join(cases, file));
  const golden = readFileSync(join(cases, file.replace(/\.json$/, ".md")), "utf8");
  check(`renderBody(render/${file}) matches its golden file`, md.renderBody(report, attestation) === golden);
}

const defaults = readJson(join(cliDir, "defaults.json"));
const api = defaults.api ?? null;
const keys = defaults.official_keys ?? [];
const defaultsPath = join(lib, "defaults.js");
if (write) {
  writeFileSync(
    defaultsPath,
    "// Generated from blocra-cli's defaults.json by `node scripts/sync-blocra.mjs --write`; do not edit.\n" +
      "//\n" +
      "// Official BlocRA endpoint and signing keys (newest first, past keys kept so\n" +
      "// older reports still verify). The CLI builds the same file into its binary.\n\n" +
      `export const DEFAULT_API = ${JSON.stringify(api)};\n` +
      `export const OFFICIAL_KEYS = ${JSON.stringify(keys)};\n`,
  );
  console.log("updated   src/lib/blocra/defaults.js");
}
const current = await import(`${pathToFileURL(defaultsPath).href}?t=${Date.now()}`);
check(
  "src/lib/blocra/defaults.js matches blocra-cli defaults.json",
  current.DEFAULT_API === api && JSON.stringify(current.OFFICIAL_KEYS) === JSON.stringify(keys),
);

if (differ) {
  console.error(
    "The website and the CLI disagree. Renderer: change src/lib/blocra/markdown.js and blocra-cli's src/markdown.rs together, " +
      "and regenerate the golden files. Keys: run `node scripts/sync-blocra.mjs --write`.",
  );
  process.exit(1);
}
