# browser-qa

[![GitHub repo](https://img.shields.io/badge/GitHub-tchivs%2Fbrowser--qa--skill-181717?style=flat&logo=github)](https://github.com/tchivs/browser-qa-skill)
[![Skill](https://img.shields.io/badge/skill-browser--qa-000000?style=flat)](./browser-qa/SKILL.md)
[![OpenCode](https://img.shields.io/badge/OpenCode-ready-000000?style=flat)](https://opencode.ai/docs/skills/)
[![agent-browser](https://img.shields.io/badge/agent--browser-supported-000000?style=flat)](https://www.npmjs.com/package/agent-browser)
[![Install](https://img.shields.io/badge/install-npx%20skills%20add-000000?style=flat)](#install)
[![License: MIT](https://img.shields.io/badge/license-MIT-000000?style=flat)](./LICENSE)

[中文文档](./README.zh-CN.md)

Your agent says "the app works". This makes it prove it in a browser.

`browser-qa` is an agent skill for real browser QA. It checks the app like a user would: services are up, pages render, login works, navigation is clickable, modals fit on mobile, console errors are visible, failed requests are investigated, and backend logs are part of the story.

Works with local dev servers, Docker Compose stacks, deployed URLs, React/Vite/Next apps, admin dashboards, and most browser-based products.

## Install

Global install:

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa -g
```

Project install:

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa
```

For OpenCode, the easiest manual install is to ask your agent to install it for you.

Global OpenCode prompt:

```text
Install the browser-qa skill globally for OpenCode from this GitHub repository:
https://github.com/tchivs/browser-qa-skill

Use browser-qa/SKILL.md as the source file and install it to:
~/.config/opencode/skills/browser-qa/SKILL.md

Also copy browser-qa/evals/ if supported. Do not modify the skill content.
```

Project OpenCode prompt:

```text
Install the browser-qa skill for this project from this GitHub repository:
https://github.com/tchivs/browser-qa-skill

Use browser-qa/SKILL.md as the source file and install it to:
.opencode/skills/browser-qa/SKILL.md

Also copy browser-qa/evals/ if supported. Do not modify the skill content.
```

Shell fallback, global:

```bash
git clone https://github.com/tchivs/browser-qa-skill.git
mkdir -p ~/.config/opencode/skills/browser-qa
cp browser-qa-skill/browser-qa/SKILL.md ~/.config/opencode/skills/browser-qa/SKILL.md
cp -R browser-qa-skill/browser-qa/evals ~/.config/opencode/skills/browser-qa/evals
```

Shell fallback, project:

```bash
git clone https://github.com/tchivs/browser-qa-skill.git /tmp/browser-qa-skill
mkdir -p .opencode/skills/browser-qa
cp /tmp/browser-qa-skill/browser-qa/SKILL.md .opencode/skills/browser-qa/SKILL.md
cp -R /tmp/browser-qa-skill/browser-qa/evals .opencode/skills/browser-qa/evals
```

## Use

Ask your coding agent:

```text
Run a browser QA pass on this dev deployment. Check login, navigation, console errors, and failed API requests.
```

```text
Docker says all services are up, but the page is blank. Find out whether it is a frontend, API, or backend problem.
```

```text
The admin page works on desktop, but the mobile drawer and modal feel broken. Verify the mobile flow and report issues.
```

The skill will guide the agent to discover the app, open it in a real browser, inspect rendered UI, check network/console failures, correlate logs, and return a concise QA report.

## What it catches

- Blank pages hidden behind "healthy" containers
- Broken login redirects and missing tokens
- Wrong API base URLs and `/api/api/...` style mistakes
- UI flows that silently fail without a visible error
- Mobile dialogs clipped by the viewport or keyboard
- Sidebars, drawers, and overlays with broken z-index behavior
- Tables and tab bars that overflow on small screens
- Buttons, links, and inputs without accessible names or labels
- Backend 500s that never surface clearly in the UI

## Project QA Profile

Most QA skills waste time rediscovering the same app every run. `browser-qa` uses a project-local profile instead.

On first run, it infers the app from files such as:

- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `docker-compose.yml`
- `.env.example`
- `vite.config.*`, `next.config.*`, `nx.json`

Then it saves non-secret facts to:

```text
.browser-qa/profile.json
```

The profile stores URLs, health checks, service names, login paths, smoke paths, and credential **environment variable names**. It must not store passwords, tokens, cookies, or production secrets.

Future runs load the profile first and only refresh discovery when files changed, URLs are stale, or the user explicitly asks to rediscover the app.

## How it works

```text
discover project → create/reuse QA profile → health check services
→ open browser → click critical flows → inspect console/network
→ correlate logs → report what passed, failed, and remains risky
```

The skill prefers [`agent-browser`](https://www.npmjs.com/package/agent-browser) for browser interaction and tells the agent to load the live CLI guide first:

```bash
agent-browser skills get core
```

Playwright is still a good fallback when the user asks to create durable E2E tests or when the project already has Playwright workflows.

## Skill handoffs

`browser-qa` is the orchestrator. It should hand off when the task becomes specialized:

| Need | Better follow-up skill |
| --- | --- |
| Write durable Playwright tests | `playwright-best-practices` |
| Design an E2E test strategy | `e2e-testing-patterns` |
| Run a full a11y/responsive/performance audit | `audit` |
| Check React code health after fixes | `react-doctor` |
| Fix React rendering or bundle performance | `react-performance-optimization` |
| Fix Tailwind v4 or shadcn/ui issues | `tailwind-v4-shadcn`, `shadcn-ui` |
| Repair responsive layout | `adapt` |
| Harden edge cases, overflow, i18n, errors | `harden` |
| Polish visual details | `polish` |

## Repository layout

```text
browser-qa-skill/
├── browser-qa/
│   ├── SKILL.md
│   └── evals/
│       └── evals.json
├── README.md
├── README.zh-CN.md
├── LICENSE
└── .gitignore
```

The skill lives in `browser-qa/SKILL.md` so the directory name matches `name: browser-qa`, which keeps strict skill importers happy.

## Publish / ranking

For skill.sh-style discovery, a public GitHub repo plus installs through the skills CLI may be enough. When users run:

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa
```

the skills ecosystem may use anonymous install telemetry to discover the skill and rank it by installation count. In that model, there is no separate manual upload step: keep the repo public, make the skill installable, share the install command, and installs drive visibility.

If a registry also supports Add Skills / Import Repository, paste this repo URL as an optional extra step:

```text
https://github.com/tchivs/browser-qa-skill
```

## Contributing

Issues and PRs are welcome. Good improvements include:

- better browser QA heuristics
- more realistic eval prompts
- clearer report templates
- additional project profile fields that do not store secrets
- compatibility notes for more agent runtimes

## License

MIT
