#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const args = process.argv.slice(2);
const path = resolve(arg("--flow") ?? "");
const reason = arg("--reason");
if (!path || !reason) fail("--flow and --reason are required");
const flow = JSON.parse(await readFile(path, "utf8"));
flow.status = "stale";
flow.confidence = 0;
flow.history = [...(flow.history ?? []), { at: new Date().toISOString(), action: "invalidated", reason }];
await writeFile(path, `${JSON.stringify(flow, null, 2)}\n`);
console.log(`Invalidated ${path}: ${reason}`);
function arg(flag) { const i = args.indexOf(flag); return i === -1 ? undefined : args[i + 1]; }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
