#!/usr/bin/env node

import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] ?? resolve(scriptDir, "../.."));
const learn = resolve(root, "browser-qa/scripts/learn-flow.mjs");
const validate = resolve(root, "browser-qa/scripts/validate-flow.mjs");
const promote = resolve(root, "browser-qa/scripts/promote-flow.mjs");
const generate = resolve(root, "browser-qa/scripts/generate-playwright.mjs");
const invalidate = resolve(root, "browser-qa/scripts/invalidate-stale-flow.mjs");
const dir = await mkdtemp(join(tmpdir(), "browser-qa-flow-"));
let failed = 0;
try {
  const manifest = join(dir, "manifest.json");
  await writeFile(manifest, JSON.stringify(runManifest("run-001"), null, 2));
  const flow = join(dir, "flows", "public-nav.json");
  expect("learn candidate flow", run(learn, ["--manifest", manifest, "--flow", flow, "--id", "public-nav"]).status === 0);
  expect("candidate flow validates", run(validate, ["--flow", flow]).status === 0);
  expect("candidate cannot generate playwright", run(generate, ["--flow", flow, "--output", join(dir, "generated.spec.ts")]).status !== 0);

  for (const id of ["run-002", "run-003"]) {
    const path = join(dir, `${id}.json`); await writeFile(path, JSON.stringify(runManifest(id), null, 2));
    expect(`learn ${id}`, run(learn, ["--manifest", path, "--flow", flow, "--id", "public-nav"]).status === 0);
  }
  expect("promote after three clean observations", run(promote, ["--flow", flow]).status === 0);
  expect("stable flow validates", run(validate, ["--flow", flow]).status === 0);
  const output = join(dir, "generated.spec.ts");
  expect("generate stable public playwright", run(generate, ["--flow", flow, "--output", output]).status === 0);
  expect("generated script has test", (await readFile(output, "utf8")).includes("test(\"public-nav\""));
  expect("invalidate flow", run(invalidate, ["--flow", flow, "--reason", "route changed"]).status === 0);
  expect("stale flow cannot generate playwright", run(generate, ["--flow", flow, "--output", output]).status !== 0);
} finally { await rm(dir, { recursive: true, force: true }); }
if (failed) process.exit(1);
console.log("flow learning tests OK");
function run(file, args) { return spawnSync(process.execPath, [file, ...args], { encoding: "utf8" }); }
function expect(name, ok) { if (ok) console.log(`PASS: ${name}`); else { failed++; console.error(`FAIL: ${name}`); } }
function runManifest(runId) { return { schema_version: 1, run_id: runId, created_at: "2026-01-01T00:00:00Z", profile: { sha256: "a".repeat(64), environment: "staging", project_name: "sample" }, policy: { max_idempotent_retries: 1, read_only: true }, scopes: [{ scope: "public", readiness: "ready", routes: ["/", "/features"], status: "passed" }, { scope: "authenticated", readiness: "blocked", routes: [], status: "blocked" }, { scope: "admin", readiness: "n/a", routes: [], status: "untested" }], results: [{ scope: "public", status: "passed", route: "/", viewport: "desktop", expected: "home heading visible", actual: "home heading visible", steps: [{ action: "navigate", path: "/" }, { action: "click", locator: { role: "link", name: "Features" } }, { action: "expect_url", pattern: "/features" }] }], evidence: { screenshots: [], console: [], network: [], logs: [] }, retries: [], cleanup: { status: "completed" }, report: { status: "passed", blocked_scopes: ["authenticated"] } }; }
