#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { printHelp(); process.exit(0); }

const profilePath = resolve(valueOf("--profile") ?? ".browser-qa/profile.json");
const profile = JSON.parse(await (await import("node:fs/promises")).readFile(profilePath, "utf8"));
const runId = valueOf("--run-id") ?? `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(runId)) fail("--run-id must be 3-128 safe filename characters");

const root = resolve(dirname(profilePath), profile.run_policy?.evidence_root ?? ".browser-qa/runs");
const output = resolve(root, runId, "manifest.json");
const profileHash = await sha256(await (await import("node:fs/promises")).readFile(profilePath));
const scopes = ["public", "authenticated", "admin"].map((scope) => ({
  scope,
  readiness: profile.readiness?.[scope] ?? "blocked",
  routes: profile.qa_paths?.[scope] ?? [],
  status: profile.readiness?.[scope] === "ready" ? "pending" : "blocked",
  blocked_reason: profile.readiness?.[scope] === "ready" ? null : "profile scope is not ready"
}));

const manifest = {
  schema_version: 1,
  run_id: runId,
  created_at: new Date().toISOString(),
  profile: { path: profilePath, sha256: profileHash, environment: profile.environment, project_name: profile.project_name },
  target: { urls: (profile.services ?? []).filter((s) => s.kind === "frontend").map((s) => s.url) },
  policy: { max_idempotent_retries: profile.run_policy?.max_idempotent_retries ?? 1, destructive_actions_allowed: false, read_only: profile.safety?.read_only === true },
  scopes,
  viewports: profile.viewports ?? [],
  results: [],
  evidence: { screenshots: [], console: [], network: [], logs: [] },
  retries: [],
  cleanup: { status: "pending", started_resources: [], stopped_resources: [], intentionally_left_running: [] },
  report: { status: "pending", path: "report.md", blocked_scopes: scopes.filter((s) => s.status === "blocked").map((s) => s.scope) }
};

await mkdir(join(root, runId), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Created ${output}`);

function valueOf(flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
async function sha256(value) { const { createHash } = await import("node:crypto"); return createHash("sha256").update(value).digest("hex"); }
function printHelp() { console.log("Usage: node browser-qa/scripts/create-run-manifest.mjs [--profile .browser-qa/profile.json] [--run-id ID]"); }
