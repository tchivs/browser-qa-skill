#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const args = process.argv.slice(2);
const path = resolve(arg("--flow") ?? "");
if (!path) fail("--flow is required");
const flow = JSON.parse(await readFile(path, "utf8"));
const errors = [];
if (flow.schema_version !== 1) errors.push("schema_version must be 1");
if (!/^[a-z][a-z0-9-]{2,63}$/.test(flow.id ?? "")) errors.push("id must be lowercase kebab-case");
if (flow.scope !== "public") errors.push("only public flows are eligible for automatic generation");
if (!["candidate", "verified", "stable", "stale", "retired"].includes(flow.status)) errors.push("status is invalid");
if (!Array.isArray(flow.observations) || !flow.observations.length) errors.push("observations must be non-empty");
if (!Array.isArray(flow.steps) || !flow.steps.length) errors.push("steps must be non-empty");
if (!Array.isArray(flow.profile_hashes) || !flow.profile_hashes.every((hash) => /^[a-f0-9]{64}$/i.test(hash))) errors.push("profile_hashes must contain SHA-256 values");
for (const step of flow.steps ?? []) {
  if (!["navigate", "click", "expect_url", "expect_visible"].includes(step.action)) errors.push(`unsupported step action: ${step.action}`);
  if (step.action === "navigate" && typeof step.path !== "string") errors.push("navigate step needs path");
  if (step.action === "click" && (!step.locator || !step.locator.role || !step.locator.name)) errors.push("click step needs role/name locator");
  if (step.action === "expect_url" && typeof step.pattern !== "string") errors.push("expect_url step needs pattern");
}
if (flow.status === "stable" && flow.observations.length < 3) errors.push("stable flow requires at least 3 observations");
if (errors.length) { console.error("Flow validation failed:"); errors.forEach((e) => console.error(`- ${e}`)); process.exit(1); }
console.log(`Flow OK: ${path}`);
function arg(flag) { const i = args.indexOf(flag); return i === -1 ? undefined : args[i + 1]; }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
