#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const args = process.argv.slice(2);
const flowPath = resolve(arg("--flow") ?? "");
const output = resolve(arg("--output") ?? "");
if (!flowPath || !output) fail("--flow and --output are required");
const flow = JSON.parse(await readFile(flowPath, "utf8"));
if (flow.status !== "stable") fail("only stable flows can generate Playwright; promote and review first");
if (flow.scope !== "public") fail("automatic Playwright generation supports public flows only");
if ((flow.observations ?? []).length < 3) fail("stable flow requires at least three observations");
const lines = [
  'import { test, expect } from "@playwright/test";',
  '',
  `test(${JSON.stringify(flow.id)}, async ({ page }) => {`,
  '  const baseURL = process.env.QA_BASE_URL;',
  '  if (!baseURL) throw new Error("QA_BASE_URL is required");'
];
for (const step of flow.steps ?? []) {
  if (step.action === "navigate") lines.push(`  await page.goto(new URL(${JSON.stringify(step.path)}, baseURL).toString());`);
  if (step.action === "click") lines.push(`  await page.getByRole(${JSON.stringify(step.locator.role)}, { name: ${JSON.stringify(step.locator.name)} }).click();`);
  if (step.action === "expect_url") lines.push(`  await expect(page).toHaveURL(new RegExp(${JSON.stringify(step.pattern)}));`);
  if (step.action === "expect_visible") lines.push(`  await expect(page.getByText(${JSON.stringify(step.text)})).toBeVisible();`);
}
lines.push('});', '');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, lines.join("\n"));
console.log(`Generated ${output} from stable flow ${flow.id}. Review before adding to CI.`);
function arg(flag) { const i = args.indexOf(flag); return i === -1 ? undefined : args[i + 1]; }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
