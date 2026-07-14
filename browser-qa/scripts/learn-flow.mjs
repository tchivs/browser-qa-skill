#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const manifestPath = requiredPath("--manifest");
const flowPath = requiredPath("--flow");
const id = requiredValue("--id");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.schema_version !== 1) fail("manifest schema_version must be 1");
if (manifest.cleanup?.status !== "completed") fail("only cleaned-up runs can teach a flow");
if (!/^[a-z][a-z0-9-]{2,63}$/.test(id)) fail("--id must be lowercase kebab-case, 3-64 chars");

const observations = (manifest.results ?? []).filter((result) => result.status === "passed" && Array.isArray(result.steps) && result.steps.length > 0 && result.scope === "public");
if (!observations.length) fail("manifest has no successful public flow with structured steps");
let flow;
try { flow = JSON.parse(await readFile(flowPath, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; flow = newFlow(id, manifest); }
if (flow.id !== id) fail("existing flow id does not match --id");
if (flow.status === "retired") fail("retired flow cannot learn new observations");

for (const result of observations) {
  const signature = JSON.stringify(result.steps);
  const exists = flow.observations.some((item) => item.run_id === manifest.run_id && item.signature === signature);
  if (!exists) flow.observations.push({ run_id: manifest.run_id, at: manifest.created_at, signature, scope: result.scope, route: result.route, viewport: result.viewport, status: "passed" });
  if (!flow.steps.length) flow.steps = sanitizeSteps(result.steps);
}
flow.last_verified_at = manifest.created_at;
flow.profile_hashes = [...new Set([...flow.profile_hashes, manifest.profile.sha256])];
flow.confidence = confidence(flow.observations);
flow.status = flow.status === "stale" ? "candidate" : flow.status;
flow.baseline = baseline(observations[0]);
await mkdir(dirname(flowPath), { recursive: true });
await writeFile(flowPath, `${JSON.stringify(flow, null, 2)}\n`);
console.log(`Learned ${flowPath}: ${flow.observations.length} observation(s), status=${flow.status}`);

function newFlow(flowId, m) { return { schema_version: 1, id: flowId, scope: "public", status: "candidate", confidence: 0, created_at: m.created_at, last_verified_at: m.created_at, profile_hashes: [], observations: [], steps: [], baseline: null, history: [] }; }
function sanitizeSteps(steps) { return steps.filter((step) => ["navigate", "click", "expect_url", "expect_visible"].includes(step.action)).map((step) => ({ action: step.action, path: step.path, pattern: step.pattern, locator: step.locator, text: step.text })).filter((step) => Object.values(step).some(Boolean)); }
function baseline(result) { return { route: result.route, viewport: result.viewport, expected: result.expected, critical_elements: result.critical_elements ?? [], expected_requests: result.expected_requests ?? [] }; }
function confidence(items) { return Math.min(0.95, Number((items.length / 5).toFixed(2))); }
function requiredValue(flag) { const i = args.indexOf(flag); if (i === -1 || !args[i + 1]) fail(`${flag} is required`); return args[i + 1]; }
function requiredPath(flag) { return resolve(requiredValue(flag)); }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
