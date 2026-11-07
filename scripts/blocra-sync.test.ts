// Proves the website's report exports and verifier agree with the CLI.
// Run: npx tsx scripts/blocra-sync.test.ts   (npm run test:reports)
//
// For real signed envelopes (from a running backend at BLOCRA_API,
// http://localhost:10000 or http://localhost:3001, else the signed fixtures):
//  a. the website's .md/.json exports pass `blocra verify --key <signer>`,
//  b. a tampered figure fails it,
//  c. the website's browser verifier (WebCrypto, src/lib/blocra/verify.ts)
//     gives the same outcome on the same files.
// Needs blocra-cli checked out at ../blocra-cli (or BLOCRA_CLI_DIR). Files are
// written under BLOCRA_SYNC_OUT (default: the OS temp dir).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { envelopeJson, verifiableMarkdown } from "../src/lib/blocra/files";
import { ed25519Supported, verifyReportFile } from "../src/lib/blocra/verify";
import type { SignedEnvelope } from "../src/lib/blocra/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = resolve(process.env.BLOCRA_CLI_DIR ?? join(root, "..", "blocra-cli"));
const CLI = join(cliDir, "bin", "blocra.js");
if (!existsSync(CLI)) {
  console.log(`blocra-cli not found at ${cliDir}; skipping the web/CLI cross-check.`);
  process.exit(0);
}
const OTHER_KEY = "GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3";

async function getJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  const body = await res.json();
  if (!res.ok || body?.success === false) throw new Error(body?.message ?? `HTTP ${res.status}`);
  return body;
}

/** Signed envelopes from a live backend, or null if none is reachable. */
async function fromBackend(): Promise<{ source: string; envelopes: [string, SignedEnvelope][] } | null> {
  for (const api of [process.env.BLOCRA_API, "http://localhost:10000", "http://localhost:3001"].filter(Boolean) as string[]) {
    try {
      await getJson(`${api}/api/attestation/key`);
    } catch {
      continue;
    }
    const envelopes: [string, SignedEnvelope][] = [];
    for (const kind of ["contract", "asset"]) {
      const { subjects } = await getJson(`${api}/api/reports/subjects?kind=${kind}&days=7&limit=1`);
      if (!subjects?.length) continue;
      const q = new URLSearchParams({ subject: subjects[0].id, days: "7", chain: "stellar", signed: "true" });
      envelopes.push([`${kind} ${subjects[0].id}`, (await getJson(`${api}/api/reports/traction?${q}`)).signed]);
    }
    if (envelopes.length) return { source: `backend ${api}`, envelopes };
  }
  return null;
}

function fromFixtures() {
  const dir = join(cliDir, "test", "fixtures");
  const names = ["signed-asset.json", "signed-contract.json", "signed-relayed.json"];
  return {
    source: `fixtures ${dir}`,
    envelopes: names.map((n) => [n, JSON.parse(readFileSync(join(dir, n), "utf8"))] as [string, SignedEnvelope]),
  };
}

function cliVerify(file: string, key: string): { code: number; out: string } {
  try {
    return { code: 0, out: execFileSync("node", [CLI, "verify", file, "--key", key], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } }) };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`ok - ${name}`);
}

/** Both verifiers must agree: VALID (exit 0) or FAIL (exit 1). */
async function agree(file: string, key: string, expectValid: boolean, reason?: RegExp) {
  const cli = cliVerify(file, key);
  const web = await verifyReportFile(file, readFileSync(file, "utf8"), [key]);
  assert.equal(cli.code, expectValid ? 0 : 1, `CLI on ${file}:\n${cli.out}`);
  assert.match(cli.out, expectValid ? /✓ VALID/ : /✗ FAIL/);
  assert.equal(web.unsupported, false);
  assert.equal(web.ok, expectValid, `web on ${file}: ${web.reasons.join("; ")}`);
  if (reason) {
    assert.match(cli.out, reason);
    assert.match(web.reasons.join("\n"), reason);
  }
}

const { source, envelopes } = (await fromBackend()) ?? fromFixtures();
console.log(`# envelopes from ${source}`);
const cliMarkdown = await import(pathToFileURL(join(cliDir, "src", "markdown.js")).href);
const outRoot = process.env.BLOCRA_SYNC_OUT ?? tmpdir();
mkdirSync(outRoot, { recursive: true });
const dir = mkdtempSync(join(outRoot, "blocra-web-"));

await test("WebCrypto in this runtime supports Ed25519", async () => {
  assert.equal(await ed25519Supported(), true);
});

for (const [label, env] of envelopes) {
  const signer = env.attestation.signer;
  const base = join(dir, label.replace(/[^a-z0-9]+/gi, "-"));
  const md = verifiableMarkdown(env);
  const json = envelopeJson(env);
  writeFileSync(`${base}.md`, md);
  writeFileSync(`${base}.json`, json);

  await test(`${label}: web .md is byte-identical to the CLI renderer's`, () => {
    assert.equal(md, cliMarkdown.renderMarkdown(env));
  });

  await test(`${label}: web .md and .json are VALID for blocra verify and the browser verifier`, async () => {
    await agree(`${base}.md`, signer, true);
    await agree(`${base}.json`, signer, true);
  });

  await test(`${label}: a tampered figure in the .md FAILS both`, async () => {
    const tampered = md.replace(/^\| Active accounts \| ([\d,]+) \|/m, (_m, v) => `| Active accounts | ${v === "1" ? "2" : "1"} |`);
    assert.notEqual(tampered, md);
    writeFileSync(`${base}.tampered.md`, tampered);
    await agree(`${base}.tampered.md`, signer, false, /edited after signing/);
  });

  await test(`${label}: a tampered number in the signed .json FAILS both`, async () => {
    const bad = structuredClone(env);
    bad.report_json = bad.report_json.replace(/"active_accounts":\{"change_pct":([^,]+),"previous":([^,]+),"value":(\d+)/, (_m, c, p, v) => `"active_accounts":{"change_pct":${c},"previous":${p},"value":${Number(v) + 1}`);
    assert.notEqual(bad.report_json, env.report_json);
    writeFileSync(`${base}.tampered.json`, envelopeJson(bad));
    await agree(`${base}.tampered.json`, signer, false, /Signature is not valid|payload_sha256/);
    // Tampered data re-rendered into a .md (so the body matches) still fails on the signature.
    writeFileSync(`${base}.rerendered.md`, verifiableMarkdown(bad));
    await agree(`${base}.rerendered.md`, signer, false);
  });

  await test(`${label}: a genuine report FAILS both when another key is trusted`, async () => {
    await agree(`${base}.md`, OTHER_KEY, false, /not by the trusted BlocRA key/);
  });
}

await test("a browser without WebCrypto Ed25519 reports 'unsupported', never VALID", async () => {
  const [, env] = envelopes[0];
  const real = globalThis.crypto.subtle;
  const noEd25519 = {
    digest: real.digest.bind(real),
    importKey: async () => {
      throw new DOMException("Unrecognized name.", "NotSupportedError");
    },
    verify: async () => true,
  } as unknown as SubtleCrypto;
  const r = await verifyReportFile("x.md", verifiableMarkdown(env), [env.attestation.signer], noEd25519);
  assert.equal(r.ok, false);
  assert.equal(r.unsupported, true);
  assert.match(r.reasons[0], /cannot check Ed25519/);
});

await test("files without a signature FAIL both", async () => {
  const plain = join(dir, "plain.md");
  writeFileSync(plain, "# Our traction\n\n1,000,000 users\n");
  await agree(plain, envelopes[0][1].attestation.signer, false, /no BlocRA signature/i);
});

console.log(`\n${passed} checks passed (files in ${dir})`);
