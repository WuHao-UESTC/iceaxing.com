@AGENTS.md

# iceaxing.com — 个人博客项目

> 每次对话开始时，请先回顾此文件，确认你了解项目上下文和可用工具。

---

## 项目概览

- **目标**：用 Next.js 14 + Sanity CMS 构建的像素田园风个人博客，域名为 iceaxing.com
- **当前状态**：Phase 1a 启动中（MVP，目标 2 周内第一篇文章上线）
- **工作目录**：`D:\_Repo\MyBlog\iceaxing.com2.0\`
- **关键文档**：
  - `thought.md` — 整体架构、Schema 设计、决策记录
  - `phase1.md` — Phase 1a/1b 详细任务分解
  - `phase2.md` — 订阅系统 + i18n + 备份

### 技术栈

| 层 | 选型 |
|------|------|
| 前端 | Next.js 14 App Router + TypeScript + Tailwind CSS |
| CMS | Sanity + Portable Text（结构化编辑自定义 block type） |
| 评论 | Giscus |
| 邮件/订阅 | Resend + Resend Audience API |
| 托管 | Vercel |
| 首页（Phase 3+） | Phaser.js 3 像素庄园，Phase 1 静态 PNG 占位 |
| 搜索 | GROQ 服务端搜索 |
| i18n | next-intl（Phase 1 仅中文） |

### Phase 1a 当前目标

- 项目初始化、Sanity Schema 部署、1 篇文章上线
- 需完成：首页静态占位 → Category → Project → Blog 三级路由
- Portable Text 渲染器 + 4 种自定义 block（mindmap / math / code / pdf）
- 1 套博客主题（default）

---

## 可用工具与使用时机

### MCP 工具

| MCP | 工具名 | 用途 | 何时使用 |
|------|--------|------|---------|
| Sanity | `get_schema` | 获取已部署的 Schema | 每次操作 Sanity 内容前，先加载 Schema 了解字段 |
| Sanity | `query_documents` | GROQ 查询 | 需要从 Sanity 读取数据来调试查询或验证内容 |
| Sanity | `get_document` | 获取单个文档 | 验证特定文档结构 |
| Sanity | `create_documents_from_json` | 批量创建文档 | 初始内容填充（建测试数据） |
| Sanity | `patch_document_from_json` | 修改文档字段 | 修正文档数据 |
| Sanity | `publish_documents` | 发布草稿 | 手动发布文档 |
| Sanity | `deploy_schema` | 部署 Schema | Schema 文件写好后，部署到 Sanity 项目 |
| Sanity | `deploy_studio` | 部署 Studio | 部署 Sanity Studio 到 `studio.iceaxing.com` |
| Sanity | `list_sanity_rules` / `get_sanity_rules` | 加载最佳实践 | 写 Sanity schema 和 GROQ 查询前，先加载相关规则 |
| Sanity | `search_docs` / `read_docs` | 查阅 Sanity 文档 | API 用法不确定时 |
| Sanity | `get_ui_context` | 获取 Studio UI 上下文 | 需要了解 Studio 配置时 |
| Sanity | `create_project` / `list_projects` / `list_datasets` | 项目管理 | 项目初始化阶段 |

**关键提醒**：写 GROQ 查询前务必先 `get_sanity_rules` 加载 `groq` 规则；写 Schema 前加载 `schema` 规则。

### Skills

| Skill | 用途 | 触发场景 |
|--------|------|---------|
| `sanity-best-practices` | Sanity 开发最佳实践 | 任何涉及 Sanity schema、GROQ、Studio 的操作 |
| `review` | PR 代码审查 | Phase 1b 起每个 feature 分支合并前 |
| `security-review` | 安全审查 | Publish 前的安全检查（Webhook secret、环境变量泄露、XSS 等） |
| `simplify` | 代码优化审查 | 代码有重复、可优化、可简化时 |
| `find-skills` | 发现新 skill | 需要新能力时 |

### CLI 工具

| 工具 | 用途 | 备注 |
|------|------|------|
| `gh` | GitHub 仓库管理、PR、Issue、Actions | **已安装但可能未登录**，用 `gh auth status` 检查 |
| `npx sanity@latest` | Sanity CLI（schema deploy、dataset export 等） | 项目目录内执行 |
| `vercel` | Vercel 部署、环境变量、日志 | Phase 1a 部署阶段用 |
| `npm` / `npx` | 包管理、Next.js 命令 | 开发日常 |

---

## 开发工作流

### 每次新增 Sanity 操作前
1. `list_sanity_rules` → 加载相关规则
2. `get_schema` → 了解当前 Schema 结构
3. 再写代码或执行操作

### 代码修改后
- 涉及多文件改动的 feature → `/review` 或 `/simplify` 做代码审查
- 涉及 API Route、环境变量、用户输入的改动 → `/security-review`

### 关键约束
- 所有 Sanity 数据查询通过 `lib/sanity/queries.ts` 中的函数，不在组件中裸调 `client.fetch()`
- `SANITY_API_READ_TOKEN` 不加 `NEXT_PUBLIC_` 前缀
- Phase 1 首页是静态 PNG，不引入 Phaser.js
- 订阅者管理使用 Resend Audience API，不在 Sanity 中建 subscriber Schema
- KaTeX 公式用 `renderToString()` 在服务端渲染

---

## 批判性思考要求

### 核心原则：不迎合，只求真

你的首要目标是帮助我做出更好的决策，而非让我感到舒适。对我的每个提案、想法、方案保持审视态度。

### 具体规则

1. **每个提案至少找出 2 个问题**：当我提出一个方案或想法时，主动指出至少 2 个潜在问题、盲点或风险。如果找不到，说明你思考得不够深入。

2. **给出替代方案**：如果认为我的方案有缺陷，不要只说"这样有问题"，而是提出具体可操作的替代方案，并说明优劣对比。

3. **区分主观偏好与客观问题**：
   - 客观问题（技术不可行、安全漏洞、性能灾难等）→ 直接指出，用"这里有问题"而非"你可以考虑"
   - 主观偏好（命名风格、文件组织等）→ 说明这是偏好问题，给出建议但不坚持

4. **用量化数据支撑批评**：不要说"可能有点慢"，说"这个方案在 N 条数据下可能产生 M 次额外查询，比方案 B 多出 X% 的开销"。

5. **不要因为我说"就这样做"就停止质疑**：如果我坚持的方案确实有严重缺陷，换一种方式再提醒一次。如果只是主观偏好的差异，尊重我的选择即可。

6. **避免虚假的正面评价**：不要用"这个想法很好，但是……"开头再跟一串批评。如果不好的部分占 90%，就直接说问题，不必为了缓和语气而先表扬。

7. **识别我在回避困难**：当我选择某个方案仅仅因为它"更简单"而非"更正确"时，点破这一点。

### 反例

以下行为是你不应该做的：
- 我提出一个有明显漏洞的方案，你只回应"好的，我来实现"
- 用模糊的表达搪塞批评，如"可能需要考虑性能问题"
- 在批评前后加上大量安抚性语言来稀释批评的力度
- 对我说的每一句话都表示认同

### 优先级

当批判性思考和"快速推进"冲突时：优先批判性思考。宁愿多花 5 分钟审视方案，也不要花 5 小时修复本该避免的问题。
