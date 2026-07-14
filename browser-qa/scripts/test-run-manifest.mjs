#!/usr/bin/env node

import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] ?? resolve(scriptDir, "../.."));
const creator = resolve(root, "browser-qa/scripts/create-run-manifest.mjs");
const validator = resolve(root, "browser-qa/scripts/validate-run-manifest.mjs");
const dir = await mkdtemp(join(tmpdir(), "browser-qa-manifest-"));
let failures = 0;

try {
  const profilePath = join(dir, "profile.json");
  await writeFile(profilePath, `${JSON.stringify(profile(), null, 2)}\n`);
  const created = run(creator, ["--profile", profilePath, "--run-id", "qa-test-run"]);
  expect("manifest creation succeeds", created.status === 0, created);
  const manifestPath = join(dir, ".browser-qa", "runs", "qa-test-run", "manifest.json");
  expect("fresh manifest validates", run(validator, ["--manifest", manifestPath]).status === 0, run(validator, ["--manifest", manifestPath]));

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.report.status = "passed";
  manifest.cleanup.status = "completed";
  manifest.scopes.find((s) => s.scope === "authenticated").status = "passed";
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  expect("unready authenticated scope cannot pass", run(validator, ["--manifest", manifestPath]).status !== 0, run(validator, ["--manifest", manifestPath]));

  manifest.scopes.find((s) => s.scope === "authenticated").status = "blocked";
  manifest.retries = [{ attempt: 2, idempotent: true }];
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  expect("retry beyond policy is rejected", run(validator, ["--manifest", manifestPath]).status !== 0, run(validator, ["--manifest", manifestPath]));
} finally { await rm(dir, { recursive: true, force: true }); }

if (failures) process.exit(1);
console.log("run manifest tests OK");

function run(file, argv) { return spawnSync(process.execPath, [file, ...argv], { encoding: "utf8" }); }
function expect(name, ok, result) { if (ok) console.log(`PASS: ${name}`); else { failures++; console.error(`FAIL: ${name}\n${result.stdout}${result.stderr}`); } }
function profile() { return {
  schema_version: 3, project_name: "sample", project_root: ".", environment: "local",
  safety: { destructive_actions_allowed: false, read_only: true, test_data_prefix: "qa-" }, preferred_mode: "deployed",
  runtime: { working_directory: ".", cleanup_policy: "leave-running", start_commands: [], stop_commands: [], health_commands: ["curl -fsS http://127.0.0.1:3000/"] },
  services: [{ name: "web", kind: "frontend", url: "http://127.0.0.1:3000", health_path: "/", login_path: null }],
  auth: { required: false, strategy: "none", credential_sources: {}, secret_file: null, seed_or_setup_command: null },
  qa_paths: { public: ["/"], authenticated: ["/dashboard"], admin: [] },
  readiness: { public: "ready", authenticated: "blocked", admin: "n/a" }, run_policy: { max_idempotent_retries: 1, evidence_root: ".browser-qa/runs" },
  viewports: [], log_sources: { commands: [], notes: [] }, discovery: { status: "ready", evidence: ["test"], last_discovered_at: "2026-01-01T00:00:00Z", last_verified_at: "2026-01-01T00:00:00Z" }, fingerprints: {}, notes: []
}; }
