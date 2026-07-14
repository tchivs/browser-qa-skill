# browser-qa

> 给 Web 项目做真实浏览器 QA 的 Agent Skill。它先确认**怎么启动、测哪个地址、能否登录**，再开始点页面。

<p>
  <a href="https://github.com/tchivs/browser-qa-skill/stargazers"><img src="https://img.shields.io/github/stars/tchivs/browser-qa-skill?style=flat-square&logo=github&label=Stars" alt="GitHub Stars"></a>
  <a href="https://github.com/tchivs/browser-qa-skill/commits/main"><img src="https://img.shields.io/github/last-commit/tchivs/browser-qa-skill?style=flat-square&label=Last%20commit" alt="Last commit"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/tchivs/browser-qa-skill?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Profile%20Schema-v4-2563eb?style=flat-square" alt="Profile Schema v4">
  <img src="https://img.shields.io/badge/Hermes%20Agent-ready-6d28d9?style=flat-square" alt="Hermes Agent ready">
  <img src="https://img.shields.io/badge/OpenCode-ready-111827?style=flat-square" alt="OpenCode ready">
</p>

[English](./README.en.md) · [Skill 源文件](./browser-qa/SKILL.md) · [提交问题](https://github.com/tchivs/browser-qa-skill/issues)

## 它解决什么问题

普通的“帮我测一下网页”经常会变成这样：Agent 猜 `localhost:3000`，随便跑一个命令，找不到账号也继续测试，最后给出一份没有意义的报告。

`browser-qa` 不允许这么做。它要求先完成这件事：

```text
发现项目 → 确认部署方式 → 验证 URL 和服务健康
→ 解析登录来源 → 执行浏览器 QA → 保存证据和清理记录
```

如果账号不存在，它可以测试公共页面，但必须把登录、后台等范围写成 `BLOCKED`，而不是假装通过。

## 快速开始

### 安装

```bash
# 全局安装
npx skills add tchivs/browser-qa-skill --skill browser-qa -g

# 安装到当前项目
npx skills add tchivs/browser-qa-skill --skill browser-qa
```

Hermes Agent 的手动安装目录：

```text
~/.hermes/skills/software-development/browser-qa/
```

Windows 示例：

```text
C:\Users\<用户名>\AppData\Local\hermes\skills\software-development\browser-qa\
```

### 直接这样用

```text
帮我跑一次浏览器 QA。先确认项目如何启动、测试地址和账号来源，
然后检查首页、登录、主导航、Console error 和失败的 API 请求。
```

```text
Docker 显示服务已经起来，但浏览器页面是空白。
检查前端、API Base URL、CORS 和后端日志，给出证据。
```

```text
重新 QA 这个项目。优先复用已有 .browser-qa/profile.json；
如果配置已经过期，再更新它。
```

## QA 前必须确认什么

浏览器不是发现环境的工具。第一次打开页面前，至少要有以下信息：

| 项目 | 需要确认的内容 |
| --- | --- |
| 项目位置 | 仓库或应用根目录 |
| 启动方式 | `local-dev`、`docker-compose` 或已部署地址 |
| 目标地址 | 实际可访问的前端 URL，不猜端口 |
| 健康状态 | HTTP 可用且页面真实渲染，不只是容器显示 `Up` |
| 登录 | 不需要登录，或已确认账号/会话的来源 |
| 测试范围 | 哪些是公共页面、登录后页面、管理员页面 |

这些信息会保存到项目中：

```text
.browser-qa/
├── profile.json        # 非敏感项目配置
├── env.example         # 变量名和占位符
├── env.local           # 本地秘密；必须被 Git 忽略
├── flows/              # 已学到的公共流程
├── generated/          # 待 Review 的 Playwright 候选脚本
└── runs/               # 每轮 QA 的证据和报告
```

`profile.json` 只保存凭据**来源**，例如 `QA_ADMIN_PASSWORD`。密码、Token、Cookie、Authorization Header 和私钥不能写进 Profile、截图、报告或 Git。

## 一次 QA 会产出什么

每轮测试开始前会创建：

```text
.browser-qa/runs/<run-id>/manifest.json
```

它记录：

- 本轮环境、目标 URL 与 Profile 哈希
- 公共 / 登录后 / 管理员三个范围的状态
- 测试结果、截图、Console、Network、日志证据
- 是否发生重试，以及是否为 `FLAKY`
- 本轮启动和清理的资源
- 未测范围及其原因

创建和校验命令：

```bash
node browser-qa/scripts/create-run-manifest.mjs \
  --profile .browser-qa/profile.json

node browser-qa/scripts/validate-run-manifest.mjs \
  --manifest .browser-qa/runs/<run-id>/manifest.json
```

## 范围可以部分就绪

不必等所有账号都拿到才开始工作。Profile v4 用范围状态表达事实：

```json
"readiness": {
  "public": "ready",
  "authenticated": "blocked",
  "admin": "n/a"
}
```

这表示首页等公共页面可以测；登录后页面暂时不能测；项目没有后台范围。报告会保留这个边界。

## QA 如何越测越熟

每次成功的公共只读流程都可以被保存下来，但不会第一次跑通就变成 CI 脚本。

```text
candidate  第一次发现
verified   至少 2 次成功
stable     至少 3 次相同语义路径成功
generated  生成待 Review 的 Playwright 候选脚本
stale      页面或流程变化，回到探索式 QA
```

从一轮成功 QA 中学习流程：

```bash
node browser-qa/scripts/learn-flow.mjs \
  --manifest .browser-qa/runs/<run-id>/manifest.json \
  --flow .browser-qa/flows/public-nav.json \
  --id public-nav
```

连续运行成功后晋升：

```bash
node browser-qa/scripts/promote-flow.mjs \
  --flow .browser-qa/flows/public-nav.json
```

只有 `stable` 的公共只读流程才可以生成候选测试：

```bash
node browser-qa/scripts/generate-playwright.mjs \
  --flow .browser-qa/flows/public-nav.json \
  --output .browser-qa/generated/public-nav.spec.ts
```

生成的文件不会自动进入 CI。先 Review，再决定是否提交。

登录、后台、下单、发信、创建、删除、更新和上传流程不会自动学习或生成脚本。

## 安全边界

- 生产环境默认只读。
- 不会自动下单、发信、注册真实账号、修改或删除真实数据。
- 不会默认执行迁移、重置数据库、reseed 或 `docker compose down -v`。
- local、staging、production 使用不同浏览器会话，不能混用 Cookie。
- 默认最多重试一次，且仅限幂等操作。前后结果不同记为 `FLAKY`，不算普通通过。

## 常用命令

```bash
# 创建一个故意处于 blocked 状态的模板
node browser-qa/scripts/create-profile-template.mjs --mode docker-compose

# 校验项目 QA 配置
node browser-qa/scripts/validate-profile.mjs --profile .browser-qa/profile.json

# 校验一轮 QA 的 Manifest
node browser-qa/scripts/validate-run-manifest.mjs \
  --manifest .browser-qa/runs/<run-id>/manifest.json

# 跑仓库自检与回归测试
node browser-qa/scripts/doctor.mjs
node browser-qa/scripts/test-profile-validator.mjs
node browser-qa/scripts/test-run-manifest.mjs
node browser-qa/scripts/test-flow-learning.mjs
```

## 适合什么，不适合什么

适合：本地开发、Docker Compose、staging、部署后冒烟测试；登录、导航、表单、移动端、Console、失败请求和前后端联调问题。

不适合直接替代：单元测试、压测，或一开始就编写复杂的长期 E2E 套件。先让浏览器 QA 发现并验证流程，再把稳定公共流程固化为 Playwright。

## 项目结构

```text
browser-qa-skill/
├── browser-qa/
│   ├── SKILL.md
│   ├── evals/evals.json
│   └── scripts/
├── README.md           # 中文主文档
├── README.en.md        # English
└── LICENSE
```

## License

[MIT](./LICENSE)
