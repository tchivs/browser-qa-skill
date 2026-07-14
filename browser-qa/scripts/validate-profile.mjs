#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { printHelp(); process.exit(0); }
const profilePath = resolve(getArgValue("--profile") ?? ".browser-qa/profile.json");
const profile = await readJson(profilePath);
const errors = [];
const warnings = [];

validateRoot(profile);
validateSafety(profile.safety, profile.environment);
validateRuntime(profile.runtime, profile.preferred_mode);
validateServices(profile.services);
validateAuth(profile.auth, profile.qa_paths);
validateQaPaths(profile.qa_paths);
validateDiscovery(profile.discovery);
validateViewports(profile.viewports);
scanForSecrets(profile);
scanForTodos(profile);

if (warnings.length) { console.warn("Warnings:"); for (const warning of warnings) console.warn(`- ${warning}`); }
if (errors.length) { console.error("Profile validation failed:"); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log(`Profile OK: ${profilePath}`);

async function readJson(path) {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) { fail(error instanceof SyntaxError ? `${path} is not valid JSON: ${error.message}` : `Unable to read ${path}: ${error.message}`); }
}
function validateRoot(v) {
  if (!isObject(v)) { errors.push("profile must be a JSON object"); return; }
  if (v.schema_version !== 2) errors.push("schema_version must be 2");
  requiredString(v.project_name, "project_name");
  requiredString(v.project_root, "project_root");
  if (!["local", "dev", "test", "preview", "staging", "production"].includes(v.environment)) errors.push("environment must be local, dev, test, preview, staging, or production");
  if (!["local-dev", "docker-compose", "deployed"].includes(v.preferred_mode)) errors.push("preferred_mode must be local-dev, docker-compose, or deployed");
}
function validateSafety(safety, environment) {
  if (!isObject(safety)) { errors.push("safety must be an object"); return; }
  if (typeof safety.destructive_actions_allowed !== "boolean") errors.push("safety.destructive_actions_allowed must be boolean");
  requiredString(safety.test_data_prefix, "safety.test_data_prefix");
  if (environment === "production" && safety.destructive_actions_allowed) errors.push("production profile cannot enable destructive_actions_allowed; obtain explicit per-run authorization instead");
}
function validateRuntime(runtime, mode) {
  if (!isObject(runtime)) { errors.push("runtime must be an object"); return; }
  requiredString(runtime.working_directory, "runtime.working_directory");
  if (!["leave-running", "stop-started", "project-command"].includes(runtime.cleanup_policy)) errors.push("runtime.cleanup_policy must be leave-running, stop-started, or project-command");
  for (const field of ["start_commands", "stop_commands", "health_commands"]) if (!Array.isArray(runtime[field])) errors.push(`runtime.${field} must be an array`);
  if (mode !== "deployed" && !(runtime.start_commands?.length > 0)) errors.push("runtime.start_commands must not be empty for local deployment modes");
  if (!(runtime.health_commands?.length > 0)) errors.push("runtime.health_commands must not be empty");
  if (runtime.cleanup_policy === "project-command" && !(runtime.stop_commands?.length > 0)) errors.push("runtime.stop_commands is required for project-command cleanup");
}
function validateServices(services) {
  if (!Array.isArray(services) || services.length === 0) { errors.push("services must contain at least one service"); return; }
  let frontends = 0;
  services.forEach((service, index) => {
    const p = `services[${index}]`;
    if (!isObject(service)) { errors.push(`${p} must be an object`); return; }
    requiredString(service.name, `${p}.name`);
    if (!["frontend", "backend", "docs", "other"].includes(service.kind)) errors.push(`${p}.kind is invalid`);
    if (service.kind === "frontend") frontends++;
    if (typeof service.url !== "string" || !isHttpUrl(service.url)) errors.push(`${p}.url must be an http(s) URL`);
    for (const field of ["health_path", "login_path", "docs_path"]) if (service[field] != null && !isPath(service[field])) errors.push(`${p}.${field} must start with / or be null`);
  });
  if (frontends === 0) errors.push("services must include at least one frontend");
}
function validateAuth(auth, paths) {
  if (!isObject(auth)) { errors.push("auth must be an object"); return; }
  if (typeof auth.required !== "boolean") errors.push("auth.required must be boolean");
  if (!["none", "form", "basic", "sso", "storage-state", "other"].includes(auth.strategy)) errors.push("auth.strategy is invalid");
  if (!isObject(auth.credential_sources)) errors.push("auth.credential_sources must be an object");
  if (auth.secret_file != null && typeof auth.secret_file !== "string") errors.push("auth.secret_file must be a string or null");
  const protectedPaths = [...(paths?.authenticated ?? []), ...(paths?.admin ?? [])];
  if (auth.required && auth.strategy === "none") errors.push("auth.strategy cannot be none when auth.required is true");
  if (protectedPaths.length && !auth.required) errors.push("authenticated/admin paths require auth.required=true");
  if (auth.required && Object.keys(auth.credential_sources ?? {}).length === 0 && !auth.seed_or_setup_command && !auth.secret_file) errors.push("required auth needs credential_sources, secret_file, or seed_or_setup_command");
  validateCredentialSources(auth.credential_sources ?? {});
}
function validateCredentialSources(sources, path = "auth.credential_sources") {
  for (const [key, source] of Object.entries(sources)) {
    const p = `${path}.${key}`;
    if (!isObject(source)) { errors.push(`${p} must be an object reference, not a literal value`); continue; }
    if (!["env", "secret-file", "storage-state", "command", "user"].includes(source.type)) errors.push(`${p}.type is invalid`);
    if (source.type === "env" && !/^[A-Z][A-Z0-9_]*$/.test(source.name ?? "")) errors.push(`${p}.name must be an uppercase environment variable name`);
    if (source.type !== "user" && !source.name && !source.path && !source.command) errors.push(`${p} must identify its source`);
  }
}
function validateQaPaths(paths) {
  if (!isObject(paths)) { errors.push("qa_paths must be an object"); return; }
  for (const field of ["public", "authenticated", "admin"]) {
    if (!Array.isArray(paths[field])) { errors.push(`qa_paths.${field} must be an array`); continue; }
    paths[field].forEach((v, i) => { if (!isPath(v)) errors.push(`qa_paths.${field}[${i}] must start with /`); });
  }
  if (![...(paths.public ?? []), ...(paths.authenticated ?? []), ...(paths.admin ?? [])].length) errors.push("qa_paths must contain at least one route");
}
function validateDiscovery(d) {
  if (!isObject(d)) { errors.push("discovery must be an object"); return; }
  if (d.status !== "ready") errors.push("discovery.status must be ready before browser QA");
  if (!Array.isArray(d.evidence) || d.evidence.length === 0) errors.push("discovery.evidence must contain supporting project files or user-provided target evidence");
  requiredString(d.last_discovered_at, "discovery.last_discovered_at");
  requiredString(d.last_verified_at, "discovery.last_verified_at");
}
function validateViewports(viewports) {
  if (viewports == null) return;
  if (!Array.isArray(viewports)) { errors.push("viewports must be an array"); return; }
  viewports.forEach((v, i) => {
    if (!isObject(v) || !v.name || !Number.isInteger(v.width) || !Number.isInteger(v.height) || v.width <= 0 || v.height <= 0) errors.push(`viewports[${i}] must have name and positive integer width/height`);
  });
}
function scanForTodos(value, path = "profile") {
  if (typeof value === "string" && /\b(TODO|CHANGEME|example\.com)\b/i.test(value)) errors.push(`${path} contains unresolved placeholder: ${value}`);
  else if (Array.isArray(value)) value.forEach((x, i) => scanForTodos(x, `${path}[${i}]`));
  else if (isObject(value)) Object.entries(value).forEach(([k, x]) => scanForTodos(x, `${path}.${k}`));
}
function scanForSecrets(value, path = "profile") {
  if (typeof value === "string") { if (looksLikeSecret(value)) errors.push(`${path} looks like a literal secret; store a source reference only`); return; }
  if (Array.isArray(value)) return value.forEach((x, i) => scanForSecrets(x, `${path}[${i}]`));
  if (isObject(value)) Object.entries(value).forEach(([k, x]) => scanForSecrets(x, `${path}.${k}`));
}
function looksLikeSecret(v) {
  const t = v.trim();
  if (!t || t.startsWith("http") || t.startsWith("/") || /^[A-Z][A-Z0-9_]*$/.test(t)) return false;
  if (/^(ghp_|github_pat_|sk-|xox[baprs]-|eyJ[A-Za-z0-9_-]+\.)/.test(t)) return true;
  return /(password|passwd|secret|token|cookie|authorization)\s*[:=]\s*\S+/i.test(t);
}
function requiredString(v, p) { if (typeof v !== "string" || !v.trim()) errors.push(`${p} must be a non-empty string`); }
function isObject(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
function isHttpUrl(v) { try { return ["http:", "https:"].includes(new URL(v).protocol); } catch { return false; } }
function isPath(v) { return typeof v === "string" && v.startsWith("/"); }
function getArgValue(name) { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; }
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
function printHelp() { console.log("Usage: node browser-qa/scripts/validate-profile.mjs [--profile .browser-qa/profile.json]"); }
