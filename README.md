# browser-qa

[![skill](https://img.shields.io/badge/skill-browser--qa-000000?style=flat&colorA=000000&colorB=000000)](./browser-qa/SKILL.md)
[![agent](https://img.shields.io/badge/agents-OpenCode%20%7C%20Claude%20Code%20%7C%20Codex-000000?style=flat&colorA=000000&colorB=000000)](./browser-qa/SKILL.md)
[![license](https://img.shields.io/badge/license-MIT-000000?style=flat&colorA=000000&colorB=000000)](./LICENSE)

Your agent says "the app works". This makes it prove it in a browser.

`browser-qa` is an agent skill for real browser QA. It checks the app like a user would: services are up, pages render, login works, navigation is clickable, modals fit on mobile, console errors are visible, failed requests are investigated, and backend logs are part of the story.

Works with local dev servers, Docker Compose stacks, deployed URLs, React/Vite/Next apps, admin dashboards, and most browser-based products.

[中文说明 ↓](#中文说明)

## Install

Install from GitHub with the skills CLI.

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

## 中文说明

你的 agent 说“应用能跑”。`browser-qa` 让它真的打开浏览器证明。

`browser-qa` 是一个真实浏览器 QA skill。它像用户一样检查应用：服务是否启动、页面是否渲染、登录是否成功、导航是否能点击、移动端弹窗是否被裁剪、console error 是否存在、失败请求是否被定位、后端日志是否能解释 UI 问题。

适用于本地 dev server、Docker Compose、部署 URL、React/Vite/Next 应用、后台管理系统和大多数浏览器产品。

## 安装

通过 skills CLI 安装。

全局安装：

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa -g
```

项目安装：

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa
```

OpenCode 手动安装时，更推荐直接发给 OpenCode 一段话，让它帮你装。

全局 OpenCode 安装 prompt：

```text
请从这个 GitHub 仓库为 OpenCode 全局安装 browser-qa skill：
https://github.com/tchivs/browser-qa-skill

使用 browser-qa/SKILL.md 作为源文件，安装到：
~/.config/opencode/skills/browser-qa/SKILL.md

如果支持，也一起复制 browser-qa/evals/。不要修改 skill 内容。
```

项目 OpenCode 安装 prompt：

```text
请从这个 GitHub 仓库为当前项目安装 browser-qa skill：
https://github.com/tchivs/browser-qa-skill

使用 browser-qa/SKILL.md 作为源文件，安装到：
.opencode/skills/browser-qa/SKILL.md

如果支持，也一起复制 browser-qa/evals/。不要修改 skill 内容。
```

Shell 兜底方式，全局：

```bash
git clone https://github.com/tchivs/browser-qa-skill.git
mkdir -p ~/.config/opencode/skills/browser-qa
cp browser-qa-skill/browser-qa/SKILL.md ~/.config/opencode/skills/browser-qa/SKILL.md
cp -R browser-qa-skill/browser-qa/evals ~/.config/opencode/skills/browser-qa/evals
```

Shell 兜底方式，项目：

```bash
git clone https://github.com/tchivs/browser-qa-skill.git /tmp/browser-qa-skill
mkdir -p .opencode/skills/browser-qa
cp /tmp/browser-qa-skill/browser-qa/SKILL.md .opencode/skills/browser-qa/SKILL.md
cp -R /tmp/browser-qa-skill/browser-qa/evals .opencode/skills/browser-qa/evals
```

## 使用示例

可以这样对 coding agent 说：

```text
帮我跑一次浏览器 QA，检查登录、导航、console error 和失败的 API 请求。
```

```text
Docker 显示服务都起来了，但页面是空白。帮我判断是前端、API base URL 还是后端问题。
```

```text
后台页面桌面端正常，但移动端抽屉和弹窗有问题。帮我用移动视口验证一下并给报告。
```

## 能发现什么问题

- 容器健康但页面空白
- 登录跳转失效、token 没写入
- API base URL 配错、出现 `/api/api/...`
- UI 静默失败，没有可见错误
- 移动端弹窗被视口或键盘裁剪
- 侧边栏、抽屉、overlay 的 z-index 问题
- 表格、tab bar 在小屏溢出
- 按钮、链接、输入框缺少可访问名称或 label
- 后端 500 没有清晰展示到 UI

## 项目 QA Profile

很多 QA 流程每次都重复发现项目结构。`browser-qa` 使用项目本地 profile 来避免重复工作。

第一次运行时，它会从这些文件推断应用：

- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `docker-compose.yml`
- `.env.example`
- `vite.config.*`, `next.config.*`, `nx.json`

然后把非敏感信息保存到：

```text
.browser-qa/profile.json
```

Profile 可以保存 URL、健康检查命令、service 名称、登录路径、冒烟测试路径、凭据对应的环境变量名。它不能保存密码、token、cookie 或生产 secrets。

后续运行会优先读取 profile。只有文件变化、URL 失效或用户明确要求重新发现时，才刷新它。

## 工作流

```text
发现项目 → 创建/复用 QA profile → 服务健康检查
→ 打开浏览器 → 点击关键路径 → 检查 console/network
→ 关联日志 → 报告通过、失败和剩余风险
```

该 skill 优先使用 [`agent-browser`](https://www.npmjs.com/package/agent-browser)。执行浏览器操作前，agent 会先读取 CLI 的实时指南：

```bash
agent-browser skills get core
```

当用户需要生成长期维护的 E2E 测试，或项目已经使用 Playwright 时，可以切换到 Playwright 流程。

## 发布 / 排行榜

对于 skill.sh 这类发现机制，公开 GitHub 仓库加上用户通过 skills CLI 安装可能就足够了：

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa
```

skills 生态可能会通过匿名安装遥测发现 skill，并按安装次数进入排行榜。在这种模式下，不一定需要手动上传：保持仓库公开、确保可安装、传播安装命令，安装量会带来曝光。

如果 registry 还支持 Add Skills / Import Repository，也可以补充提交仓库 URL：

```text
https://github.com/tchivs/browser-qa-skill
```

## License

MIT
