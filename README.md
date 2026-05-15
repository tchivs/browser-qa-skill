# browser-qa

English | [中文](#中文)

`browser-qa` is a general-purpose agent skill for browser-based QA of web apps and local dev stacks. It helps an agent verify that an application actually works in the browser by combining service health checks, real browser interactions, responsive/mobile checks, accessibility smoke checks, network inspection, and log triage.

The key design choice is a reusable **Project QA Profile**: the first run discovers the app from files such as `README.md`, `package.json`, `docker-compose.yml`, and `.env.example`; later runs reuse `.browser-qa/profile.json` instead of rediscovering everything each time.

## What this skill is for

Use this skill when you want an agent to:

- verify a local or deployed web app in the browser
- click through login, navigation, forms, tables, modals, drawers, and dashboards
- inspect console errors and failed network requests
- validate mobile/responsive behavior
- smoke-test accessibility basics such as accessible names, labels, focus, and dialogs
- investigate blank pages or stuck UI when services appear healthy
- run regression QA after frontend or backend changes

This skill is an orchestrator. If the task becomes specialized, it should hand off to focused skills such as Playwright test authoring, accessibility audit, React performance, Tailwind/shadcn UI, responsive layout repair, or final polish.

## Repository structure

```text
browser-qa-skill/
├── browser-qa/
│   ├── SKILL.md       # Required skill definition
│   └── evals/
│       └── evals.json # Seed prompts for future skill evaluation
├── README.md          # Bilingual usage and publishing notes
├── LICENSE            # MIT license
└── .gitignore
```

## Open skill repository conventions

- Keep `SKILL.md` at the repository root or inside a folder named after the skill. This repository uses `browser-qa/SKILL.md` so the folder name exactly matches `name: browser-qa`.
- Include YAML frontmatter with at least `name` and `description`.
- Keep the body focused and progressively disclosed; move large deterministic helpers to `scripts/` if needed.
- Include `README.md`, a license, and evaluation prompts when the skill has objective workflow expectations.
- Do not store credentials, tokens, cookies, or project-specific secrets.

## Installation

### OpenCode-style local install

```bash
git clone https://github.com/<owner>/browser-qa-skill.git
mkdir -p ~/.config/opencode/skills/browser-qa
cp browser-qa-skill/browser-qa/SKILL.md ~/.config/opencode/skills/browser-qa/SKILL.md
cp -R browser-qa-skill/browser-qa/evals ~/.config/opencode/skills/browser-qa/evals
```

If your agent supports installing skills directly from GitHub, use its native install command instead.

### Compatible installer examples

```bash
npx skills add https://github.com/<owner>/browser-qa-skill --skill browser-qa
npx add-skill https://github.com/<owner>/browser-qa-skill --skill browser-qa -g -a opencode
```

### Required browser tool

This skill prefers [`agent-browser`](https://www.npmjs.com/package/agent-browser) for interactive browser QA. Install and initialize it according to the CLI's current instructions, then load its live usage guide before browser actions:

```bash
agent-browser skills get core
```

Playwright can be used as a fallback or when the user asks to create durable E2E tests.

## Project QA Profile

On first run in a project, the skill should generate a local profile such as:

```text
.browser-qa/profile.json
```

The profile caches non-secret project facts:

- start commands
- service URLs
- health-check commands
- login paths
- public and authenticated smoke paths
- Docker Compose service names
- credential environment variable names, not secret values

Future QA runs should load the profile first and refresh it only when files changed, URLs are stale, or the user explicitly asks to rediscover the app.

## Example prompts

```text
Run a browser QA pass on this dev deployment. Check login, navigation, console errors, and failed API requests.
```

```text
The admin page works on desktop but the mobile drawer and modal feel broken. Verify the mobile flow and report issues.
```

```text
Docker says all services are up, but the page is blank. Find out whether it is a frontend, API, or backend problem.
```

## Publishing to GitHub

Recommended steps:

```bash
git init
git add browser-qa/SKILL.md browser-qa/evals/evals.json README.md LICENSE .gitignore
git commit -m "Add browser QA skill"
gh repo create browser-qa-skill --public --source=. --remote=origin --push
```

Use a clear repository description, for example:

> General browser QA orchestrator skill for web apps, local dev stacks, and Docker Compose deployments.

## Publishing to skill.sh / Agent Skill Hub

Current Agent Skill Hub-style publishing flows use GitHub import: publish a public repository containing one or more `SKILL.md` files, then import the repository URL from the web app or API. Importers commonly detect `SKILL.md` files in plain subdirectories such as `browser-qa/SKILL.md`.

Typical marketplace flow:

1. Push this repository to GitHub.
2. Open skill.sh / Agent Skill Hub.
3. Use the Add Skills / Import Repository dialog.
4. Paste the public GitHub repository URL.
5. Select the detected `browser-qa` skill.
6. Re-import after future GitHub commits to publish updates.

If your target registry instead requires a packaged `.skill` artifact or GitHub release, package the `browser-qa/` directory and follow that registry's current upload instructions.

## 中文

`browser-qa` 是一个通用浏览器 QA agent skill，用来验证 Web 应用和本地开发栈是否真的能在浏览器里正常使用。它会把服务健康检查、真实浏览器点击流、移动端/响应式检查、可访问性冒烟检查、网络请求检查和日志排障组合成一个完整流程。

核心设计是可复用的 **项目 QA Profile**：第一次运行时从 `README.md`、`package.json`、`docker-compose.yml`、`.env.example` 等文件推断应用入口；后续运行优先读取 `.browser-qa/profile.json`，不再每次重复完整发现。

## 适用场景

适合让 agent 完成：

- 在浏览器中验证本地或已部署 Web 应用
- 点击登录、导航、表单、表格、弹窗、抽屉和仪表盘
- 检查 console error 和失败的网络请求
- 验证移动端/响应式布局
- 冒烟检查基础可访问性，例如按钮名称、输入框 label、focus、dialog 行为
- 排查“服务都启动了但页面空白”的问题
- 在前后端改动后做回归 QA

这个 skill 是总控型工作流。如果任务变成更专门的工作，比如写 Playwright 测试、完整可访问性审计、React 性能优化、Tailwind/shadcn 修复、响应式布局修复或最终视觉 polish，应转交给对应的专项 skill。

## 仓库结构

```text
browser-qa-skill/
├── browser-qa/
│   ├── SKILL.md       # 必需的 skill 定义
│   └── evals/
│       └── evals.json # 后续评测用的初始 prompts
├── README.md          # 中英双语说明
├── LICENSE            # MIT 许可证
└── .gitignore
```

## 开源 skill 仓库规范建议

- `SKILL.md` 放在仓库根目录，或放在与 skill 同名的目录中。本仓库使用 `browser-qa/SKILL.md`，确保目录名和 `name: browser-qa` 完全一致。
- YAML frontmatter 至少包含 `name` 和 `description`。
- skill 正文应聚焦，避免过长；可复用脚本放到 `scripts/`。
- 建议包含 `README.md`、许可证和可验证场景的 eval prompts。
- 不要提交凭据、token、cookie 或项目专属 secrets。

## 安装

### OpenCode 风格本地安装

```bash
git clone https://github.com/<owner>/browser-qa-skill.git
mkdir -p ~/.config/opencode/skills/browser-qa
cp browser-qa-skill/browser-qa/SKILL.md ~/.config/opencode/skills/browser-qa/SKILL.md
cp -R browser-qa-skill/browser-qa/evals ~/.config/opencode/skills/browser-qa/evals
```

如果你的 agent 支持直接从 GitHub 安装 skill，优先使用它自己的安装命令。

### 兼容安装器示例

```bash
npx skills add https://github.com/<owner>/browser-qa-skill --skill browser-qa
npx add-skill https://github.com/<owner>/browser-qa-skill --skill browser-qa -g -a opencode
```

### 浏览器工具依赖

该 skill 优先使用 `agent-browser` CLI 做浏览器交互、snapshot、网络检查和探索式 QA。执行浏览器操作前，先读取 CLI 当前版本的实时指南：

```bash
agent-browser skills get core
```

当用户要求生成长期维护的 E2E 测试时，可以改用 Playwright 流程。

## 项目 QA Profile

第一次在某个项目中运行时，skill 应生成：

```text
.browser-qa/profile.json
```

Profile 只保存非敏感事实：

- 启动命令
- 服务 URL
- 健康检查命令
- 登录路径
- 公开和登录后的冒烟测试路径
- Docker Compose service 名称
- 凭据对应的环境变量名，而不是密码值

后续 QA 优先读取 Profile。只有文件发生变化、URL 失效或用户明确要求重新发现时，才刷新它。

## 示例 prompts

```text
帮我跑一次浏览器 QA，检查登录、导航、console error 和失败的 API 请求。
```

```text
后台页面桌面端正常，但移动端抽屉和弹窗有问题。帮我用移动视口验证一下并给报告。
```

```text
Docker 显示服务都起来了，但页面是空白。帮我判断是前端、API base URL 还是后端问题。
```

## 发布到 GitHub

推荐步骤：

```bash
git init
git add browser-qa/SKILL.md browser-qa/evals/evals.json README.md LICENSE .gitignore
git commit -m "Add browser QA skill"
gh repo create browser-qa-skill --public --source=. --remote=origin --push
```

推荐仓库描述：

> General browser QA orchestrator skill for web apps, local dev stacks, and Docker Compose deployments.

## 发布到 skill.sh / Agent Skill Hub

当前 Agent Skill Hub 类发布流程通常是 GitHub import：先发布一个包含 `SKILL.md` 的公开 GitHub 仓库，然后在网页或 API 中导入仓库 URL。导入器通常会扫描 `browser-qa/SKILL.md` 这样的普通子目录。

典型 marketplace 流程：

1. 推送这个仓库到 GitHub。
2. 打开 skill.sh / Agent Skill Hub。
3. 使用 Add Skills / Import Repository 入口。
4. 粘贴公开 GitHub 仓库 URL。
5. 选择检测到的 `browser-qa` skill。
6. 后续 GitHub 更新后，重新 import 即可发布新版本。

如果目标网站要求 `.skill` 包或 GitHub Release，则打包 `browser-qa/` 目录并按该网站当前说明上传。
