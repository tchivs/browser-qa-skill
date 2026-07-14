# Browser QA Skill

<p align="center">
  <strong>让 AI Agent 在开始浏览器测试前，先搞清楚：项目怎么启动、测哪个环境、账号从哪里来。</strong>
</p>

<p align="center">
  <a href="https://github.com/tchivs/browser-qa-skill/stargazers"><img src="https://img.shields.io/github/stars/tchivs/browser-qa-skill?style=flat-square&logo=github&label=Stars" alt="GitHub Stars"></a>
  <a href="https://github.com/tchivs/browser-qa-skill/commits/main"><img src="https://img.shields.io/github/last-commit/tchivs/browser-qa-skill?style=flat-square&label=Last%20commit" alt="Last commit"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/tchivs/browser-qa-skill?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Profile%20Schema-v4-2563eb?style=flat-square" alt="Profile Schema v2">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 18+">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hermes%20Agent-ready-6d28d9?style=flat-square" alt="Hermes Agent ready">
  <img src="https://img.shields.io/badge/OpenCode-ready-111827?style=flat-square" alt="OpenCode ready">
  <img src="https://img.shields.io/badge/Claude%20Code-ready-d97757?style=flat-square" alt="Claude Code ready">
  <img src="https://img.shields.io/badge/Codex-ready-10a37f?style=flat-square" alt="Codex ready">
  <a href="https://www.npmjs.com/package/agent-browser"><img src="https://img.shields.io/badge/agent--browser-supported-0f172a?style=flat-square" alt="agent-browser supported"></a>
</p>

<p align="center">
  <strong>中文</strong> · <a href="./README.en.md">English</a> · <a href="./browser-qa/SKILL.md">查看 Skill</a> · <a href="https://github.com/tchivs/browser-qa-skill/issues">反馈问题</a>
</p>

---

## 为什么需要它

很多 Agent 收到“帮我 QA 一下”后，会直接猜一个 `localhost` 端口、随便启动服务，甚至不知道账号密码就开始点页面。最终得到的往往不是 QA 结果，而是一份建立在错误环境上的报告。

`browser-qa` 是一个面向 Web 应用的浏览器 QA 总控 Skill。它把流程改成：

```text
项目发现 → 保存 QA Profile → 验证部署与健康状态
→ 解析认证来源 → 隔离浏览器会话 → 执行真实交互
→ 收集证据 → 清理本轮资源 → 输出报告
```

**核心原则：部署方式、目标 URL 和认证来源没有确认之前，不得假装已经完成 QA。**

## 主要能力

| 能力 | 说明 |
| --- | --- |
| 自动发现项目 | 从 README、运行脚本、Compose、环境变量示例、框架配置和种子数据中提取 QA 配置 |
| 持久化 QA Profile | 将非敏感环境信息保存到 `.browser-qa/profile.json`，后续优先复用 |
| Fail-closed 门禁 | TODO、缺失证据、未确认 URL、认证配置矛盾等情况不能通过校验 |
| 部署验证 | 支持本地开发、Docker Compose 和已部署环境；容器 `Up` 不等于页面可用 |
| 认证流程 | 解析环境变量、秘密文件、初始化命令或授权会话；绝不猜账号密码 |
| 安全边界 | 生产环境默认只读，不自动执行购买、删除、发信、上传、迁移或清库 |
| 浏览器 QA | 检查页面渲染、登录、导航、表单、弹窗、移动端、Console 和失败请求 |
| 证据与清理 | 记录失败截图、脱敏日志、重试结果，以及本轮启动资源的清理情况 |

## 适用场景

- 本地 dev server、Docker Compose、预览、测试、预发布或生产环境冒烟测试
- React、Vite、Next.js、Vue、Nuxt、后台管理系统及 API 驱动的 Web 应用
- 登录、管理员权限、导航、表单、列表、弹窗和响应式布局验证
- “容器都正常但页面空白”的前端、API Base URL、CORS 或后端故障定位
- 前后端修改后的浏览器回归检查

不适合直接替代：单元测试、性能压测或长期维护的 Playwright 测试套件。此类任务应在环境确认后转交专项工具。

## 安装

### Skills CLI（推荐）

全局安装：

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa -g
```

安装到当前项目：

```bash
npx skills add tchivs/browser-qa-skill --skill browser-qa
```

### Hermes Agent

将 `browser-qa/` 目录复制到 Hermes 用户 Skill 目录：

```text
~/.hermes/skills/software-development/browser-qa/
```

Windows 常见路径：

```text
C:\Users\<用户名>\AppData\Local\hermes\skills\software-development\browser-qa\
```

安装后应至少包含 `SKILL.md`、`evals/` 和 `scripts/`。

### OpenCode

全局安装目录：

```text
~/.config/opencode/skills/browser-qa/
```

项目安装目录：

```text
.opencode/skills/browser-qa/
```

## 使用示例

```text
帮我跑一次浏览器 QA。先确认项目部署方式和测试账号来源，
再检查登录、主导航、Console error 和失败的 API 请求。
```

```text
Docker 显示服务都起来了，但页面是空白。
请判断是前端路由、API Base URL、CORS 还是后端错误。
```

```text
后台桌面端正常，但移动端抽屉和弹窗有问题。
请用移动视口验证，保存证据并给出可复现步骤。
```

```text
重新 QA 这个项目。优先复用已有 .browser-qa/profile.json，
只刷新过期配置，不要重新猜环境。
```

## 强制就绪门禁

在第一次浏览器导航前，以下项目必须是 `READY` 或明确为 `N/A`：

| 门禁 | 必须具备的证据 |
| --- | --- |
| 项目根目录 | 已定位仓库或应用目录 |
| QA Profile | 已加载或实际写入并回读 `.browser-qa/profile.json` |
| 部署模式 | `local-dev`、`docker-compose` 或 `deployed`，且有项目依据 |
| 启动命令 | 来自文档或配置，不使用猜测命令 |
| 目标 URL | 已确认的前端 URL，不凭常见端口推断 |
| 健康状态 | HTTP 和真实页面渲染通过，而非仅进程/容器存活 |
| 认证 | 无需登录，或凭据/会话来源已解析 |
| 测试范围 | 公共、认证和管理员路径已明确 |

如果认证信息最终无法获取，可以继续测试**已独立验证的公共页面**，但认证范围必须标记为 `BLOCKED`，不能写成通过。

## 项目 QA Profile

默认文件：

```text
.browser-qa/
├── profile.json     # 非敏感 QA 配置，允许纳入版本控制
├── env.example      # 可选，只保存变量名和占位符
├── env.local        # 可选，本地秘密，必须被 Git 忽略
└── runs/            # 可选，每轮 QA 的脱敏报告和证据
```

Profile 可以保存：

- 部署模式、工作目录、启动/停止/健康检查命令
- 前端、后端、文档服务的 URL 和路径
- 登录路径、公共/认证/管理员冒烟路径
- 凭据的**来源引用**，例如 `QA_ADMIN_PASSWORD`
- 日志命令、viewport、发现证据和最后验证时间
- 生产安全策略、资源清理策略与每个测试范围的就绪状态

Profile **不得保存**密码、Token、Cookie、Authorization Header、私钥或其他生产秘密。

首次生成模板：

```bash
node browser-qa/scripts/create-profile-template.mjs \
  --mode docker-compose \
  --environment local
```

模板故意处于 `blocked` 状态。完成真实项目发现并替换 TODO 后再校验：

```bash
node browser-qa/scripts/validate-profile.mjs \
  --profile .browser-qa/profile.json
```

## 分区就绪与运行 Manifest

Profile v3 不再用一个总开关代表全部 QA，而是分别声明：

```json
"readiness": {
  "public": "ready",
  "authenticated": "blocked",
  "admin": "n/a"
}
```

这意味着：公共页面已经确认环境后可以测试；账号尚未解析时，认证范围必须保持 `blocked`；没有管理员路径时使用 `n/a`。不允许把未就绪范围报告为通过。

每次开始 QA 前创建运行 Manifest：

```bash
node browser-qa/scripts/create-run-manifest.mjs \
  --profile .browser-qa/profile.json
```

Manifest 固化本轮的环境、Profile 哈希、目标 URL、范围、viewport、证据、重试和清理记录。完成后校验：

```bash
node browser-qa/scripts/validate-run-manifest.mjs \
  --manifest .browser-qa/runs/<run-id>/manifest.json
```

默认最多重试一次，并且只允许重试幂等操作；提交、购买、发送、创建、删除和修改操作不自动重试。首次失败后重试成功仍须标记为 `FLAKY`。

## 让 QA 越测越聪明

每轮 QA 的 Run Manifest 不只是报告，也是可学习的证据。Skill 可以把**完成清理、公共范围、结构化步骤且通过的运行**提取为 Flow，并逐步沉淀为回归脚本：

```text
candidate（首次发现）
→ verified（至少 2 次成功）
→ stable（至少 3 次同一语义路径成功）
→ generated（生成待 Review 的 Playwright 候选脚本）
```

Flow 一旦因路由、关键 UI、接口契约或 Profile 变化而失效，应标记为 `stale` 并回到探索式 QA，而不是盲目重试旧脚本。

```bash
# 从成功 Run Manifest 学习候选流程
node browser-qa/scripts/learn-flow.mjs \
  --manifest .browser-qa/runs/<run-id>/manifest.json \
  --flow .browser-qa/flows/public-nav.json \
  --id public-nav

# 连续成功后晋升和校验
node browser-qa/scripts/promote-flow.mjs --flow .browser-qa/flows/public-nav.json
node browser-qa/scripts/validate-flow.mjs --flow .browser-qa/flows/public-nav.json

# 只允许 stable 的公共只读流程生成 Playwright 候选脚本
node browser-qa/scripts/generate-playwright.mjs \
  --flow .browser-qa/flows/public-nav.json \
  --output .browser-qa/generated/public-nav.spec.ts
```

自动学习只支持公共、只读路径，使用 `navigate`、语义化 role/name 点击、URL 与可见性断言。登录、后台、下单、创建、删除、发送和上传等流程不能自动固化或生成脚本。生成的 Playwright 文件必须人工 Review 后才可提交或进入 CI。

## 安全策略

- `production` 默认只允许只读冒烟检查。
- 未获明确授权时，不创建、修改或删除真实数据，不下单、不发信、不注册真实账号、不上传敏感文件。
- 不自动执行数据库重置、reseed、迁移、`docker compose down -v` 或停止原本已运行的共享服务。
- 不在命令行参数、报告、截图、Console、Network 或 Git Diff 中暴露凭据。
- local、staging、production 使用隔离的浏览器会话，禁止混用 Cookie。
- 重试仅适用于安全、幂等步骤；首次失败后重试成功仍应标记为潜在 `FLAKY`。

## 能发现什么问题

- 容器健康但前端页面空白
- 登录跳转失效、会话未写入或权限错误
- API Base URL 配错，出现 `/api/api/...`
- CORS、代理、前后端契约或环境变量问题
- UI 静默失败，但 Console/Network 已报错
- 移动端弹窗被视口或软键盘裁剪
- 侧边栏、抽屉和 Overlay 的层级问题
- 表格、Tab Bar 和长文本在小屏溢出
- 按钮、链接、输入框缺少可访问名称或 Label
- 后端 500 没有清晰反馈到 UI

## 辅助脚本

这些脚本不执行浏览器操作，也不会静默安装全局包。

```bash
# 创建一个默认阻塞的 Profile 模板
node browser-qa/scripts/create-profile-template.mjs --mode docker-compose

# 严格校验项目 Profile
node browser-qa/scripts/validate-profile.mjs --profile .browser-qa/profile.json

# 运行 Profile 校验器回归测试
node browser-qa/scripts/test-profile-validator.mjs

# 创建和校验单次 QA 运行 Manifest
node browser-qa/scripts/create-run-manifest.mjs --profile .browser-qa/profile.json
node browser-qa/scripts/validate-run-manifest.mjs --manifest .browser-qa/runs/<run-id>/manifest.json
node browser-qa/scripts/test-run-manifest.mjs

# 学习、晋升和验证公共 Flow
node browser-qa/scripts/validate-flow.mjs --flow .browser-qa/flows/<flow-id>.json
node browser-qa/scripts/test-flow-learning.mjs

# 发布前检查 Skill 仓库
node browser-qa/scripts/doctor.mjs
```

## 浏览器工具

Skill 优先使用 [`agent-browser`](https://www.npmjs.com/package/agent-browser)，但不会假设它已经安装，也不会在未经允许时静默全局安装。

```bash
command -v agent-browser
agent-browser skills get core
```

如果项目已经具备 Playwright 工作流，可以复用；需要生成长期维护的 E2E 测试代码时，也应优先采用 Playwright 专项方案。

## 专项 Skill 转交

| 后续需求 | 更合适的专项 Skill |
| --- | --- |
| 编写长期维护的 Playwright 测试 | `playwright-best-practices` |
| 设计 E2E 测试策略 | `e2e-testing-patterns` |
| 完整无障碍、响应式或性能审计 | `audit` |
| React 修改后的代码健康检查 | `react-doctor` |
| 响应式布局修复 | `adapt` |
| 边界情况、溢出和错误状态加固 | `harden` |
| 最终视觉优化 | `polish` |

这些是可选增强，不是运行通用 Browser QA 的前置依赖。

## 仓库结构

```text
browser-qa-skill/
├── browser-qa/
│   ├── SKILL.md
│   ├── evals/evals.json
│   └── scripts/
│       ├── create-profile-template.mjs
│       ├── validate-profile.mjs
│       ├── test-profile-validator.mjs
│       ├── create-run-manifest.mjs
│       ├── validate-run-manifest.mjs
│       ├── test-run-manifest.mjs
│       ├── learn-flow.mjs
│       ├── validate-flow.mjs
│       ├── promote-flow.mjs
│       ├── invalidate-stale-flow.mjs
│       ├── generate-playwright.mjs
│       ├── test-flow-learning.mjs
│       └── doctor.mjs
├── README.md          # 中文主文档
├── README.en.md       # English documentation
├── LICENSE
└── .gitignore
```

## 开发与验证

```bash
node browser-qa/scripts/doctor.mjs
node browser-qa/scripts/test-profile-validator.mjs
node --check browser-qa/scripts/create-profile-template.mjs
node --check browser-qa/scripts/validate-profile.mjs
```

欢迎提交 Issue 和 PR。优先考虑：更真实的 Eval、更多框架发现规则、更严格的秘密脱敏，以及可机器验证的报告契约。

## License

[MIT](./LICENSE)
