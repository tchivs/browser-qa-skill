#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { console.log("Usage: node browser-qa/scripts/validate-run-manifest.mjs --manifest .browser-qa/runs/<run-id>/manifest.json"); process.exit(0); }
const manifestPath = resolve(arg("--manifest") ?? "");
if (!manifestPath) fail("--manifest is required");
let manifest;
try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
catch (error) { fail(`Cannot read manifest: ${error.message}`); }
const errors = [];

if (manifest.schema_version !== 1) errors.push("schema_version must be 1");
if (!validRunId(manifest.run_id)) errors.push("run_id is invalid");
if (!iso(manifest.created_at)) errors.push("created_at must be an ISO-8601 UTC timestamp");
if (!manifest.profile?.sha256 || !/^[a-f0-9]{64}$/i.test(manifest.profile.sha256)) errors.push("profile.sha256 must be SHA-256 hex");
if (!Array.isArray(manifest.scopes) || !manifest.scopes.length) errors.push("scopes must be a non-empty array");
if (!Array.isArray(manifest.results)) errors.push("results must be an array");
if (!Array.isArray(manifest.retries)) errors.push("retries must be an array");
if (!manifest.cleanup || !["pending", "completed", "blocked", "failed"].includes(manifest.cleanup.status)) errors.push("cleanup.status is invalid");
if (!manifest.report || !["pending", "passed", "failed", "blocked", "flaky"].includes(manifest.report.status)) errors.push("report.status is invalid");

const scopeMap = new Map((manifest.scopes ?? []).map((s) => [s.scope, s]));
for (const scope of ["public", "authenticated", "admin"]) {
  const item = scopeMap.get(scope);
  if (!item) { errors.push(`missing ${scope} scope`); continue; }
  if (!["ready", "blocked", "stale", "n/a"].includes(item.readiness)) errors.push(`${scope}.readiness invalid`);
  if (!["pending", "passed", "failed", "blocked", "flaky", "untested"].includes(item.status)) errors.push(`${scope}.status invalid`);
  if (item.readiness !== "ready" && !["blocked", "untested"].includes(item.status)) errors.push(`${scope} must be blocked/untested when not ready`);
}
for (const result of manifest.results ?? []) {
  if (!scopeMap.has(result.scope)) errors.push(`result has unknown scope ${result.scope}`);
  if (!["passed", "failed", "blocked", "flaky"].includes(result.status)) errors.push("result.status invalid");
  if (!result.route || !result.viewport || !result.expected || !result.actual) errors.push("each result needs route, viewport, expected, actual");
}
for (const retry of manifest.retries ?? []) {
  if (!retry.idempotent) errors.push("only idempotent actions may be retried");
  if (!Number.isInteger(retry.attempt) || retry.attempt < 1 || retry.attempt > (manifest.policy?.max_idempotent_retries ?? 1)) errors.push("retry attempt exceeds policy");
}
if (manifest.report?.status === "passed") {
  const auth = scopeMap.get("authenticated");
  const admin = scopeMap.get("admin");
  if ((auth?.readiness !== "ready" && auth?.status === "passed") || (admin?.readiness !== "ready" && admin?.status === "passed")) errors.push("unready scope cannot be reported as passed");
}
if (manifest.report?.status !== "pending" && manifest.cleanup?.status === "pending") errors.push("completed report requires non-pending cleanup status");
await validateEvidencePaths(manifest, dirname(manifestPath));

if (errors.length) { console.error("Run manifest validation failed:"); errors.forEach((e) => console.error(`- ${e}`)); process.exit(1); }
console.log(`Run manifest OK: ${manifestPath}`);

async function validateEvidencePaths(m, root) {
  for (const kind of ["screenshots", "console", "network", "logs"]) {
    for (const item of m.evidence?.[kind] ?? []) {
      if (typeof item !== "string" || !item) { errors.push(`evidence.${kind} has invalid path`); continue; }
      const path = resolve(root, item);
      if (!path.startsWith(root)) { errors.push(`evidence.${kind} escapes run directory`); continue; }
      try { if (!(await stat(path)).isFile()) errors.push(`evidence.${kind} is not a file: ${item}`); }
      catch { errors.push(`evidence.${kind} file missing: ${item}`); }
    }
  }
}
function arg(flag) { const i = args.indexOf(flag); return i === -1 ? undefined : args[i + 1]; }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
function iso(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && !Number.isNaN(Date.parse(value)); }
function validRunId(value) { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(value); }
