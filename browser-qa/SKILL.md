---
name: browser-qa
description: "Use whenever the user asks to QA, test, verify, click through, dogfood, smoke-test, or regression-test a website/web app; check login, admin/authenticated flows, responsive UI, browser console/network errors; or validate a local dev server, Docker Compose stack, staging/production deployment, frontend URL, or API-backed UI. Mandatory orchestrator: discover and persist the project QA profile, deployment method, URLs, health checks, and credential sources before opening the browser. Never guess startup commands, URLs, accounts, or passwords."
version: 2.0.0
author: tchivs
license: MIT
compatibility: hermes-agent, opencode, claude-code, codex, cursor
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [browser, qa, web, login, credentials, docker-compose, deployment, regression]
    related_skills: [dogfood, systematic-debugging]
---

# Browser QA Orchestrator

## Overview

Run browser QA only after proving **what to deploy, where it is reachable, and how authentication is obtained**. The browser is the execution phase, not the discovery mechanism.

This skill has a hard readiness gate:

```text
project discovery → persisted QA profile → deployment/health proof
→ credential resolution → browser execution → evidence/report
```

**Hard rule:** do not open the app or begin authenticated QA while deployment mode, target URL, or required credentials are unresolved. Never invent defaults. Public-route QA may continue only when its target is independently verified; report authenticated routes as blocked.

## When to Use

Use for any request that means:

- QA/test/verify/check/dogfood a website or web app
- test login, admin, authenticated, checkout, form, navigation, modal, or responsive flows
- inspect console errors, failed browser requests, blank pages, or UI/backend integration failures
- verify local dev, Docker Compose, preview, staging, or production deployment
- run browser regression after frontend/backend changes

Do not use as the primary workflow for unit tests or for authoring a durable Playwright suite; hand those off after exploratory QA establishes the correct environment.

## Non-Negotiable Readiness Gate

Before the first browser navigation, all applicable rows must be `READY` or explicitly `N/A`:

| Gate | Required proof |
|---|---|
| Project root | Repository/project root identified |
| QA profile | `.browser-qa/profile.json` loaded or newly written |
| Deployment mode | One of `local-dev`, `docker-compose`, or `deployed`; supported by project evidence |
| Start command | Exact command from project docs/config, or `N/A` for an already deployed target |
| Target URL | Exact frontend URL, not an inferred port with no evidence |
| Health | URL and required services actually respond |
| Authentication | `N/A`, or login path plus resolvable credential source/session setup |
| Scope | Public/authenticated routes or critical flows identified |

If a required gate is unresolved:

1. continue deterministic discovery;
2. do not guess;
3. ask the user only for the irretrievable missing fact;
4. mark affected QA scope `BLOCKED` rather than pretending it was tested.

## Project-Local Artifacts

Use these project-local files:

```text
.browser-qa/
├── profile.json          # required, non-secret QA contract
├── env.example           # optional credential variable names/placeholders
└── env.local             # optional secrets, local-only and gitignored
```

Search for an existing profile in this order:

1. `.browser-qa/profile.json`
2. `.opencode/browser-qa.json`
3. `.browser-qa.md` (legacy; migrate useful facts into the JSON profile)

### Persistence is mandatory

When no valid profile exists, discovery is incomplete until `.browser-qa/profile.json` has been written and read back successfully. Do not merely describe what should be saved.

After discovery, deployment verification, or corrected configuration, update the profile immediately so later QA runs do not repeat or forget the result. Preserve user-maintained notes and do not overwrite a valid profile with a generic template.

If the current tool/runtime cannot write project files, state that persistence is blocked and do not claim the environment has been saved.

### Secret handling

`profile.json` stores **references**, never secret values. It may contain:

- environment variable names such as `QA_ADMIN_USERNAME`
- local secret file path such as `.browser-qa/env.local`
- setup command or documented seed account location
- login/session setup instructions that contain no secret

Never place passwords, tokens, cookies, API keys, or production secrets in `profile.json`, logs, screenshots, commits, or reports.

If the user explicitly wants local credential persistence:

1. create/use `.browser-qa/env.local`;
2. add `.browser-qa/env.local` to `.gitignore` before writing a secret;
3. create `.browser-qa/env.example` containing names/placeholders only;
4. never print secret values back in the final report.

Do not create or store plaintext credentials without user authorization. Prefer existing environment variables or secret managers.

## Required Profile Contract

Use at least this shape; add project-specific fields when useful:

```json
{
  "schema_version": 2,
  "project_name": "example-app",
  "project_root": ".",
  "environment": "local",
  "safety": {
    "destructive_actions_allowed": false,
    "read_only": true,
    "test_data_prefix": "qa-"
  },
  "preferred_mode": "docker-compose",
  "runtime": {
    "working_directory": ".",
    "cleanup_policy": "stop-started",
    "start_commands": ["docker compose up -d"],
    "stop_commands": ["docker compose down"],
    "health_commands": ["docker compose ps"]
  },
  "services": [
    {
      "name": "web",
      "kind": "frontend",
      "url": "http://127.0.0.1:5173",
      "health_path": "/",
      "login_path": "/signin"
    }
  ],
  "auth": {
    "required": true,
    "strategy": "form",
    "credential_sources": {
      "username": {"type": "env", "name": "QA_ADMIN_USERNAME"},
      "password": {"type": "env", "name": "QA_ADMIN_PASSWORD"}
    },
    "secret_file": ".browser-qa/env.local",
    "seed_or_setup_command": null
  },
  "qa_paths": {
    "public": ["/", "/signin"],
    "authenticated": ["/dashboard"],
    "admin": []
  },
  "log_sources": {
    "commands": ["docker compose logs --tail=200 web api"]
  },
  "discovery": {
    "status": "ready",
    "evidence": ["README.md", "compose.yaml", ".env.example"],
    "last_discovered_at": "ISO-8601 timestamp",
    "last_verified_at": "ISO-8601 timestamp"
  },
  "fingerprints": {},
  "notes": []
}
```

Use `discovery.status` values: `ready`, `partial`, or `blocked`. Browser QA must not start when a required gate leaves status `partial` or `blocked`.

## Discovery Workflow

### 1. Locate instructions and deployment evidence

Inspect, when present, in this order:

1. `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, project-specific agent instructions
2. `README*`, `docs/`, setup/deployment/runbooks
3. `package.json`, lockfiles, workspace files, Makefile/Taskfile
4. `compose.yaml`, `compose.yml`, `docker-compose*.yml`, Dockerfiles
5. `.env.example`, `.env.sample`, configuration schemas (do not expose `.env` secrets)
6. framework configs (`vite`, `next`, `nuxt`, `angular`, proxies/base URLs)
7. CI/CD and deployment manifests when testing a deployed environment
8. seed scripts, fixtures, migrations, test users, auth docs

Record the exact evidence that supports each profile value. A plausible command or common port is not evidence.

### 2. Choose deployment mode from evidence

- **deployed:** user supplied a URL or project deployment metadata identifies the intended environment.
- **docker-compose:** compose config is documented as the normal integrated-app path and exposes the required frontend/services.
- **local-dev:** package/task scripts document the intended dev workflow and dependencies are available.

When multiple modes are available, prefer an already-running verified target, then the project's documented default. Do not start both. If modes imply materially different data/auth behavior and intent is unclear, ask the user.

### 3. Resolve URL and health checks

Derive URLs from explicit config, compose port mappings, runtime output, or project docs. Start services only with the discovered command. Then prove readiness using service status plus HTTP checks; a running process/container alone is insufficient.

Update the profile only with verified URLs. If startup fails, inspect logs and fix/return the blocker before browser QA.

### 4. Resolve authentication before authenticated QA

Search for credential sources in this order:

A credential reference is not resolved merely because an environment-variable name or file path is present. Before authenticated QA, verify the referenced environment variable exists, the authorized secret file is readable, or the user-provided source is explicitly marked resolved for this run. Never print its value.

1. already-exported QA/test environment variables named by the project
2. `.browser-qa/env.local` (load without printing)
3. documented development/test accounts
4. seed/bootstrap scripts and their documented output
5. test fixtures or authentication setup commands
6. an existing reusable browser storage state/session
7. user-provided credentials

Do not infer passwords from project names, usernames, or common defaults. Do not reset/create accounts unless the user authorized that side effect.

If a source is known but its value is unavailable, record the variable/source name in the profile and ask only for that missing value. Continue verified public QA if useful; authenticated scope remains `BLOCKED`.

### 5. Persist and validate

Write `.browser-qa/profile.json`, then read it back and verify:

- required fields are populated;
- commands and URLs match discovered evidence;
- credential entries are references, not values;
- `discovery.status` reflects actual readiness;
- secret files are gitignored;
- profile secrets have not leaked into Git status/diff.

Only after this succeeds may browser execution begin.

## Reuse and Staleness

On later runs, load the profile **before** broad repository discovery. Revalidate only what can drift:

- project root still matches;
- target URL responds;
- start/health commands still exist;
- credential source is resolvable without revealing it;
- fingerprints for deployment/auth source files have not changed.

Refresh discovery when the profile is missing, partial/blocked, URLs fail, relevant fingerprints change, or the user requests another environment. Update `last_verified_at` after successful checks.

## Safety and Environment Policy

Classify the target before actions:

- `local`, `dev`, `test`, `preview`: normal QA actions are allowed within user scope.
- `staging`: avoid destructive workflows unless explicitly included.
- `production`: require `safety.read_only: true` and default to read-only smoke checks. Do not submit purchases, send messages, delete/update data, create real accounts, trigger billing, upload sensitive files, or run load tests without explicit authorization.

Use unique synthetic test data and the least-privileged test account available. Never reuse a production administrator when a QA role exists. Redact personal data, secrets, cookies, authorization headers, and tokens from screenshots, browser/network dumps, logs, and reports.

Do not reset databases, reseed shared environments, run migrations, stop shared services, or execute `docker compose down -v` unless explicitly authorized. Track every process/container started by QA and clean up only resources created by this run. Respect a profile field such as `runtime.cleanup_policy` (`leave-running`, `stop-started`, or `project-command`).

## Run Isolation and Evidence

Use a fresh browser context/profile for each environment unless the project profile explicitly points to an approved reusable storage state. Never mix local, staging, and production cookies. Clear or close temporary browser state after the run.

Assign a run ID and store evidence under `.browser-qa/runs/<run-id>/` when filesystem access is available. Keep at least:

- `report.md` or `report.json`
- screenshots for failures
- sanitized console/network excerpts
- tested route/viewport matrix

For every failure, capture route, viewport, exact steps, expected result, actual result, and supporting evidence. A retry may classify a symptom as flaky, but must not erase the first failure. Report retry count and both outcomes.

## Browser Execution

After the gate is ready:

1. Open the verified primary frontend URL.
2. Confirm rendered content, not only HTTP 200.
3. Check console errors and failed network requests after navigation and significant interactions.
4. Exercise the profile's critical public routes.
5. If auth is required, resolve secrets privately and test login/logout/session behavior.
6. Exercise authenticated/admin paths, navigation, forms, validation, dialogs, lists/tables, and error states in scope.
7. Test important flows at a narrow viewport when the product supports general users.
8. Correlate silent UI failures with frontend/backend logs.
9. Capture reproducible evidence for each defect.

Prefer accessible role/name, labels, visible text, stable test IDs, then CSS selectors. Prefer observable readiness (URL, network, element state) over fixed sleeps.

## Reporting

Lead with the verdict. Include:

- environment and exact verified URL (without secrets)
- deployment mode and health proof
- credential source status (`resolved`, `not required`, or `blocked`; never values)
- tested public/authenticated/admin scope
- passes and failures with exact routes/interactions
- console/network/log evidence
- blocked and untested scope
- whether `.browser-qa/profile.json` was created or updated
- remaining risks
- cleanup performed and resources intentionally left running
- flaky behavior and retry outcomes

Never report authenticated QA as passed when credentials were unavailable.

## Common Pitfalls

1. **Browser first:** opening a guessed localhost port before discovery. Fix: enforce the readiness table.
2. **Template theater:** generating a TODO profile but never filling or reading it back. Fix: persistence requires project-specific values and validation.
3. **Container equals healthy:** compose says `Up`, but the frontend/API is unusable. Fix: require HTTP/render proof.
4. **Credential guessing:** trying `admin/admin` or claiming login is impossible without searching seeds/docs/env references. Fix: follow credential-source order.
5. **Secret leakage:** putting passwords in profile/report/Git. Fix: references in profile; optional gitignored `env.local` only with authorization.
6. **Discovery every run:** ignoring the profile. Fix: load it first and refresh only stale fields.
7. **Silent scope reduction:** testing public pages and omitting blocked authenticated scope. Fix: explicitly report it.
8. **Wrong environment:** mixing local, staging, and production URLs/accounts. Fix: profile includes a named environment and one verified target.

## Verification Checklist

- [ ] Matching browser-QA requests loaded this orchestrator
- [ ] Project root and instruction files identified
- [ ] Deployment mode and exact commands supported by evidence
- [ ] Target URL and required services verified healthy
- [ ] Authentication marked not required or credential source resolved
- [ ] No username/password/token was guessed or exposed
- [ ] `.browser-qa/profile.json` written/updated and read back
- [ ] Local secret file, if used, is gitignored and authorized
- [ ] Browser context isolated from other environments
- [ ] Destructive/production actions respected the safety policy
- [ ] Browser tested rendered UI, console, network, and scoped flows
- [ ] Authenticated scope is either tested or explicitly blocked
- [ ] Evidence saved with secrets and personal data redacted
- [ ] Resources started by QA were cleaned up per policy
- [ ] Report states environment, profile persistence, evidence, retries, cleanup, and remaining risks
