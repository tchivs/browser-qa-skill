# Browser QA Skill

<p align="center">
  <strong>Make AI agents prove the deployment, target, and authentication setup before claiming browser QA is complete.</strong>
</p>

<p align="center">
  <a href="https://github.com/tchivs/browser-qa-skill/stargazers"><img src="https://img.shields.io/github/stars/tchivs/browser-qa-skill?style=flat-square&logo=github&label=Stars" alt="GitHub Stars"></a>
  <a href="https://github.com/tchivs/browser-qa-skill/commits/main"><img src="https://img.shields.io/github/last-commit/tchivs/browser-qa-skill?style=flat-square&label=Last%20commit" alt="Last commit"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/tchivs/browser-qa-skill?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Profile%20Schema-v4-2563eb?style=flat-square" alt="Profile Schema v2">
  <img src="https://img.shields.io/badge/Hermes%20Agent-ready-6d28d9?style=flat-square" alt="Hermes Agent ready">
  <img src="https://img.shields.io/badge/OpenCode-ready-111827?style=flat-square" alt="OpenCode ready">
</p>

<p align="center">
  <a href="./README.md">中文主文档</a> · <strong>English</strong> · <a href="./browser-qa/SKILL.md">Skill source</a>
</p>

## Overview

`browser-qa` is a browser QA orchestrator for web applications, local development stacks, Docker Compose, and deployed environments.

It prevents a common failure mode: an agent guesses a port, starts the wrong deployment, lacks credentials, and still reports that QA was completed. The enforced workflow is:

```text
project discovery → persisted QA profile → deployment/health proof
→ credential resolution → isolated browser execution
→ evidence → cleanup → factual report
```

The full and authoritative usage documentation is maintained in Chinese in [`README.md`](./README.md).

## Install

Global installation with Skills CLI:

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa -g
```

Project installation:

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa
```

For Hermes Agent, copy `browser-qa/` into:

```text
~/.hermes/skills/software-development/browser-qa/
```

For OpenCode, use either:

```text
~/.config/opencode/skills/browser-qa/
.opencode/skills/browser-qa/
```

## Key guarantees

- Persists non-secret project facts in `.browser-qa/profile.json`.
- Separates public, authenticated, and admin readiness so unavailable credentials block only the affected scope.
- Creates a per-run manifest with profile hash, evidence, retry history, and cleanup status.
- Learns only verified public read-only flows and generates review-required Playwright candidates after three consistent successful runs.
- Does not guess deployment commands, URLs, usernames, or passwords.
- Rejects incomplete templates and unresolved placeholders.
- Verifies HTTP and rendered UI rather than trusting process/container status.
- Keeps credential values out of the profile, reports, screenshots, and Git.
- Treats production as read-only unless the user explicitly authorizes a side effect.
- Isolates browser state across local, staging, and production environments.
- Records evidence, flaky retry outcomes, and resource cleanup.

## Helper scripts

```bash
node browser-qa/scripts/create-profile-template.mjs --mode docker-compose
node browser-qa/scripts/validate-profile.mjs --profile .browser-qa/profile.json
node browser-qa/scripts/test-profile-validator.mjs
node browser-qa/scripts/doctor.mjs
```

## Example request

```text
Run browser QA on this app. First discover and persist the deployment,
URL, health checks, and credential sources. Then test login, navigation,
console errors, failed requests, and mobile behavior with evidence.
```

## Documentation

See the [Chinese README](./README.md) for:

- the readiness gate
- profile schema and credential handling
- production safety policy
- installation across agent runtimes
- supported scenarios and examples
- helper scripts and repository development

## License

[MIT](./LICENSE)
