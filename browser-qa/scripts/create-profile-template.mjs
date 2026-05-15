#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  printHelp();
  process.exit(0);
}

const mode = getArgValue("--mode") ?? "local-dev";
const output = resolve(getArgValue("--output") ?? ".browser-qa/profile.json");
const force = args.has("--force");

if (!["local-dev", "docker-compose", "deployed"].includes(mode)) {
  fail(`Unsupported --mode "${mode}". Use local-dev, docker-compose, or deployed.`);
}

const profile = createProfile(mode);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(profile, null, 2)}\n`, { flag: force ? "w" : "wx" }).catch((error) => {
  if (error && error.code === "EEXIST") {
    fail(`${output} already exists. Re-run with --force to overwrite it.`);
  }
  throw error;
});

console.log(`Created ${output}`);

function createProfile(selectedMode) {
  const base = {
    schema_version: 1,
    project_name: "TODO",
    last_discovered_at: new Date().toISOString(),
    preferred_mode: selectedMode,
    runtime: {
      start_commands: [],
      health_commands: []
    },
    services: [],
    auth: {
      has_login_flow: false,
      credential_sources: {}
    },
    qa_paths: {
      public: ["/"],
      authenticated: []
    },
    log_sources: {
      docker_compose_services: [],
      notes: []
    },
    fingerprints: {},
    notes: [
      "Store only non-secret facts in this file.",
      "Use environment variable names for credentials, never actual passwords or tokens."
    ]
  };

  if (selectedMode === "local-dev") {
    base.runtime.start_commands = ["npm run dev"];
    base.runtime.health_commands = ["curl -fsS http://127.0.0.1:3000/ || true"];
    base.services = [
      {
        name: "web",
        kind: "frontend",
        url: "http://127.0.0.1:3000",
        health_path: "/",
        login_path: null
      }
    ];
  }

  if (selectedMode === "docker-compose") {
    base.runtime.start_commands = ["docker compose up -d"];
    base.runtime.health_commands = ["docker compose ps"];
    base.services = [
      {
        name: "web",
        kind: "frontend",
        url: "http://127.0.0.1:3000",
        health_path: "/",
        login_path: null
      },
      {
        name: "api",
        kind: "backend",
        url: "http://127.0.0.1:8000",
        health_path: "/health",
        docs_path: "/docs"
      }
    ];
    base.log_sources.docker_compose_services = ["web", "api"];
  }

  if (selectedMode === "deployed") {
    base.runtime.health_commands = ["curl -fsS https://example.com/ || true"];
    base.services = [
      {
        name: "web",
        kind: "frontend",
        url: "https://example.com",
        health_path: "/",
        login_path: null
      }
    ];
  }

  return base;
}

function getArgValue(name) {
  const argsList = process.argv.slice(2);
  const index = argsList.indexOf(name);
  if (index === -1) return undefined;
  return argsList[index + 1];
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Create a browser-qa project profile template.

Usage:
  node browser-qa/scripts/create-profile-template.mjs [options]

Options:
  --mode <local-dev|docker-compose|deployed>  Template mode (default: local-dev)
  --output <path>                             Output path (default: .browser-qa/profile.json)
  --force                                     Overwrite an existing file
  -h, --help                                  Show this help
`);
}
