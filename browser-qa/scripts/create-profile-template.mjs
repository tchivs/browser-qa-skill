#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const argv = process.argv.slice(2);
const args = new Set(argv);
if (args.has("--help") || args.has("-h")) {
  printHelp();
  process.exit(0);
}

const mode = getArgValue("--mode") ?? "local-dev";
const environment = getArgValue("--environment") ?? (mode === "deployed" ? "staging" : "local");
const output = resolve(getArgValue("--output") ?? ".browser-qa/profile.json");
const force = args.has("--force");

if (!["local-dev", "docker-compose", "deployed"].includes(mode)) {
  fail(`Unsupported --mode "${mode}". Use local-dev, docker-compose, or deployed.`);
}
if (!["local", "dev", "test", "preview", "staging", "production"].includes(environment)) {
  fail(`Unsupported --environment "${environment}".`);
}

const profile = createProfile(mode, environment);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(profile, null, 2)}\n`, { flag: force ? "w" : "wx" }).catch((error) => {
  if (error?.code === "EEXIST") fail(`${output} already exists. Re-run with --force to overwrite it.`);
  throw error;
});
console.log(`Created ${output}`);
console.log("Template is intentionally blocked. Replace TODO values, add evidence, and validate before browser QA.");

function createProfile(selectedMode, selectedEnvironment) {
  const base = {
    schema_version: 2,
    project_name: "TODO",
    project_root: ".",
    environment: selectedEnvironment,
    safety: {
      destructive_actions_allowed: false,
      test_data_prefix: "qa-"
    },
    preferred_mode: selectedMode,
    runtime: {
      working_directory: ".",
      cleanup_policy: "stop-started",
      start_commands: [],
      stop_commands: [],
      health_commands: []
    },
    services: [],
    auth: {
      required: false,
      strategy: "none",
      credential_sources: {},
      secret_file: null,
      seed_or_setup_command: null
    },
    qa_paths: { public: ["/"], authenticated: [], admin: [] },
    viewports: [
      { name: "desktop", width: 1440, height: 900 },
      { name: "mobile", width: 390, height: 844 }
    ],
    log_sources: { commands: [], notes: [] },
    discovery: {
      status: "blocked",
      evidence: [],
      last_discovered_at: new Date().toISOString(),
      last_verified_at: null
    },
    fingerprints: {},
    notes: [
      "Store only non-secret facts here.",
      "Use environment-variable or secret-file references, never passwords or tokens."
    ]
  };

  if (selectedMode === "local-dev") {
    base.runtime.start_commands = ["TODO: command from project evidence"];
    base.runtime.stop_commands = ["TODO: cleanup command or leave-running"];
    base.runtime.health_commands = ["TODO: HTTP health command"];
    base.services = [{ name: "web", kind: "frontend", url: "http://127.0.0.1:3000", health_path: "/", login_path: null }];
  } else if (selectedMode === "docker-compose") {
    base.runtime.start_commands = ["docker compose up -d"];
    base.runtime.stop_commands = ["docker compose stop"];
    base.runtime.health_commands = ["docker compose ps", "TODO: HTTP health command"];
    base.services = [{ name: "web", kind: "frontend", url: "http://127.0.0.1:3000", health_path: "/", login_path: null }];
    base.log_sources.commands = ["docker compose logs --tail=200"];
  } else {
    base.runtime.cleanup_policy = "leave-running";
    base.runtime.health_commands = ["TODO: curl deployed URL"];
    base.services = [{ name: "web", kind: "frontend", url: "https://example.com", health_path: "/", login_path: null }];
  }
  return base;
}

function getArgValue(name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}
function fail(message) { console.error(`Error: ${message}`); process.exit(1); }
function printHelp() {
  console.log(`Create a blocked browser-qa profile template.\n\nUsage:\n  node browser-qa/scripts/create-profile-template.mjs [options]\n\nOptions:\n  --mode <local-dev|docker-compose|deployed>\n  --environment <local|dev|test|preview|staging|production>\n  --output <path>\n  --force\n  -h, --help\n`);
}
