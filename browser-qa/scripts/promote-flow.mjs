#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const args = process.argv.slice(2);
const path = resolve(arg("--flow") ?? "");
if (!path) fail("--flow is required");
const flow = JSON.parse(await readFile(path, "utf8"));
if (flow.status === "stale" || flow.status === "retired") fail(`cannot promote ${flow.status} flow`);
const signatures = new Set((flow.observations ?? []).map((item) => item.signature));
const clean = (flow.observations ?? []).filter((item) => item.status === "passed");
if (clean.length < 2) fail("verified flow needs at least 2 successful observations");
flow.status = clean.length >= 3 && signatures.size === 1 ? "stable" : "verified";
flow.confidence = Math.min(0.95, Number((clean.length / 5).toFixed(2)));
flow.history = [...(flow.history ?? []), { at: new Date().toISOString(), action: "promoted", status: flow.status }];
await writeFile(path, `${JSON.stringify(flow, null, 2)}\n`);
console.log(`Promoted ${path}: ${flow.status}`);
function arg(flag) { const i = args.indexOf(flag); return i === -1 ? undefined : args[i + 1]; }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
