#!/usr/bin/env node
// Keeps src/lib/blocra/*.js identical to blocra-cli's src/*.js, so a report
// exported from the website is byte-for-byte what `blocra report` writes and
// `npx blocra verify` accepts.
//
//   node scripts/sync-blocra.mjs          check (exit 1 if a copy differs)
//   node scripts/sync-blocra.mjs --write  re-copy from the CLI
//
// The CLI is looked up at ../blocra-cli (override with BLOCRA_CLI_DIR). When
// it is not checked out next to this repo the check is skipped, not failed.
// Each vendored file is a "// copied from ..." header followed by the CLI file
// unchanged.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = resolve(process.env.BLOCRA_CLI_DIR ?? join(root, "..", "blocra-cli"));
const FILES = ["markdown.js", "strkey.js", "defaults.js"];
const write = process.argv.includes("--write");

const header = (file, version) =>
  `// copied from blocra-cli src/${file} v${version} — keep identical.\n` +
  `// Do not edit here: change blocra-cli, then run \`node scripts/sync-blocra.mjs --write\`.\n` +
  `// \`npm run check:blocra\` fails when this copy and the CLI differ.\n\n`;

/** The vendored file without its header comment block. */
export function stripHeader(text) {
  const marker = text.indexOf("\n\n");
  return text.startsWith("// copied from blocra-cli") && marker >= 0 ? text.slice(marker + 2) : null;
}

if (!existsSync(join(cliDir, "src", "markdown.js"))) {
  console.log(`blocra-cli not found at ${cliDir}; skipping the vendored-copy check.`);
  process.exit(0);
}

const version = JSON.parse(readFileSync(join(cliDir, "package.json"), "utf8")).version;
let differ = 0;
for (const file of FILES) {
  const source = readFileSync(join(cliDir, "src", file), "utf8");
  const target = join(root, "src", "lib", "blocra", file);
  const current = existsSync(target) ? readFileSync(target, "utf8") : "";
  if (write) {
    const next = header(file, version) + source;
    if (next !== current) writeFileSync(target, next);
    console.log(`${next === current ? "unchanged" : "updated  "} src/lib/blocra/${file}`);
  } else if (stripHeader(current) !== source) {
    differ++;
    console.error(`✗ src/lib/blocra/${file} differs from ${join(cliDir, "src", file)}`);
  } else {
    console.log(`✓ src/lib/blocra/${file} matches blocra-cli v${version}`);
  }
}
if (differ) {
  console.error("Run `node scripts/sync-blocra.mjs --write` to re-copy from blocra-cli.");
  process.exit(1);
}
