#!/usr/bin/env node

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] ?? resolve(scriptDir, "../.."));
const validator = resolve(root, "browser-qa/scripts/validate-profile.mjs");
const dir = await mkdtemp(join(tmpdir(), "browser-qa-validator-"));
let failures = 0;

try {
  process.env.QA_ADMIN_USERNAME = "qa-user";
  process.env.QA_ADMIN_PASSWORD = "qa-password";
  await expectResult("ready local profile passes", readyProfile(), true);

  const badReadiness = readyProfile();
  badReadiness.readiness.authenticated = "n/a";
  await expectResult("protected scope cannot be n/a", badReadiness, false);

  const badRetryPolicy = readyProfile();
  badRetryPolicy.run_policy.max_idempotent_retries = 2;
  await expectResult("retry policy rejects more than one retry", badRetryPolicy, false);

  const incomplete = readyProfile();
  incomplete.project_name = "TODO";
  incomplete.discovery.status = "blocked";
  incomplete.discovery.evidence = [];
  incomplete.discovery.last_verified_at = null;
  await expectResult("incomplete profile fails closed", incomplete, false);

  const literalSecret = readyProfile();
  literalSecret.auth.credential_sources.password = { type: "env", name: "password=SuperSecret123" };
  await expectResult("literal secret-like value is rejected", literalSecret, false);

  const unsafeProduction = readyProfile();
  unsafeProduction.environment = "production";
  unsafeProduction.preferred_mode = "deployed";
  unsafeProduction.runtime.start_commands = [];
  unsafeProduction.runtime.cleanup_policy = "leave-running";
  unsafeProduction.safety.destructive_actions_allowed = true;
  unsafeProduction.services[0].url = "https://prod.example.org";
  await expectResult("destructive production profile is rejected", unsafeProduction, false);

  const authMismatch = readyProfile();
  authMismatch.auth.required = false;
  authMismatch.auth.strategy = "none";
  authMismatch.auth.credential_sources = {};
  await expectResult("protected routes require authentication", authMismatch, false);

  const unresolvedEnv = readyProfile();
  unresolvedEnv.auth.credential_sources.password.name = "QA_MISSING_PASSWORD";
  delete process.env.QA_MISSING_PASSWORD;
  await expectResult("unresolved credential env fails closed", unresolvedEnv, false);

  const urlCredential = readyProfile();
  urlCredential.services[0].url = "https://admin:supersecret@example.org";
  await expectResult("URL embedded credentials are rejected", urlCredential, false);

  const awsSecret = readyProfile();
  awsSecret.notes = ["AKIAIOSFODNN7EXAMPLE"];
  await expectResult("AWS access key is rejected", awsSecret, false);

  const invalidDate = readyProfile();
  invalidDate.discovery.last_verified_at = "not-a-date";
  await expectResult("invalid verification timestamp is rejected", invalidDate, false);

  const unsafeProductionReadOnly = readyProfile();
  unsafeProductionReadOnly.environment = "production";
  unsafeProductionReadOnly.preferred_mode = "deployed";
  unsafeProductionReadOnly.runtime.start_commands = [];
  unsafeProductionReadOnly.runtime.cleanup_policy = "leave-running";
  unsafeProductionReadOnly.safety.read_only = false;
  unsafeProductionReadOnly.services[0].url = "https://prod.example.org";
  await expectResult("production requires read-only policy", unsafeProductionReadOnly, false);
} finally {
  await rm(dir, { recursive: true, force: true });
}

if (failures) {
  console.error(`${failures} profile validator test(s) failed`);
  process.exit(1);
}
console.log("profile validator tests OK");

async function expectResult(name, profile, shouldPass) {
  const file = join(dir, `${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`);
  await writeFile(file, `${JSON.stringify(profile, null, 2)}\n`);
  const result = spawnSync(process.execPath, [validator, "--profile", file], { encoding: "utf8" });
  const passed = result.status === 0;
  if (passed !== shouldPass) {
    failures++;
    console.error(`FAIL: ${name}`);
    console.error((result.stdout ?? "") + (result.stderr ?? ""));
  } else {
    console.log(`PASS: ${name}`);
  }
}

function readyProfile() {
  return {
    schema_version: 3,
    project_name: "sample-app",
    project_root: ".",
    environment: "local",
    safety: { destructive_actions_allowed: false, read_only: true, test_data_prefix: "qa-" },
    preferred_mode: "docker-compose",
    runtime: {
      working_directory: ".",
      cleanup_policy: "stop-started",
      start_commands: ["docker compose up -d"],
      stop_commands: ["docker compose stop"],
      health_commands: ["curl -fsS http://127.0.0.1:3000/"]
    },
    services: [{ name: "web", kind: "frontend", url: "http://127.0.0.1:3000", health_path: "/", login_path: "/signin" }],
    auth: {
      required: true,
      strategy: "form",
      credential_sources: {
        username: { type: "env", name: "QA_ADMIN_USERNAME" },
        password: { type: "env", name: "QA_ADMIN_PASSWORD" }
      },
      secret_file: ".browser-qa/env.local",
      seed_or_setup_command: null
    },
    qa_paths: { public: ["/", "/signin"], authenticated: ["/dashboard"], admin: [] },
    readiness: { public: "ready", authenticated: "ready", admin: "n/a" },
    run_policy: { max_idempotent_retries: 1, evidence_root: ".browser-qa/runs" },
    viewports: [{ name: "desktop", width: 1440, height: 900 }],
    log_sources: { commands: ["docker compose logs --tail=200"], notes: [] },
    discovery: {
      status: "ready",
      evidence: ["README.md", "compose.yaml", ".env.example"],
      last_discovered_at: "2026-01-01T00:00:00Z",
      last_verified_at: "2026-01-01T00:00:00Z"
    },
    fingerprints: {},
    notes: []
  };
}
