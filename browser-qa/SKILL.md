---
name: browser-qa
description: General browser QA orchestrator for web apps and local dev stacks. Use this skill whenever the user asks to verify a website or app in the browser, click through pages, test login or authenticated flows, inspect UI bugs, validate responsive/mobile behavior, check modal or drawer interactions, review accessibility issues, inspect browser console or network errors, verify Docker Compose or dev-server deployments, or run regression QA after frontend/backend changes. It is the right starting point even when the user does not name a framework, because it can discover the app profile once and then reuse it across future QA runs.
license: MIT
compatibility: opencode, claude-code, codex, cursor
metadata:
  category: browser-qa
  tools: agent-browser, docker, playwright
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(curl:*), Bash(ss:*), Bash(docker:*), Bash(docker-compose:*), Bash(npm:*), Bash(npx:*), Bash(pnpm:*), Bash(node:*), Bash(python:*), Bash(grep:*), Bash(rg:*), Bash(cat:*), Bash(ls:*), Bash(find:*), Bash(head:*), Bash(tail:*), Bash(jq:*), Bash(awk:*), Bash(sed:*), Bash(echo:*), Bash(mkdir:*), Bash(cp:*), Bash(mv:*), Bash(touch:*), Bash(printf:*), Bash(open:*), Bash(xdg-open:*), Bash(kill:*)
---

# Browser QA

Use this skill as a browser QA orchestrator, not as a framework-specific test author.

The goal is to prove that a web app is usable from the browser, not merely that the code compiles or that services are running.

## Browser automation tool

Prefer the `agent-browser` CLI for browser interaction, snapshots, network inspection, and exploratory QA.

Before running browser commands, load the installed CLI's live usage guide so command syntax matches the local version:

```bash
agent-browser skills get core
```

Use Playwright-based helpers only when the user asks for test code, when `agent-browser` is unavailable, or when a project already has a Playwright workflow that should be reused.

## Operating model

This skill works in two phases:

1. **Discovery**: infer the app profile once for the current project and cache it locally.
2. **Reuse**: on future runs, load the cached profile first and only refresh discovery if the project changed or the profile is stale.

This avoids re-reading README files and config files on every QA run.

## Project QA profile

Before expensive discovery, look for a project-local profile in this order:

1. `.browser-qa/profile.json`
2. `.opencode/browser-qa.json`
3. `.browser-qa.md`

If a profile exists and is still valid, treat it as the source of truth.

Refresh discovery only when:

- the profile is missing,
- the configured URLs are no longer reachable,
- the project fingerprint changed,
- or the user explicitly asks to rediscover the app.

### What the profile should capture

Store only non-secret facts:

- preferred run mode: local dev server or Docker Compose
- health-check commands
- frontend URLs
- backend/API URLs
- login paths
- docs paths
- public and authenticated smoke paths
- known service names for logs
- selector or locator hints when useful
- environment-variable names for credentials, never the secret values

### Example profile shape

```json
{
  "schema_version": 1,
  "project_name": "example-app",
  "preferred_mode": "docker-compose",
  "runtime": {
    "start_commands": ["docker compose up -d"],
    "health_commands": ["docker compose ps"]
  },
  "services": [
    {
      "name": "web",
      "kind": "frontend",
      "url": "http://127.0.0.1:5173",
      "login_path": "/signin"
    }
  ],
  "auth": {
    "has_login_flow": true,
    "credential_sources": {
      "username": "ADMIN_USERNAME",
      "password": "ADMIN_INITIAL_PASSWORD"
    }
  },
  "qa_paths": {
    "public": ["/", "/signin"],
    "authenticated": ["/dashboard"]
  },
  "fingerprints": {
    "README.md": "sha256:...",
    "package.json": "sha256:...",
    "docker-compose.yml": "sha256:...",
    ".env.example": "sha256:..."
  }
}
```

## Discovery workflow

When no valid profile exists, inspect the project in this order:

1. `README.md`
2. `package.json`
3. `pnpm-workspace.yaml` or workspace config
4. `docker-compose.yml` and overrides
5. `.env.example`
6. framework config files such as `vite.config.*`, `next.config.*`, `nx.json`

Use this discovery to infer the minimum viable QA map:

- how to start the app
- where the browser entry points are
- which URLs should be smoke-tested
- which login flow exists
- whether Docker Compose or local dev is the intended path

Then save the profile locally and use it for the rest of the session.

## Core QA flow

1. Run a quick health check for the expected services.
2. Open the primary user-facing routes in a real browser.
3. Wait for the app to finish rendering before inspecting the page.
4. Exercise the critical flows:
   - login or sign-in
   - navigation
   - forms and validation
   - modal/dialog/sheet behavior
   - table and list rendering
   - mobile/responsive layout
5. Watch for console errors, failed requests, or backend failures.
6. Report what passed, what failed, and what remains risky.

## Selector and interaction rules

Prefer selectors in this order:

1. accessible role and name
2. label text
3. visible text
4. stable test IDs
5. CSS selectors only as a fallback

Avoid brittle selectors when a semantic one exists.

## Waiting rules

Do not rely on fixed sleeps for normal app readiness.

Prefer:

- network idle
- URL changes
- element visibility
- enabled/disabled state changes
- explicit API response completion when relevant

Fixed waits are acceptable only when the app has a real animation or transition delay that cannot be observed another way.

## Mobile and responsive checks

Always check important flows at a narrow viewport when the app is meant for general users.

Focus on:

- sidebar or drawer behavior
- dialog clipping
- touch target size
- horizontal overflow
- text wrapping
- sticky headers and overlays
- tab bars or segmented controls that may overflow

## Accessibility smoke checks

When the app has interactive UI, quickly verify:

- buttons and links have accessible names
- inputs have labels
- dialogs can be opened and closed cleanly
- focus is visible
- keyboard-only interaction works for the main path
- headings and landmarks are not obviously broken

If the user asks for a formal accessibility audit, hand off to the `audit` skill rather than expanding this into a full audit checklist.

## Network and log triage

If the UI is silent, broken, or stuck:

1. inspect browser console errors
2. inspect failed network requests
3. inspect backend and frontend logs
4. confirm service ports and process state

Look for common issues such as:

- wrong base URLs
- missing environment variables
- auth redirects that never complete
- backend 500s hidden behind a generic UI error
- stale frontend bundles or mismatched API contracts

## Reporting format

End with a concise report that includes:

- what was tested
- what passed
- what failed
- what was fixed, if anything
- remaining risks or untested paths
- relevant URLs or commands if useful

Keep the report factual and specific. Mention the exact screen, route, or interaction that failed.

## Specialist handoff matrix

Use this skill as the orchestrator. Hand off when the task becomes more specialized:

- Need to write durable Playwright tests or a test suite -> `playwright-best-practices`
- Need generic E2E testing strategy or suite structure -> `e2e-testing-patterns`
- Need scripted local web-app automation with server lifecycle helpers -> `webapp-testing`
- Need a technical audit across a11y, performance, responsive design, theming, and anti-patterns -> `audit`
- Need React code health or regression checks after code changes -> `react-doctor`
- Need React rendering or bundle performance work -> `react-performance-optimization` or `vercel-react-best-practices`
- Need shadcn/ui or Tailwind v4 component/theming help -> `shadcn-ui` or `tailwind-v4-shadcn`
- Need responsive layout fixes -> `adapt`
- Need error message, empty state, or text clarity fixes -> `clarify`
- Need robustness around edge cases, overflow, or resilience -> `harden`
- Need final visual cleanup -> `polish`

## Good fit examples

- "Check the login flow in the browser and tell me what breaks"
- "Verify the admin UI on mobile and report layout issues"
- "Figure out why the page is blank even though Docker says the service is up"
- "Run a browser QA pass on this dev deployment"

## Out of scope

Do not turn this skill into a general code-generation or unit-test authoring skill.
If the user wants to write production E2E code or configure CI, hand off to the specialized testing skills.
