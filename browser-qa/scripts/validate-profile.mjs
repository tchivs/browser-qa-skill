#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const profilePath = resolve(getArgValue("--profile") ?? ".browser-qa/profile.json");
const profile = await readJson(profilePath);
const errors = [];
const warnings = [];

validateRoot(profile);
validateRuntime(profile.runtime);
validateServices(profile.services);
validateAuth(profile.auth);
validateQaPaths(profile.qa_paths);
scanForSecrets(profile);

if (warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error("Profile validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Profile OK: ${profilePath}`);

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) fail(`${path} is not valid JSON: ${error.message}`);
    fail(`Unable to read ${path}: ${error.message}`);
  }
}

function validateRoot(value) {
  if (!isPlainObject(value)) errors.push("profile must be a JSON object");
  if (value.schema_version !== 1) errors.push("schema_version must be 1");
  if (typeof value.project_name !== "string" || value.project_name.trim() === "") {
    errors.push("project_name must be a non-empty string");
  }
  if (!["local-dev", "docker-compose", "deployed"].includes(value.preferred_mode)) {
    errors.push("preferred_mode must be local-dev, docker-compose, or deployed");
  }
}

function validateRuntime(runtime) {
  if (!isPlainObject(runtime)) {
    errors.push("runtime must be an object");
    return;
  }
  if (!Array.isArray(runtime.start_commands)) errors.push("runtime.start_commands must be an array");
  if (!Array.isArray(runtime.health_commands)) errors.push("runtime.health_commands must be an array");
}

function validateServices(services) {
  if (!Array.isArray(services)) {
    errors.push("services must be an array");
    return;
  }
  if (services.length === 0) warnings.push("services is empty; browser QA needs at least one URL to test");

  for (const [index, service] of services.entries()) {
    const prefix = `services[${index}]`;
    if (!isPlainObject(service)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (typeof service.name !== "string" || service.name.trim() === "") errors.push(`${prefix}.name must be a non-empty string`);
    if (!["frontend", "backend", "docs", "other"].includes(service.kind)) {
      errors.push(`${prefix}.kind must be frontend, backend, docs, or other`);
    }
    if (typeof service.url !== "string" || !isValidHttpUrl(service.url)) errors.push(`${prefix}.url must be an http(s) URL`);
    for (const field of ["health_path", "login_path", "docs_path"]) {
      if (service[field] !== undefined && service[field] !== null && !isPathString(service[field])) {
        errors.push(`${prefix}.${field} must be null or a path starting with /`);
      }
    }
  }
}

function validateAuth(auth) {
  if (auth === undefined) return;
  if (!isPlainObject(auth)) {
    errors.push("auth must be an object when present");
    return;
  }
  if (typeof auth.has_login_flow !== "boolean") errors.push("auth.has_login_flow must be a boolean");
  if (auth.credential_sources !== undefined && !isPlainObject(auth.credential_sources)) {
    errors.push("auth.credential_sources must be an object when present");
    return;
  }
  for (const [key, value] of Object.entries(auth.credential_sources ?? {})) {
    if (typeof value !== "string" || value.trim() === "") errors.push(`auth.credential_sources.${key} must be a non-empty env var name`);
    if (typeof value === "string" && !/^[A-Z][A-Z0-9_]*$/.test(value)) {
      warnings.push(`auth.credential_sources.${key} should be an env var name like ADMIN_PASSWORD, not a literal secret`);
    }
  }
}

function validateQaPaths(paths) {
  if (!isPlainObject(paths)) {
    errors.push("qa_paths must be an object");
    return;
  }
  for (const field of ["public", "authenticated", "admin"]) {
    if (paths[field] === undefined) continue;
    if (!Array.isArray(paths[field])) {
      errors.push(`qa_paths.${field} must be an array`);
      continue;
    }
    for (const [index, value] of paths[field].entries()) {
      if (!isPathString(value)) errors.push(`qa_paths.${field}[${index}] must be a path starting with /`);
    }
  }
}

function scanForSecrets(value, path = "profile") {
  if (typeof value === "string") {
    if (looksLikeSecret(value)) errors.push(`${path} looks like it contains a secret value; store env var names only`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForSecrets(item, `${path}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      scanForSecrets(item, `${path}.${key}`);
    }
  }
}

function looksLikeSecret(value) {
  const text = value.trim();
  if (text === "" || text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/")) return false;
  if (/^[A-Z][A-Z0-9_]*$/.test(text)) return false;
  if (/^(TODO|null|none|example|web|api|frontend|backend)$/i.test(text)) return false;
  if (/^(ghp_|github_pat_|sk-|xox[baprs]-|eyJ[A-Za-z0-9_-]+\.)/.test(text)) return true;
  if (/password|passwd|secret|token|cookie|bearer/i.test(text) && /[:=]/.test(text)) return true;
  return false;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPathString(value) {
  return typeof value === "string" && value.startsWith("/");
}

function getArgValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Validate a browser-qa project profile.

Usage:
  node browser-qa/scripts/validate-profile.mjs [options]

Options:
  --profile <path>  Profile path (default: .browser-qa/profile.json)
  -h, --help        Show this help
`);
}
