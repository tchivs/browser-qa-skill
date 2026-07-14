#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const skillDir = resolve(root, "browser-qa");
const skillPath = resolve(skillDir, "SKILL.md");
const evalsPath = resolve(skillDir, "evals/evals.json");
const readmePath = resolve(root, "README.md");
const englishReadmePath = resolve(root, "README.en.md");
const legacyZhReadmePath = resolve(root, "README.zh-CN.md");
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
  for (const expected of [
    "Non-Negotiable Readiness Gate",
    "Persistence is mandatory",
    "Safety and Environment Policy",
    "Run Isolation and Evidence",
    "credential source",
    ".browser-qa/profile.json"
  ]) {
    if (!content.includes(expected)) errors.push(`SKILL.md missing required workflow section/text: ${expected}`);
  }
}

async function checkEvals() {
  if (!existsSync(evalsPath)) {
    errors.push("browser-qa/evals/evals.json is missing");
    return;
  }
  const evals = JSON.parse(await readFile(evalsPath, "utf8"));
  if (evals.skill_name !== "browser-qa") errors.push("evals.skill_name must be browser-qa");
  if (!Array.isArray(evals.evals) || evals.evals.length < 8) errors.push("evals.evals should contain at least eight prompts");
  for (const script of ["create-profile-template.mjs", "validate-profile.mjs", "test-profile-validator.mjs", "create-run-manifest.mjs", "validate-run-manifest.mjs", "test-run-manifest.mjs"]) {
    if (!existsSync(resolve(skillDir, "scripts", script))) errors.push(`browser-qa/scripts/${script} is missing`);
  }
}

async function checkDocs() {
  if (!existsSync(readmePath)) errors.push("README.md (Chinese primary documentation) is missing");
  if (!existsSync(englishReadmePath)) errors.push("README.en.md is missing");
  if (!existsSync(legacyZhReadmePath)) warnings.push("README.zh-CN.md compatibility redirect is missing");
  if (!existsSync(readmePath)) return;
  const readme = await readFile(readmePath, "utf8");
  for (const expected of [
    "npx skills add tchivs/browser-qa-skill --skill browser-qa -g",
    "npx skills add tchivs/browser-qa-skill --skill browser-qa",
    "README.en.md",
    "browser-qa/SKILL.md",
    "强制就绪门禁",
    "Profile%20Schema-v3",
    "Hermes%20Agent-ready"
  ]) {
    if (!readme.includes(expected)) errors.push(`README.md missing expected text: ${expected}`);
  }
}

function checkFiles() {
  if (!existsSync(licensePath)) warnings.push("LICENSE is missing");
}

function parseFrontmatter(content) {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return null;
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) return null;
  const raw = normalized.slice(4, end).trim();
  const result = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].trim();
  }
  return result;
}
