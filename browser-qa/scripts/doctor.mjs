#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const skillDir = resolve(root, "browser-qa");
const skillPath = resolve(skillDir, "SKILL.md");
const evalsPath = resolve(skillDir, "evals/evals.json");
const readmePath = resolve(root, "README.md");
const zhReadmePath = resolve(root, "README.zh-CN.md");
const licensePath = resolve(root, "LICENSE");

const errors = [];
const warnings = [];

await checkSkill();
await checkEvals();
await checkDocs();
checkFiles();

if (warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error("browser-qa skill repo doctor failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("browser-qa skill repo OK");

async function checkSkill() {
  if (!existsSync(skillPath)) {
    errors.push("browser-qa/SKILL.md is missing");
    return;
  }
  const content = await readFile(skillPath, "utf8");
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push("browser-qa/SKILL.md must start with YAML frontmatter");
    return;
  }
  if (frontmatter.name !== "browser-qa") errors.push("SKILL.md frontmatter name must be browser-qa");
  if (!frontmatter.description || frontmatter.description.length < 40) errors.push("SKILL.md description must be specific and non-empty");
  if (!content.includes("Project QA profile")) warnings.push("SKILL.md should explain Project QA profile behavior");
  if (!content.includes("command -v agent-browser")) warnings.push("SKILL.md should check agent-browser availability before use");
}

async function checkEvals() {
  if (!existsSync(evalsPath)) {
    errors.push("browser-qa/evals/evals.json is missing");
    return;
  }
  const evals = JSON.parse(await readFile(evalsPath, "utf8"));
  if (evals.skill_name !== "browser-qa") errors.push("evals.skill_name must be browser-qa");
  if (!Array.isArray(evals.evals) || evals.evals.length < 3) errors.push("evals.evals should contain at least three prompts");
}

async function checkDocs() {
  if (!existsSync(readmePath)) errors.push("README.md is missing");
  if (!existsSync(zhReadmePath)) warnings.push("README.zh-CN.md is missing");
  if (!existsSync(readmePath)) return;
  const readme = await readFile(readmePath, "utf8");
  for (const expected of [
    "npx skills add tchivs/browser-qa-skill --skill browser-qa -g",
    "npx skills add tchivs/browser-qa-skill --skill browser-qa",
    "README.zh-CN.md",
    "browser-qa/SKILL.md"
  ]) {
    if (!readme.includes(expected)) errors.push(`README.md missing expected text: ${expected}`);
  }
}

function checkFiles() {
  if (!existsSync(licensePath)) warnings.push("LICENSE is missing");
}

function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---", 4);
  if (end === -1) return null;
  const raw = content.slice(4, end).trim();
  const result = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].trim();
  }
  return result;
}
