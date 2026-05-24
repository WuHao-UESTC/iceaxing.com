# iceaxing.com — Phase 1-2 开发教程

> 适用人群：你自己（手敲每一行代码，理解项目架构）
> 前置阅读：`thought.md`（架构与 Schema）、`phase1.md`（任务拆分）、`phase2.md`（互动系统）

---

## 目录

- [零、环境准备](#零环境准备)
- [一、Phase 1a：MVP（博客骨架上线）](#一phase-1amvp博客骨架上线)
  - [1.1 项目初始化](#11-项目初始化)
  - [1.2 Sanity Schema](#12-sanity-schema)
  - [1.3 核心 lib 封装](#13-核心-lib-封装)
  - [1.4 布局与导航](#14-布局与导航)
  - [1.5 首页占位](#15-首页占位)
  - [1.6 博客路由（Category → Project → Blog）](#16-博客路由category--project--blog)
  - [1.7 Portable Text 渲染器 + 自定义 Block](#17-portable-text-渲染器--自定义-block)
  - [1.8 文章主题系统](#18-文章主题系统)
  - [1.9 部署上线](#19-部署上线)
- [二、Phase 1b：功能完善](#二phase-1b功能完善)
  - [2.1 独立页面](#21-独立页面)
  - [2.2 日志页](#22-日志页)
  - [2.3 Giscus 评论](#23-giscus-评论)
  - [2.4 搜索](#24-搜索)
  - [2.5 RSS + Sitemap + SEO](#25-rss--sitemap--seo)
  - [2.6 ISR Webhook + 错误处理](#26-isr-webhook--错误处理)
  - [2.7 响应式 + 404](#27-响应式--404)
  - [2.8 环境变量校验 + 图片优化](#28-环境变量校验--图片优化)
  - [2.9 Phase 3 预留](#29-phase-3-预留)
- [三、Phase 2：互动系统](#三phase-2互动系统)
  - [3.1 订阅系统（Resend Contacts API）](#31-订阅系统resend-contacts-api)
  - [3.2 Collection UI 激活](#32-collection-ui-激活)
  - [3.3 i18n 英文版](#33-i18n-英文版)
  - [3.4 数据备份](#34-数据备份)
  - [3.5 搜索与日志完善](#35-搜索与日志完善)

---

## 零、环境准备

> 本章节完整讲解开发博客所需的所有工具和服务：它们是什么、为什么需要、如何一步步安装配置、配置完成后如何验证、以及常见问题的排障方法。

---

### 0.0 什么是"开发环境"？

在开始写代码之前，你的电脑需要安装一组工具，它们各自承担不同的角色：

| 工具 | 是什么 | 在这个项目中的作用 |
|------|--------|-------------------|
| **Node.js** | JavaScript 运行时（让 JS 在浏览器之外也能运行） | 运行 Next.js 框架、执行构建、处理服务端渲染 |
| **npm** | Node.js 的包管理器（Package Manager） | 安装和管理项目的第三方依赖（如 next-sanity, katex 等） |
| **Git** | 分布式版本控制系统 | 管理代码历史、推送到 GitHub、触发 Vercel 自动部署 |
| **VS Code** | 微软出品的代码编辑器 | 写代码、调试、集成终端 |
| **GitHub** | 基于 Git 的代码托管平台 | 存放代码仓库、运行 CI/CD Actions、Giscus 评论的后端 |
| **Sanity** | 无头 CMS（Headless Content Management System） | 存储和管理所有博客内容（文章、分类、友链等），提供可视化编辑后台 |
| **Vercel** | 前端托管平台（Next.js 的创造者） | 部署网站、自动 HTTPS、ISR 增量静态再生、Serverless Functions |
| **Resend** | 邮件发送 API 服务 | 处理订阅确认邮件、新文章通知邮件的发送 |
| **Giscus** | 基于 GitHub Discussions 的评论系统 | 为博客文章提供评论功能，数据存储在 GitHub Discussions 中 |

理解每个工具的"为什么"比记住操作步骤更重要。如果你在后续步骤中遇到问题，回到这个表格看看是哪个环节出了问题。

---

### 0.1 Node.js 与 npm 安装

#### 0.1.1 Node.js 是什么？

Node.js 是一个让 JavaScript 脱离浏览器运行的环境。Next.js 是一个 Node.js 框架——它用 Node.js 在服务器上渲染 React 页面，生成 HTML 发送给浏览器。没有 Node.js，Next.js 无法启动。

npm 随 Node.js 一起安装，它是 Node Package Manager 的缩写。当你在终端输入 `npm install next-sanity` 时，npm 会从远程仓库下载 `next-sanity` 及其所有依赖到 `node_modules/` 目录。

#### 0.1.2 版本要求

Next.js 16 要求 **Node.js 24+**。这是因为 Next.js 16 使用了 Node.js 24 引入的新 API（如更高效的 HTTP 处理、原生 TypeScript 支持的改进等）。

> **关键概念**：Node.js 版本号中的偶数位是 LTS（Long Term Support，长期支持）版本。目前 LTS 最新的是 24，它包含 V8 引擎更新、更快的 `fetch()` 实现，以及实验性的内置 TypeScript 支持。

#### 0.1.3 安装步骤

**Windows：**

1. 访问 [nodejs.org](https://nodejs.org) → 下载 LTS 版本（24.x）
2. 运行 `.msi` 安装程序 → 全部默认选项 → Next → Install
3. 安装完成后，**重新打开终端**（这是关键——不重启终端则 PATH 未更新）

**macOS：**

```bash
# 推荐用 Homebrew 管理（可方便切换版本）：
brew install node@24
# 或者从 nodejs.org 下载 .pkg 安装包
```

**Linux（Ubuntu/Debian）：**

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 0.1.4 验证安装

打开终端（Windows 用 PowerShell 或 Git Bash），依次运行：

```bash
node --version
# 应输出 v24.x.x

npm --version
# 应输出 11.x.x（Node 24 自带 npm 11）
```

#### 0.1.5 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `node: command not found` | Node.js 未安装或 PATH 未生效 | Windows 重启终端；macOS/Linux 运行 `source ~/.zshrc` 或 `source ~/.bashrc` |
| `node --version` 显示旧版本（如 v18） | 系统中安装了多个 Node.js 版本 | Windows 在"添加/删除程序"中卸载旧版；macOS 用 `brew unlink node@18` |
| npm 安装包时权限错误（EACCES） | macOS/Linux 全局安装需要 sudo | 配置 npm prefix 到用户目录，或用 nvm 管理 Node.js |
| Windows 上 `npm install` 报 `node-gyp` 错误 | 缺少 C++ 编译工具 | 管理员终端运行 `npm install --global windows-build-tools` |

> **进阶提示**：考虑用 **nvm**（Node Version Manager）管理 Node.js 版本。nvm 允许你在不同项目之间快速切换 Node.js 版本而无需重新安装。Windows 用户用 [nvm-windows](https://github.com/coreybutler/nvm-windows)，macOS/Linux 用户用 [nvm](https://github.com/nvm-sh/nvm)。

---

### 0.2 Git 安装与 GitHub 仓库创建

#### 0.2.1 Git 是什么？为什么需要？

Git 是当前最广泛使用的版本控制系统。它记录你对代码的每一次修改（称为"commit"），让你可以：
- **回溯历史**：随时回到之前的任意版本
- **分支开发**：在不影响主代码的情况下尝试新功能
- **协作**：多人同时修改代码而不会互相覆盖
- **触发自动部署**：当你 `git push` 到 GitHub 时，Vercel 会自动检测到变更并重新部署网站

GitHub 是 Git 仓库的托管服务。你可以把它想象成代码的"网盘"，但它远比网盘强大——提供 Pull Request 审查、GitHub Actions 自动化、Discussions 评论区等功能。

#### 0.2.2 安装 Git

**Windows：**
1. 访问 [git-scm.com](https://git-scm.com) → Download → 运行 `.exe`
2. 安装过程中：默认编辑器选 VS Code；PATH 选择 "Git from the command line"
3. 其他选项保持默认

**macOS：**
```bash
brew install git
# 或者：系统自带 Git，但在 Xcode 首次启动后会提示安装 Command Line Tools
```

**Linux：**
```bash
sudo apt-get install git  # Debian/Ubuntu
```

#### 0.2.3 配置 Git 身份

安装后先告诉 Git 你是谁——这些信息会嵌入到你的每次 commit 中：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
```

验证：
```bash
git config --global user.name   # 应输出你刚才设置的名字
git config --global user.email  # 应输出你刚才设置的邮箱
git --version                   # 应输出 git version 2.x.x
```

#### 0.2.4 配置 SSH 密钥（推荐）

SSH 密钥让你无需每次 push 都输入密码。它使用非对称加密：私钥在你的电脑上，公钥上传到 GitHub。GitHub 用公钥验证你的身份。

```bash
# 1. 生成密钥（一路回车即可）
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 2. 复制公钥
cat ~/.ssh/id_ed25519.pub

# 3. 将输出的内容全部复制
# 4. 打开 GitHub → Settings → SSH and GPG keys → New SSH key
# 5. 粘贴并保存
```

> `ed25519` 是目前推荐的加密算法，比 RSA 更快更安全。如果系统不支持，回退到 `ssh-keygen -t rsa -b 4096`。

验证 SSH 连接：
```bash
ssh -T git@github.com
# 应输出: Hi <用户名>! You've successfully authenticated...
```

#### 0.2.5 创建 GitHub 仓库

1. 打开 [github.com](https://github.com) → 登录 → 右上角 "+" → New repository
2. Repository name: `iceaxing.com`
3. 选择 **Public**（Giscus 需要 Public 仓库才能使用免费版）
4. **不要**勾选 "Add a README file"（我们会在本地创建后再推送）
5. **不要**勾选 ".gitignore"（Next.js 项目初始化时会自动生成）
6. **不要**勾选 "Choose a license"（可选，后续补充）
7. 点击 "Create repository"

> **为什么不要初始化 README？** 如果 GitHub 帮你创建了 README，你的仓库就有了一个初始 commit。当你尝试推送本地已有 commit 的代码时会产生不相关的历史，需要 `git pull --allow-unrelated-histories` 才能合并，增加不必要的麻烦。让远程仓库完全空白是最简单的起点。

创建后，记下仓库的两种 URL：
- **SSH**（推荐）：`git@github.com:<用户名>/iceaxing.com.git`
- **HTTPS**：`https://github.com/<用户名>/iceaxing.com.git`

本节不需要执行 `git init` — 我们会在下一章 `create-next-app` 初始化项目时再进行。

---

### 0.3 Sanity 项目创建

#### 0.3.1 Sanity 是什么？为什么选择它？

Sanity 是一个"无头 CMS"（Headless CMS）。传统 CMS（如 WordPress）同时管理内容和控制前端展示，而无头 CMS 只管理内容，通过 API 把数据交给你自己的前端来渲染。

**选型理由**（vs WordPress / Contentful / Strapi）：
- **Portable Text**：Sanity 独有的富文本格式，结构化 JSON 而非 HTML。这意味着你可以自定义 block 类型——思维导图、数学公式、代码块——而不被 HTML 标签束缚
- **GROQ**：Sanity 自研的查询语言，专为嵌套 JSON 文档设计，比 GraphQL 更简洁
- **免费 tier 慷慨**：10 万条文档、100GB 带宽，个人博客绰绰有余
- **实时预览**：Studio 编辑内容时可以实时看到前端效果（Phase 2+ 可配置）
- **MCP 可管理**：Schema 可以通过 CLI 或 MCP 部署，方便自动化

#### 0.3.2 创建 Sanity 账号

打开 [sanity.io](https://www.sanity.io) → Sign up → 选择 **Sign up with GitHub**（与你的 GitHub 账号关联，方便管理）。

#### 0.3.3 创建项目

1. 登录后访问 [sanity.io/manage](https://sanity.io/manage) → **Create new project**
2. Project name: `iceaxing-blog`（仅用于在 Sanity Dashboard 中识别，不影响代码）
3. 点击 Create project
4. 创建完成后记下 **Project ID**（形如 `fa79h3qq`，这是连接前端和 Sanity 后端的关键标识）

> **Project ID 的作用**：它是你 Sanity 项目的唯一标识符。前端代码、CLI 工具、MCP 操作都需要它来找到正确的 Sanity 项目。注意它不是密钥——可以放在 `NEXT_PUBLIC_*` 环境变量中并暴露在客户端。

#### 0.3.4 创建 Dataset

Dataset 是数据的容器。一个项目可以有多个 dataset（如 `production` 和 `development`），每个 dataset 中的内容完全隔离。

1. 在项目页面 → **Datasets** 标签 → **Create new dataset**
2. Name: `production`
3. 选择 **Private**（个人博客不需要公开 API）
4. 点击 Create

> **为什么叫 production？** Sanity 的惯例是用 `production` 作为正式环境的数据集。如果你后续需要测试环境，可以额外创建 `development` dataset，但不影响当前教程。

#### 0.3.5 创建 API Token

Token 是访问 Sanity API 的凭证，分两种权限级别：
- **Viewer**：只能读取，不能修改。用于备份导出等只读操作
- **Editor**：可以读写。用于前端渲染、Webhook 发回的查询

1. 在项目页面 → **API** 标签 → **Tokens** → **Add API token**
2. Token name: `Read Token`
3. Permission: **Editor**（因为我们需要在服务端查询草稿内容）
4. 点击 Create → **立即复制 token**（形如 `skGpqv7fPw6...`）——关闭页面后无法再次查看

> **安全提醒**：这个 token 以 `sk` 开头，是服务端密钥。它**绝对不能**放在 `NEXT_PUBLIC_*` 环境变量中——`NEXT_PUBLIC_` 前缀的值会被打包进客户端 JS bundle，任何人都能在浏览器中看到。我们将它存储在 `SANITY_API_READ_TOKEN`（无 `NEXT_PUBLIC_` 前缀）中，仅在服务端使用。

#### 0.3.6 配置 CORS Origins

CORS（Cross-Origin Resource Sharing）是浏览器的安全机制——默认情况下，`iceaxing.com` 不能从 `api.sanity.io` 请求数据，因为它们是不同的域。添加 CORS origins 告诉 Sanity 允许哪些域名访问 API。

1. 在项目页面 → **API** 标签 → **CORS origins** → **Add CORS origin**
2. Origin: `http://localhost:3000`（本地开发）
3. 勾选 **Allow credentials**（需要传递 token 认证）
4. 点击 Save

部署后追加 `https://iceaxing.com`（不需要勾选 credentials——生产环境的前端请求不携带 token，token 仅在服务端 `createClient()` 中使用）。

---

### 0.4 Vercel 账号

#### 0.4.1 Vercel 是什么？

Vercel 是 Next.js 框架的创造者，也是最适配 Next.js 的托管平台。它的核心能力：

- **零配置部署**：导入 GitHub 仓库后，自动识别 Next.js 项目，自动配置构建
- **ISR（Incremental Static Regeneration）**：你发布新文章时，只需要重新生成受影响的那一页，不必重建整个站点
- **Serverless Functions**：`app/api/` 下的 Route Handler 自动变成 Serverless 函数
- **自动 HTTPS**：不需要买证书、不需要配置 Nginx，自动签发 Let's Encrypt 证书
- **Analytics**：内置 Web Vitals 监控

Vercel 的免费 tier（Hobby）对于个人博客完全够用：100GB 带宽、6000 分钟构建时间、无限站点。

#### 0.4.2 注册

打开 [vercel.com](https://vercel.com) → Sign Up → 选择 **Continue with GitHub**。用 GitHub 登录可以让 Vercel 直接读取你的仓库列表，后续导入项目只需一键。

注册完成即可——不需要在此阶段做更多操作。具体部署步骤见 [1.9 部署上线](#19-部署上线)。

---

### 0.5 Resend 配置

#### 0.5.1 Resend 是什么？

Resend 是一个现代化的邮件 API 服务。它提供了简洁的 SDK 让你在代码中发送邮件，同时处理了邮件投递的所有细节（SPF/DKIM/DMARC 验证、退订链接生成、投递状态追踪等）。

#### 0.5.2 选择 Resend 的理由

发送邮件是一个看似简单实则棘手的任务。自己搭建邮件服务器大概率会被 Gmail/QQ 邮箱标记为垃圾邮件，因为缺少 DNS 级别的身份验证。Resend 帮你处理这些：
- 自动配置 SPF、DKIM、DMARC 记录
- 提供 React Email 组件库（用 JSX 写邮件模板）
- 管理联系人列表（Contacts API）和退订

> **Resend v6 重要变化**：v6 废弃了 Audiences（受众），改用 **Segments**（分组）+ **Topics**（主题）。当我们通过 API 添加订阅者时，联系人会被添加到指定 Segment 中。

#### 0.5.3 注册与配置

1. 打开 [resend.com](https://resend.com) → Sign Up → 用 GitHub 登录
2. 进入 Dashboard → **API Keys** → **Create API Key** → 命名 `blog` → 记下 `RESEND_API_KEY`（以 `re_` 开头）
3. 进入 **Domains** → **Add Domain** → 输入 `iceaxing.com`
4. Resend 会显示一组需要添加的 DNS 记录（TXT、MX 等）→ 去你的域名提供商（如 Cloudflare、阿里云 DNS）添加这些记录
5. 等 DNS 生效（通常 1-5 分钟），Resend 会显示 "Verified" 状态
6. 进入 **Segments** → **Create Segment** → 命名 `blog-subscribers` → 记下 **Segment ID**

> **关于 DNS 验证**：DNS 记录的传播需要时间。如果过了 10 分钟还没验证通过，先用 Resend 提供的测试模式（test mode）发送邮件——测试模式下邮件只会发送到你注册 Resend 的邮箱，不需要域名验证。这在开发阶段很有用。

---

### 0.6 Giscus 配置

#### 0.6.1 Giscus 是什么？

Giscus 是一个开源的评论系统，它用 **GitHub Discussions** 作为数据存储后端。每篇文章对应一个 GitHub Discussion，读者的评论会直接出现在对应的 Discussion 中。核心优势：

- **数据归你所有**：评论存储在 GitHub Discussions 中，不是第三方服务器
- **免费无广告**：完全开源，没有广告或付费墙
- **GitHub OAuth**：用户需要用 GitHub 账号登录才能评论（减少垃圾评论）
- **零运维**：不需要数据库、不需要管理后台

#### 0.6.2 组件选择：Giscus vs Disqus vs Utterances

| 方面 | Giscus | Disqus（备选） | Utterances（备选） |
|------|--------|---------------|-------------------|
| 后端存储 | GitHub Discussions | Disqus 服务器 | GitHub Issues |
| 是否免费 | ✅ 完全免费 | ❌ 免费版有广告 | ✅ 完全免费 |
| 登录方式 | GitHub OAuth | Disqus/Google/Twitter | GitHub OAuth |
| 搜索 | ✅ GitHub 搜索 | ✅ Disqus 内置 | ❌ 无 |
| 评论回复 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 自定义主题 | ✅ 支持 | ✅ 支持 | ✅ 支持 |

我们选择 Giscus，因为它是三者中功能最完善且完全免费的方案。

#### 0.6.3 配置步骤

**第一步：启用 GitHub Discussions**

1. 打开你的 GitHub 仓库 → **Settings** → 滚动到 **Features** 区域
2. 勾选 **Discussions** → GitHub 会在仓库中创建一个 Discussions 板块

**第二步：安装 Giscus App**

1. 访问 [github.com/apps/giscus](https://github.com/apps/giscus) → **Install**
2. 选择 **Only select repositories** → 选择 `iceaxing.com`
3. 点击 Install & Authorize

> 这个 App 的作用是让 Giscus 有权限在你的仓库中创建和读取 Discussions。它只会访问你授权的仓库。

**第三步：获取配置值**

1. 打开 [giscus.app](https://giscus.app) → 在 "仓库" 输入框中填入 `<用户名>/iceaxing.com`
2. 页面会自动加载并显示仓库信息
3. "页面 ↔️ Discussion 映射" 选择 **Discussion 标题包含页面路径名（pathname）**
   - 这意味着每篇博客文章会根据 URL 路径自动创建或查找对应的 Discussion
4. 在 "Discussion 分类" 中选择你希望评论归入的分类
5. 如果没有现成的分类 → 回到 GitHub 仓库 → Discussions → **New category** → 创建 `Comments` 分类（选择 "General" 类型）
6. 回到 giscus.app，页面会自动刷新显示分类
7. 复制以下 4 个值：
   - `data-repo`：你的仓库名（如 `iceaxing/iceaxing.com`）
   - `data-repo-id`：仓库的全局唯一 ID（形如 `MDEwOlJlcG...`）
   - `data-category`：分类名称（如 `Comments`）
   - `data-category-id`：分类的全局唯一 ID（形如 `DIC_kwDO...`）

这些值将填入 `.env.local` 中的 `NEXT_PUBLIC_GISCUS_*` 环境变量。

---

### 0.7 环境变量速查表

新建一个文本文件，把你收集到的所有凭证整理在一起：

```
# ── 在 0.3 中获取 ──
SANITY_PROJECT_ID=fa79h3qq
SANITY_API_READ_TOKEN=sk...

# ── 在 0.5 中获取 ──
RESEND_API_KEY=re_...
RESEND_SEGMENT_ID=xxxxxxxxxxxx

# ── 在 0.6 中获取 ──
GISCUS_REPO=<用户名>/iceaxing.com
GISCUS_REPO_ID=MDEwOlJlcG...
GISCUS_CATEGORY=Comments
GISCUS_CATEGORY_ID=DIC_kwDO...
```

此文件仅用于你自己备忘，不需要提交到仓库。后续创建 `.env.local` 时会用到这些值。

---

## 一、Phase 1a：MVP（博客骨架上线）

> 目标：`iceaxing.com` 可访问，一篇文章可读，所有自定义 block 渲染正常。

### 1.1 项目初始化

#### 1.1.1 创建 Next.js 项目

`create-next-app` 是 Next.js 官方的项目脚手架工具。各 flag 含义：

- `--typescript`：使用 TypeScript，生成 `.ts`/`.tsx` 文件而非 `.js`，提供静态类型检查
- `--tailwind`：集成 Tailwind CSS v4，自动生成 `postcss.config.mjs`，无需手动配置
- `--eslint`：配置 ESLint，生成 `eslint.config.mjs`，在构建时执行代码规范检查
- `--app`：使用 App Router（React Server Components + Server Actions），是 Next.js 目前的推荐路由方案，旧项目默认使用 Pages Router
- `--src-dir=false`：不使用 `src/` 目录，页面和组件直接放在项目根目录下（路由在 `app/` 中）
- `--import-alias="@/*"`：配置路径别名，`@/` 映射到项目根目录，避免 `../../../` 深层相对路径
- `--turbopack`：使用 Turbopack（Rust 编写的增量打包器），开发模式 `next dev` 下比 Webpack 快 5-10 倍，Next.js 16 已是默认打包器

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

> **Next.js 16 须知**：`params` 和 `searchParams` 现在是 `Promise` 类型，页面组件中需 `await params` 后再访问属性。本教程所有代码已适配此模式。Turbopack 是 Next.js 16 的默认打包器（`--turbopack` 显式启用）。

#### 1.1.2 安装核心依赖

各依赖的角色：

| 包名 | 作用 |
|------|------|
| `next-sanity` | Sanity 官方 Next.js 集成，封装 `createClient`、实时预览和 Visual Editing |
| `@portabletext/react` | Portable Text 渲染引擎，将结构化内容递归渲染为 React 组件树 |
| `@sanity/image-url` | Sanity 图片 URL 构建器，生成带裁剪/缩放/格式转换参数的优化图片 URL |
| `katex` | LaTeX 数学公式渲染库，服务端用 `renderToString()` 生成 HTML 字符串，无浏览器依赖 |
| `markmap-lib` | 思维导图 Markdown 解析器，将 Markdown 转为 JSON 节点树（后端运行） |
| `markmap-view` | 思维导图渲染引擎，在浏览器中将 markmap 数据渲染为交互式 SVG（仅客户端） |
| `@types/katex`（dev） | KaTeX 的 TypeScript 类型定义，仅 `devDependencies`，生产环境不安装 |

```bash
npm install next-sanity@^13 @portabletext/react@^6 @sanity/image-url@^2 katex@^0.17 markmap-lib markmap-view
npm install -D @types/katex
```

> **版本说明**（2026-05 最新）：
> - `next-sanity@^13` — Sanity 官方 Next.js 集成，需 Next.js 16 + React 19
> - `@sanity/image-url@^2` — Sanity 图片 URL 构建器
> - `@portabletext/react@^6` — Portable Text → React 组件渲染，新增 `PortableTextComponents` 类型
> - `katex@^0.17` — LaTeX 公式渲染（服务端 `renderToString`，不依赖 canvas）
> - `markmap-lib` + `markmap-view` — 思维导图（客户端组件，Markdown → 交互式 SVG）
> - `shiki` 不在此安装——代码高亮用更轻量的方案，见 1.7.3
> - `next-intl` 在 Phase 2 才安装——Phase 1 仅中文

> **注意**：Phase 2 才安装 `@react-email/components`（邮件模板）和 `resend`（SDK）。Phase 1 不需要。

#### 1.1.3 配置 `next.config.ts`

**[文件用途]** Next.js 全局配置文件，控制构建行为、图片优化策略、重定向规则和环境变量等。

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  // Turbopack 是 Next.js 16 默认打包器，无需额外配置
  // Phase 2 i18n 时将用 withNextIntl 包裹此配置
};

export default nextConfig;
```

**逐行解释：**

- `import type { NextConfig } from 'next'` — 导入 NextConfig 类型，确保配置对象的键名不会拼写错误（TypeScript 会在编辑器中报错）
- `images.remotePatterns` — 配置 Next.js `<Image>` 组件的远程图片白名单。Next.js 会自动对白名单内的外部图片进行格式转换（WebP/AVIF）和尺寸压缩，但出于安全考虑，**未声明的域名不允许使用 `<Image>` 优化**
- `hostname: 'cdn.sanity.io'` — 仅允许 Sanity CDN。原因是所有文章图片都托管在 Sanity CDN 上，不存在其他来源的外部图片。如果放开 `remotePatterns`（如允许任意域名），攻击者可以通过构造图片 URL 来探测内网服务（SSRF 攻击），Next.js 的 Image Proxy 可能成为攻击入口
- `// Turbopack 是 Next.js 16 默认打包器` — `next dev` 直接使用 Turbopack，无需额外配置
- `// Phase 2 i18n 时将用 withNextIntl 包裹此配置` — 预留 i18n 改造时的修改点

#### 1.1.4 创建环境变量文件

手动创建 `.env.local`（不要提交到 Git，Phase 1b 再加 `.env.local.example`）：

```bash
# .env.local

# ── Sanity ──
NEXT_PUBLIC_SANITY_PROJECT_ID=a1b2c3d4
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=sk...

# ── Sanity Webhook ──
SANITY_WEBHOOK_SECRET=<随机字符串>

# ── Giscus ──
NEXT_PUBLIC_GISCUS_REPO=<用户名>/<仓库名>
NEXT_PUBLIC_GISCUS_REPO_ID=MDEwOlJlcG...
NEXT_PUBLIC_GISCUS_CATEGORY=Comments
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDO...

# ── Resend (Phase 2 用，先配好) ──
RESEND_API_KEY=re_...
RESEND_SEGMENT_ID=xxxxxxxxxxxx

# ── Site ──
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

生成 `SANITY_WEBHOOK_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **关于 `.env` 文件**：Sanity Studio 使用 Vite 加载环境变量，默认读取 `.env` 而非 `.env.local`。如果你用 `npx sanity start` 本地运行 Studio，需要将 `NEXT_PUBLIC_SANITY_PROJECT_ID` 和 `NEXT_PUBLIC_SANITY_DATASET` 也复制到项目根目录的 `.env` 文件中。如果只用外部部署的 Studio（`https://<projectId>.sanity.studio`），则不需要。

#### 1.1.5 创建 `.gitignore` 补充

Next.js 已生成基础 `.gitignore`，追加：

```
# env
.env.local
.env*.local

# sanity
/sanity/.sanity/
```

#### 1.1.6 创建 `.env.local.example`（Phase 1b 做）

```bash
# .env.local.example — 模板文件（可提交到 Git）
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_WEBHOOK_SECRET=
NEXT_PUBLIC_GISCUS_REPO=
NEXT_PUBLIC_GISCUS_REPO_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=
NEXT_PUBLIC_GISCUS_CATEGORY_ID=
RESEND_API_KEY=
RESEND_SEGMENT_ID=
NEXT_PUBLIC_SITE_URL=https://iceaxing.com
```

---

### 1.2 Sanity Schema

> 本章节构建整个博客的内容模型。"Schema" 是 Sanity 对"数据表结构"的称呼——它定义了每种内容类型有哪些字段、字段是什么类型、如何验证。你创建的每个 Schema 文件最终会在 Sanity Studio 中变成一个可填写的表单。

**核心概念科普：**

| 概念 | 解释 |
|------|------|
| `document` | Sanity 中可独立存在的内容单元，有 `_id`，可以被发布（publish）。类比数据库中的一行记录 |
| `object` | 嵌入在 document 中的复合字段，没有独立的 `_id`，不能单独发布。类比 JSON 对象 |
| `reference` | 链接到另一个 document 的指针。类比外键，但在 Sanity 中是强类型的（只能指向特定类型的 document） |
| `slug` | URL 友好的唯一标识符（如 `my-first-post`）。Sanity 的 slug 类型提供自动生成和唯一性校验 |
| `validation(Rule)` | Sanity 内置的声明式校验 API，`Rule.required()` 表示字段必填 |
| `hotspot` | 图片焦点区域标记，让不同尺寸裁剪时始终保留主体 |

---

#### 1.2.1 初始化 Sanity

```bash
npx sanity@latest init --project <你的projectId> --dataset production --output-path ./sanity
```

> 这会安装 `sanity@^5`（当前最新），并创建 `./sanity/` 目录，包含 `sanity.config.ts` 和 `sanity.cli.ts`。

逐参数解读：
- `npx sanity@latest` — 使用最新版 Sanity CLI，不需要全局安装，`npx` 自动下载后执行
- `--project <你的projectId>` — 关联到 0.3 中创建的 Sanity 项目
- `--dataset production` — 使用 production 数据集
- `--output-path ./sanity` — 将 Sanity Studio 配置文件生成到 `./sanity/` 目录（与 Next.js app 目录分离）

---

[文件用途] `sanity/sanity.config.ts` 是 Sanity Studio 的**主配置文件**——相当于 Next.js 的 `next.config.ts`。它声明了插件、Schema 类型、以及 Studio 如何连接到你的 Sanity 项目。

[架构背景] 我们用 `structureTool()`（原名 `deskTool`，sanity v5 重命名）作为 Studio 的默认内容管理界面。`schemaTypes` 来自 `./schema/index.ts` 的统一导出，所有自定义类型汇聚于此再注册。

编辑 `sanity/sanity.config.ts`：

```ts
// sanity/sanity.config.ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schema';

export default defineConfig({
  name: 'iceaxing-blog',
  title: 'iceaxing Blog',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
```

逐行解读：
1. `import { defineConfig } from 'sanity'` — Sanity 提供的类型安全配置函数，返回带有完整 TypeScript 类型推断的配置对象
2. `import { structureTool } from 'sanity/structure'` — structureTool 是 Sanity Studio 的默认内容管理界面插件。在 sanity v5 中从 `sanity/desk` 重命名为 `sanity/structure`
3. `import { schemaTypes } from './schema'` — 从同目录下的 `schema/index.ts` 导入所有 Schema 类型的数组
4. `name: 'iceaxing-blog'` — Studio 实例名，显示在浏览器标签页标题中
5. `title: 'iceaxing Blog'` — Studio 界面的标题
6. `projectId` / `dataset` — 通过环境变量连接你的 Sanity 项目。`!` 后缀是 TypeScript 非空断言，告诉编译器这些值不会是 undefined（因为我们在 `lib/env.ts` 中做了启动时校验）
7. `plugins: [structureTool()]` — 注册 Structure Tool 插件，它提供左侧文档列表 + 右侧编辑器的经典 CMS 界面
8. `schema: { types: schemaTypes }` — 将所有自定义 Schema 注册到 Sanity，Studio 才能识别和渲染这些类型

---

[文件用途] `sanity/schema/index.ts` 是所有 Schema 类型的**汇总导出文件**。每个 Schema 文件是独立的模块（便于维护），这个文件把它们收集成一个数组统一导出给 `sanity.config.ts`。

创建 `sanity/schema/index.ts`（导出所有 schema type）：

```ts
// sanity/schema/index.ts
import category from './category';
import project from './project';
import collection from './collection';
import blog from './blog';
import log from './log';
import profile from './profile';
import friend from './friend';
import mindmap from './custom-blocks/mindmap';
import mathBlock from './custom-blocks/math-block';
import codeBlock from './custom-blocks/code-block';
import pdfEmbed from './custom-blocks/pdf-embed';

export const schemaTypes = [
  category,
  project,
  collection,
  blog,
  log,
  profile,
  friend,
  mindmap,
  mathBlock,
  codeBlock,
  pdfEmbed,
];
```

逐行解读：
1. 前 7 个 import — document 类型：category（分类）、project（项目）、collection（合集）、blog（博客）、log（日志）、profile（个人简介）、friend（友链）
2. 后 4 个 import — object 类型：mindmap、mathBlock、codeBlock、pdfEmbed。它们不是独立的 document，而是作为 blog 的 `body` 数组中的可选 block type
3. `export const schemaTypes = [...]` — 将 11 个类型整合到一个数组中，`sanity.config.ts` 中的 `schema.types` 直接引用此数组
4. **注册顺序**：数组中的顺序决定它们在 Studio 中 Create new 菜单的排列顺序。一般把最常用的 document 类型放前面

#### 1.2.2 Category Schema

[文件用途] `sanity/schema/category.ts` 定义了博客的最顶层分类（如"技术随笔"、"生活记录"）。Category 是三级路由 `/category/project/blog` 的第一级。

[架构背景] Category 使用 `document` 类型（可独立发布），包含 `slug`（用于 URL）、`order`（控制导航栏显示顺序）、和可选的 `icon`（展示在分类卡片上）。`orderings` 配置告诉 Studio 默认按排序值升序排列。

```ts
// sanity/schema/category.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'category',
  title: '分类',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL 标识',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '描述',
      type: 'text',
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'icon',
      title: '图标',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  orderings: [
    { title: '排序', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
});
```

逐行解读：
1. `import { defineField, defineType } from 'sanity'` — Sanity v5 的 Schema 辅助函数。`defineType` 定义整个文档类型（带完整 TypeScript 类型推断），`defineField` 定义每个字段（同样带类型推断）
2. `name: 'category'` — 文档类型的内部名称，GROQ 查询中 `_type == "category"` 使用此值
3. `title: '分类'` — Studio 中显示的中文名
4. `type: 'document'` — 标记为 document 类型（可独立存在的文档，有 `_id`，可发布）
5. `type: 'slug'` — Sanity 内置的 slug 类型（非普通 string）。`source: 'title'` 表示从标题自动生成 slug；`maxLength: 96` 限制长度，防止 URL 过长
6. `type: 'text'` — 多行文本（vs `string` 是单行输入）
7. `initialValue: 0` — 新建文档时的默认值，后面创建的分类排在前面除非手动调整
8. `options: { hotspot: true }` — 启用图片焦点选择器，允许在 Studio 中手动标记图片的视觉焦点，不同尺寸裁剪时始终保留主体
9. `orderings: [...]` — 定义 Studio 文档列表的默认排序方式。此处按 `order` 字段升序，让值小的 Category 先显示

[关联说明] Category 被 `project.ts` 通过 `reference` 字段引用，被 `getAllCategories()` / `getCategoryBySlug()` 查询。Category 页面对应路由 `app/[locale]/(site)/[category]/page.tsx`。

#### 1.2.3 Project Schema

[文件用途] `sanity/schema/project.ts` 定义分类下的项目（如"Web 开发"分类下的"博客系统"项目）。Project 是三级路由的第二级 `/category/project/blog`。

[架构背景] Project 的核心字段是 `reference` 到 Category——这建立了层级关系。注意 `category` 字段使用了 `reference` 类型 + `to: [{ type: 'category' }]`，告诉 Sanity 它只能指向 category 文档。

```ts
// sanity/schema/project.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'project',
  title: '项目',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL 标识',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '描述',
      type: 'text',
    }),
    defineField({
      name: 'category',
      title: '所属分类',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
```

逐行解读：
1. `type: 'reference', to: [{ type: 'category' }]` — 这是关键字段。`reference` 类型在 Sanity 中创建一个指向另一个文档的指针，存储的是目标文档的 `_id`。`to` 数组限制只能指向 `category` 类型
2. 在 GROQ 查询中，`project->category->slug.current` 中的 `->` 是**引用展开运算符**——它跟随 reference 指针，把目标文档的字段展开到当前查询结果中
3. Project Schema 与 Category Schema 结构相似，但多了 `reference` 字段来建立层级关系

[关联说明] Project 被 `blog.ts` 和 `collection.ts` 引用。查询函数 `getProjectsByCategory()` 使用 `category->slug.current` 来找到特定分类下的所有项目。

---

#### 1.2.4 Collection Schema

[文件用途] `sanity/schema/collection.ts` 定义"合集"——项目下的一组文章。它实现了可选的二级分组：`/category/project/collection/blog`。

[架构背景] Collection 与 Project 的关系类似 Project 与 Category：通过 `reference` 建立从属关系。Collection 是可选的——文章可以直接属于 Project 而不属于任何 Collection。

```ts
// sanity/schema/collection.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'collection',
  title: '合集',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL 标识',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'project',
      title: '所属项目',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '描述',
      type: 'text',
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
```

逐行解读：
1. `name: 'collection'` — Collection 也是 document 类型，可独立发布和管理
2. 与 Project 结构类似，但它的 reference 指向 `project`（而非 `category`）——这形成了 Category → Project → Collection 的三级引用链
3. `order` 用于控制同一 Project 下多个 Collection 的排列顺序

[关联说明] Collection 被 `blog.ts` 中的 `collection` 字段引用。查询函数 `getCollectionsByProject()` 和 `getBlogPostsByCollection()` 使用它。

---

#### 1.2.5 Blog Schema

[文件用途] `sanity/schema/blog.ts` 是整个项目**最核心的 Schema**——定义了博客文章的完整结构，包括正文、主题、标签、所属关系和元信息。

[架构背景] Blog 的 `body` 字段是 `array` 类型，`of` 中列出了 6 种可用的 block type。第一个 `{ type: 'block' }` 是 Sanity 内置的富文本块（段落、标题、列表等），其余 5 种是我们自定义的。`preview` 配置告诉 Studio 在文档列表中显示标题 + 所属项目。

```ts
// sanity/schema/blog.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'blog',
  title: '博客',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL 标识',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'language',
      title: '语言',
      type: 'string',
      options: {
        list: [
          { title: '中文', value: 'zh' },
          { title: 'English', value: 'en' },
        ],
      },
      initialValue: 'zh',
    }),
    defineField({
      name: 'project',
      title: '所属项目',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'collection',
      title: '所属合集',
      type: 'reference',
      to: [{ type: 'collection' }],
      // 可选：同一 project 下的 collection
    }),
    defineField({
      name: 'theme',
      title: '文章主题',
      type: 'string',
      options: {
        list: [
          { title: 'Default', value: 'default' },
          { title: 'Terminal', value: 'terminal' },
          { title: 'Serif', value: 'serif' },
          { title: 'Manga', value: 'manga' },
          { title: 'Minimal', value: 'minimal' },
        ],
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'mindmap' },
        { type: 'mathBlock' },
        { type: 'codeBlock' },
        { type: 'pdfEmbed' },
        { type: 'image' },
      ],
    }),
    defineField({
      name: 'excerpt',
      title: '摘要',
      type: 'text',
      description: '用于列表页和 SEO description',
    }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'publishedAt',
      title: '发布日期',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: '更新日期',
      type: 'datetime',
    }),
  ],
  orderings: [
    { title: '发布日期', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'project.title',
    },
  },
});
```

逐行解读：
1. **`language` 字段**：定义为 `string` 类型 + `options.list`（下拉选择器）。`initialValue: 'zh'` 表示新建文章默认中文。Phase 2 中用于 i18n 的文章过滤
2. **`collection` 字段**：与 `project` 不同，它没有 `validation: Rule.required()`——文章可以不属于任何合集。collection 是可选的二级分组
3. **`theme` 字段**：从 5 种预设主题中选择。这个值最终传给 `<BlogThemeWrapper theme={post.theme}>`，决定使用哪套 CSS 变量
4. **`body` 字段**：`type: 'array'` + `of: [...]` 是 Sanity Portable Text 的核心语法。`of` 数组定义了可以在正文中插入哪些 block type：
   - `{ type: 'block' }` — Sanity 内置富文本块（h1-h6, p, ul, ol, blockquote 等），不写 `of: [{type: 'block'}]` 就无法输入普通段落
   - `{ type: 'mindmap' }` / `mathBlock` / `codeBlock` / `pdfEmbed` — 自定义 object type，每个对应一个 React 渲染组件
   - `{ type: 'image' }` — Sanity 内置图片类型
5. **`tags` 字段**：`array` of `string` + `layout: 'tags'` 产生标签式输入界面（输入后回车变成 tag chip）
6. **`publishedAt`**：`initialValue: () => new Date().toISOString()` — 使用箭头函数而非直接赋值，确保每次创建新文档时取当前时间，而不是模块加载时的一次性时间
7. **`preview`**：配置 Studio 文档列表的预览——每篇 blog 显示 `title`（作为主标题）和 `project.title`（作为副标题，自动跟随 reference 展开）

[关联说明] Blog 数据被 `lib/sanity/queries.ts` 中的 5 个查询函数使用，最终渲染在 catch-all 路由页面中。

#### 1.2.6 Log Schema

[文件用途] `sanity/schema/log.ts` 定义"日志"文档——类似简短的日记条目，展示在 `/log` 页面的贡献图网格上。

[架构背景] Log 与 Blog 的关键区别：Log 的第一个字段是 `date`（日期型），决定它在贡献图上的位置；Blog 的第一个字段是 `title` + `publishedAt`。Log 的 `category` 用 emoji 作为选项标签，映射到贡献图的不同颜色。

```ts
// sanity/schema/log.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'log',
  title: '日志',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: '日期',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL 标识',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '短摘要',
      type: 'text',
      description: '展示在农田地块 hover 提示',
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'category',
      title: '类别',
      type: 'string',
      options: {
        list: [
          { title: '🌾 内容更新', value: 'content' },
          { title: '🌽 网站维护', value: 'site' },
          { title: '🥕 其他', value: 'other' },
        ],
      },
      initialValue: 'content',
    }),
  ],
  orderings: [
    { title: '日期', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] },
  ],
});
```

逐行解读：
1. `type: 'date'` — Sanity 的日期类型，存储格式为 `YYYY-MM-DD`（不含时间）。这比 `datetime` 更适合日志场景——日志关心的是一天而非某个时刻
2. `description` 字段的 `description: '展示在农田地块 hover 提示'` — 这是给内容编辑者的提示，说明这个字段的前端用途
3. `body: array of [{ type: 'block' }]` — Log 的正文只使用标准富文本，不包含自定义 block type。这简化了日志编辑体验
4. `category` 使用 emoji 标签（🌾🌽🥕）——既在 Studio 下拉中直观可见，也在前端贡献图上映射到不同颜色。`value` 是代码中使用的值

[关联说明] Log 页面对应 `app/(pages)/log/`。`getAllLogs()` 返回所有日志按日期降序，贡献图组件用 `dateMap` 做 O(1) 查找。

---

#### 1.2.7 Friend Schema

[文件用途] `sanity/schema/friend.ts` 定义友链文档。数据在 `/friends` 页面上展示。

```ts
// sanity/schema/friend.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'friend',
  title: '友链',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名称',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: '链接',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      title: '头像',
      type: 'image',
    }),
    defineField({
      name: 'description',
      title: '简介',
      type: 'text',
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
```

逐行解读：
1. `type: 'url'` — Sanity 的 URL 类型，Studio 会自动验证输入格式，并渲染为可点击的链接
2. 字段简洁——没有 slug（友链不需要独立页面），没有复杂嵌套
3. `avatar` 使用 `image` 类型，前端通过 `urlFor(friend.avatar).width(80).height(80).format('webp')` 生成固定尺寸头像

---

#### 1.2.8 Profile Schema（单例文档）

[文件用途] `sanity/schema/profile.ts` 定义个人简介——一个**单例文档**（整个项目中应该只有一份 Profile）。

[架构背景] Profile 是单例模式——在 Studio 中只创建一次，前端用 `*[_id == "site-profile"][0]` 查询固定的 ID。`socialLinks` 是 `array` of `object`，每个对象是一个 { label, url } 对，不创建独立文档。

```ts
// sanity/schema/profile.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'profile',
  title: '个人简介',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名称',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      title: '头像',
      type: 'image',
    }),
    defineField({
      name: 'bio',
      title: '简介',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'socialLinks',
      title: '社交链接',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: '名称' },
            { name: 'url', type: 'url', title: '链接' },
          ],
        },
      ],
    }),
  ],
});
```

逐行解读：
1. `bio: array of [{ type: 'block' }]` — 简介使用 Portable Text（标准富文本），可以包含段落、链接、列表等
2. `socialLinks` 是一个**内联对象数组**——每个元素是在 Schema 中直接定义的 `object` type（没有独立文件）。`type: 'object'`（小写）表示它是嵌入在 document 中的复合字段，不是独立文档
3. 每个 socialLink 包含 `label`（显示名，如 "GitHub"）和 `url`（链接地址）两个字段
4. `type: 'url'` 让 Sanity 验证输入是合法的 URL 格式

[关联说明] `getProfile()` 用固定的 `_id == "site-profile"` 查询。创建 Profile 时需要在 Sanity Studio 中手动将 `_id` 设为 `site-profile`（或通过 API 创建）。

---

#### 1.2.9-1.2.12 自定义 Block Type

**什么是自定义 Block Type？**

Portable Text 的核心设计哲学是"结构化 JSON 而非 HTML"。标准的 `block` 类型提供了段落、标题、列表等基本元素，但要嵌入思维导图或数学公式，你需要定义自己的 block type。

每个自定义 block type 由两部分组成：
1. **Schema 定义**（在 `sanity/schema/custom-blocks/` 中）——告诉 Studio 这个 block 有哪些字段
2. **React 组件**（在 `components/blog/custom-blocks/` 中）——告诉前端如何渲染这个 block

这两部分通过 `portable-text-renderer.tsx` 中的 `components.types` 映射连接起来。

---

[文件用途] 4 个自定义 block type 的 Schema 定义。它们都使用 `type: 'object'`（而非 `document`），因为它们被嵌入在 Blog 的 `body` 数组中，没有独立的 `_id` 和发布流程。

**Schema 文件清单：**
- `sanity/schema/custom-blocks/mindmap.ts` — 思维导图：一段 Markdown 文本 + 可选标题
- `sanity/schema/custom-blocks/math-block.ts` — 数学公式：一段 LaTeX 文本
- `sanity/schema/custom-blocks/code-block.ts` — 代码块：代码文本 + 语言选择 + 可选文件名
- `sanity/schema/custom-blocks/pdf-embed.ts` — PDF 嵌入：上传 PDF 文件 + 可选标题

```ts
// sanity/schema/custom-blocks/mindmap.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'mindmap',
  title: '思维导图',
  type: 'object',
  fields: [
    defineField({
      name: 'data',
      title: 'Markdown 内容',
      type: 'text',
      description: '粘贴 Markdown 内容（markmap-lib 会将其渲染为交互式思维导图）。使用 ## / ### / - 等标准 Markdown 语法组织层级。',
    }),
    defineField({
      name: 'caption',
      title: '标题',
      type: 'string',
    }),
  ],
});
```

```ts
// sanity/schema/custom-blocks/math-block.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'mathBlock',
  title: '数学公式',
  type: 'object',
  fields: [
    defineField({
      name: 'formula',
      title: 'LaTeX 公式',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
  ],
});
```

```ts
// sanity/schema/custom-blocks/code-block.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'codeBlock',
  title: '代码块',
  type: 'object',
  fields: [
    defineField({
      name: 'language',
      title: '语言',
      type: 'string',
      options: {
        list: [
          'javascript', 'typescript', 'python', 'rust', 'go',
          'bash', 'json', 'yaml', 'html', 'css', 'sql', 'text',
        ].map((lang) => ({ title: lang, value: lang })),
      },
      initialValue: 'text',
    }),
    defineField({
      name: 'code',
      title: '代码',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'filename',
      title: '文件名',
      type: 'string',
    }),
  ],
});
```

```ts
// sanity/schema/custom-blocks/pdf-embed.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'pdfEmbed',
  title: 'PDF 嵌入',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'PDF 文件',
      type: 'file',
      options: { accept: '.pdf' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: '标题',
      type: 'string',
    }),
  ],
});
```

逐行解读（公共模式 + 各自特点）：

**公共模式：**
1. 所有自定义 block 都使用 `type: 'object'`——它们是嵌入在 document 中的复合字段，不能独立存在
2. `defineType()` 和 `defineField()` 提供完整的 TypeScript 类型推断
3. 每个 block 的 `name` 值（如 `'mindmap'`）必须与 Blog Schema 中 `body.of` 数组里的类型名完全一致，否则 Studio 不会在插入菜单中显示

**各自特点：**
1. **MindMap**: `data` 字段使用 `type: 'text'`（多行文本），存储原始 Markdown，渲染由客户端 `markmap-lib` 处理
2. **MathBlock**: 最简洁的 block，只有一个必填的 `formula` 字段
3. **CodeBlock**: `language` 字段用 `.map()` 动态生成选项列表（12 种语言）。`filename` 可选，用于显示代码所属文件
4. **PdfEmbed**: `type: 'file'` 是 Sanity 的文件上传类型。`options: { accept: '.pdf' }` 限制只能上传 PDF 文件。Sanity 将文件存储在 CDN 上，ref 格式为 `file-<id>-<ext>`

---

#### 1.2.13 部署 Schema

所有 Schema 文件写好后，用一行命令部署到 Sanity 云端：

```bash
npx sanity@latest schema deploy
```

这一步做了什么：
1. 读取 `sanity/schema/` 下的所有类型定义
2. 将它们发送到 Sanity API（通过你的 projectId 和认证）
3. Sanity Studio 重新加载，新字段出现在编辑界面中

如果 Sanity CLI 要求登录，先 `npx sanity@latest login`，浏览器会弹出 GitHub 授权页面。

部署成功后，访问 `https://<projectId>.sanity.studio` 即可看到 Studio，试试创建一条 category、一个 project、一篇 blog。

---

### 1.3 核心 lib 封装

#### 1.3.1 Sanity Client

```ts
// lib/sanity/client.ts
import { createClient } from 'next-sanity';
import { validateEnv } from '@/lib/env';

// 在 createClient 之前校验，确保 env vars 缺失时抛出明确错误
// （而非让 createClient 在内部抛出含混的报错）
validateEnv();

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false, // ISR 场景不使用 CDN，确保数据始终最新
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN, // 服务端查询
});
```

#### 1.3.2 TypeScript 类型定义

[文件用途] `lib/sanity/types.ts` 定义了所有 Sanity 文档对应的 TypeScript 类型。这些类型在查询函数和页面组件之间传递，确保端到端的类型安全。

[架构背景] 类型定义需要与 GROQ 查询返回的字段**精确一致**。关键的映射关系：
- 字段别名 `"slug": slug.current` → 类型中 `slug: string`（而非 `{ current: string }`）
- 引用展开 `project->{title}` → 类型中 `project?: { title: string }`（而非 `{ _ref: string }`）
- `?` 表示可选字段（对应 Sanity 中的非必填字段）
- 每个类型的 `_id: string` 始终存在，对应 Sanity 的文档唯一标识

```ts
// lib/sanity/types.ts
import type { PortableTextBlock } from '@portabletext/react';

// 注意：GROQ 查询使用 "slug": slug.current 别名，所以 slug 是 string 而非 { current: string }

export interface CategoryDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  order?: number;
  icon?: SanityImage;
}

export interface ProjectDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  order?: number;
}

/** 列表查询返回的精简字段（无 body） */
export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  language: 'zh' | 'en';
  theme?: 'default' | 'terminal' | 'serif' | 'manga' | 'minimal';
  excerpt?: string;
  publishedAt: string;
  tags?: string[];
}

/** 正文查询返回的完整字段（含 body + 展开的引用） */
export interface BlogFull extends BlogListItem {
  body: PortableTextBlock[];
  updatedAt?: string;
  project?: { title: string; slug: string };
  category?: { title: string; slug: string };
  collection?: { title: string; slug: string };
}

export interface LogDoc {
  _id: string;
  date: string;
  title: string;
  slug: string;
  description?: string;
  body: PortableTextBlock[];
  category: 'site' | 'content' | 'other';
}

export interface CollectionDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  postCount: number;
}

export interface FriendDoc {
  _id: string;
  name: string;
  url: string;
  avatar?: SanityImage;
  description?: string;
  order?: number;
}

export interface ProfileDoc {
  _id: string;
  name: string;
  avatar?: SanityImage;
  bio: PortableTextBlock[];
  socialLinks?: { label: string; url: string }[];
}

// Sanity Image 类型（用于 urlFor 函数入参和 Portable Text 内联图片）
export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}
```

逐行解读：

**1. 设计模式：列表与详情分离**
- `BlogListItem` 用于列表页（Project 页、Collection 页）。只包含展示列表卡片所需的字段（title、excerpt、publishedAt），**不包含 body**。这减少了数据传输量
- `BlogFull extends BlogListItem` 用于正文页。它继承了 `BlogListItem` 的所有字段，再追加 `body`、`updatedAt`、以及展开的引用（project、category、collection）
- 这种"继承式"类型设计让你不需要在列表和详情之间复制相同的字段定义

**2. `PortableTextBlock`**
- `import type { PortableTextBlock } from '@portabletext/react'` — 这是 Portable Text 的核心类型。`body: PortableTextBlock[]` 表示正文是一个 Portable Text 块数组，每个块可以是段落、标题、自定义 block type 等
- `import type` 而不是 `import` — TypeScript 的类型级导入，编译后消失，不增加 bundle 大小

**3. `slug: string`**
- GROQ 查询中使用 `"slug": slug.current` 将 `slug` 展开为字符串。类型定义中也用 `string` 而非 `{ current: string }`——类型必须与查询返回的形状匹配

**4. 联合类型做约束**
- `language: 'zh' | 'en'` — 限制只能是这两个值，避免拼写错误
- `theme?: 'default' | 'terminal' | 'serif' | 'manga' | 'minimal'` — 5 种主题的联合类型，`?` 表示可为 undefined
- `category: 'site' | 'content' | 'other'` — Log 类别的联合类型

**5. `SanityImage` 类型**
- 这个类型定义了 Sanity image 字段的完整结构，用于两个地方：
  - `urlFor(source: SanityImage)` 函数的入参
  - Portable Text 中内联图片的 `value` prop
- `hotspot` 和 `crop` 是可选的——只有用户手动设置了焦点/裁剪时才会出现

**6. 引用展开的类型映射**
- `project: { _ref: string }` → `project?: { title: string; slug: string }` — 原数据是 reference（只包含 `_ref`），但 GROQ 使用 `project->` 展开了引用，所以类型中是展开后的对象
- 同理 `category` 和 `collection` 在 GROQ 中被展开，类型中也是展开后的形状

[关联说明] 所有 `lib/sanity/queries.ts` 中函数的返回值类型都引用了此文件中的 interface。页面组件通过 import type 使用这些类型。

#### 1.3.3 GROQ 查询（最重要的文件）

[文件用途] `lib/sanity/queries.ts` 是整个项目的数据层——所有从 Sanity 获取数据的逻辑集中在这里。组件不直接调用 `client.fetch()`，而是调用此文件中的函数。这样查询逻辑可测试、可复用、变更时可统一修改。

[架构背景] 这个文件使用了 4 个关键的 GROQ 设计模式：
1. **字段片段复用**：`categoryFields`、`blogListFields` 等变量减少重复代码
2. **别名展平**：`"slug": slug.current` 将嵌套字段展平为字符串
3. **参数化查询**：`$slug` 变量由 `client.fetch(query, { slug })` 注入，防止 GROQ 注入
4. **引用展开**：`project->` 跟随 reference 指针，展开目标文档字段

**GROQ 是什么？**

GROQ（Graph-Relational Object Queries）是 Sanity 自研的查询语言。它的语法类似 JSON 路径 + 函数式编程的混合体。与 GraphQL 相比，GROQ 的主要优势在于它可以轻松处理嵌套的 JSON 文档和 reference 展开——这正是 CMS 数据的特点。

**核心语法速查：**

| 语法 | 含义 | 示例 |
|------|------|------|
| `*[_type == "blog"]` | 过滤：所有类型为 blog 的文档 | — |
| `[0]` | 取第一个结果（类似数组索引） | `*[...][0]` |
| `[0...10]` | 切片：取前 10 个结果 | — |
| `| order(field desc)` | 排序 | `| order(publishedAt desc)` |
| `"alias": field.path` | 别名：重命名或展平字段 | `"slug": slug.current` |
| `ref->` | 引用展开：跟随 reference 指针 | `project->{title}` |
| `$variable` | 参数占位符，由 params 注入 | `slug.current == $slug` |
| `&&` / `\|\|` | 逻辑与/或 | — |
| `!defined(field)` | 检查字段存在 | `!defined(collection)` |
| `match` | 文本匹配（支持通配符） | `title match $q + "*"` |
| `pt::text(body)` | 提取 Portable Text 纯文本 | 用于全文搜索 |
| `count(...)` | 计数 | `count(*[...])` |
| `references(^._id)` | 查找引用当前文档的其他文档 | collection 的 postCount |

```ts
// lib/sanity/queries.ts
import { groq } from 'next-sanity';
import { client } from './client';
import type {
  CategoryDoc,
  ProjectDoc,
  BlogListItem,
  BlogFull,
  LogDoc,
  CollectionDoc,
  FriendDoc,
  ProfileDoc,
} from './types';

// ═══ Category ═══

const categoryFields = groq`{
  _id,
  title,
  "slug": slug.current,
  description,
  order,
  icon
}`;

export async function getAllCategories(): Promise<CategoryDoc[]> {
  return client.fetch(groq`*[_type == "category"] | order(order) ${categoryFields}`);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDoc | null> {
  return client.fetch(
    groq`*[_type == "category" && slug.current == $slug][0] ${categoryFields}`,
    { slug }
  );
}

// ═══ Project ═══

const projectFields = groq`{
  _id,
  title,
  "slug": slug.current,
  description,
  order
}`;

export async function getProjectsByCategory(categorySlug: string): Promise<ProjectDoc[]> {
  return client.fetch(
    groq`*[_type == "project" && category->slug.current == $categorySlug] | order(order) ${projectFields}`,
    { categorySlug }
  );
}

export async function getProjectBySlug(slug: string): Promise<ProjectDoc | null> {
  return client.fetch(
    groq`*[_type == "project" && slug.current == $slug][0] ${projectFields}`,
    { slug }
  );
}

// ═══ Blog ═══

const blogListFields = groq`{
  _id,
  title,
  "slug": slug.current,
  language,
  theme,
  excerpt,
  publishedAt,
  tags
}`;

export async function getBlogPostsByProject(projectSlug: string): Promise<BlogListItem[]> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug && !defined(collection)]
       | order(publishedAt desc) ${blogListFields}`,
    { projectSlug }
  );
}

export async function getBlogPostsByCollection(
  projectSlug: string,
  collectionSlug: string
): Promise<BlogListItem[]> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && collection->slug.current == $collectionSlug]
       | order(publishedAt desc) ${blogListFields}`,
    { projectSlug, collectionSlug }
  );
}

const blogFullFields = groq`{
  _id,
  title,
  "slug": slug.current,
  language,
  theme,
  body,
  excerpt,
  publishedAt,
  updatedAt,
  tags,
  "project": project->{title, "slug": slug.current},
  "category": project->category->{title, "slug": slug.current},
  "collection": collection->{title, "slug": slug.current}
}`;

// Phase 1a: 无 collection 路径
export async function getBlogPost(
  projectSlug: string,
  blogSlug: string
): Promise<BlogFull | null> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && slug.current == $blogSlug][0] ${blogFullFields}`,
    { projectSlug, blogSlug }
  );
}

// Phase 1b/2: 有 collection 路径
export async function getBlogPostWithCollection(
  projectSlug: string,
  collectionSlug: string,
  blogSlug: string
): Promise<BlogFull | null> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && collection->slug.current == $collectionSlug
       && slug.current == $blogSlug][0] ${blogFullFields}`,
    { projectSlug, collectionSlug, blogSlug }
  );
}

// ═══ Log ═══

const logFields = groq`{
  _id,
  date,
  title,
  "slug": slug.current,
  description,
  body,
  category
}`;

export async function getAllLogs(): Promise<LogDoc[]> {
  return client.fetch(
    groq`*[_type == "log"] | order(date desc) ${logFields}`
  );
}

export async function getLogBySlug(slug: string): Promise<LogDoc | null> {
  return client.fetch(
    groq`*[_type == "log" && slug.current == $slug][0] ${logFields}`,
    { slug }
  );
}

// ═══ Friend ═══

export async function getFriends(): Promise<FriendDoc[]> {
  return client.fetch(groq`*[_type == "friend"] | order(order)`);
}

// ═══ Profile ═══

export async function getProfile(): Promise<ProfileDoc | null> {
  return client.fetch(groq`*[_id == "site-profile"][0]`);
}

// ═══ Search ═══

export interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  project: { title: string; slug: string };
  category: { title: string; slug: string };
}

export async function searchBlogs(query: string): Promise<SearchResult[]> {
  return client.fetch(
    groq`*[_type == "blog" && (
      title match $q + "*" ||
      excerpt match $q + "*" ||
      pt::text(body) match $q
    )] | order(publishedAt desc) [0...10] {
      _id, title, "slug": slug.current, excerpt, publishedAt,
      "project": project->{title, "slug": slug.current},
      "category": project->category->{title, "slug": slug.current}
    }`,
    { q: query }
  );
}

// ═══ Collections（Phase 2 激活） ═══

export async function getCollectionsByProject(projectSlug: string): Promise<CollectionDoc[]> {
  return client.fetch(
    groq`*[_type == "collection" && project->slug.current == $projectSlug] | order(order) {
      _id, title, "slug": slug.current, description,
      "postCount": count(*[_type == "blog" && references(^._id)])
    }`,
    { projectSlug }
  );
}
```

逐行解读（按功能区）：

**1. Import 部分**
- `import { groq } from 'next-sanity'` — `groq` 是一个**标签模板函数**（tagged template literal），它在 VS Code 中提供 GROQ 语法高亮和自动补全（需要安装 Sanity VS Code 扩展）。运行时它只是原样返回字符串——真正的查询执行由 `client.fetch()` 完成
- `import { client } from './client'` — 同目录下 1.3.1 中创建的 Sanity client 实例
- `import type { ... } from './types'` — `import type` 是 TypeScript 的类型级导入，编译后在 JS 中完全消失，不影响运行时

**2. `categoryFields` 字段片段**
- `groq\`{...}\`` — 定义了查询返回的字段集合
- `"slug": slug.current` — **GROQ 别名语法**。Sanity 中 `slug` 的类型是 `{ current: string, _type: "slug" }`（对象），但我们只需要 `current` 值。`"slug": slug.current` 将 `slug.current` 的值提取出来，重命名为 `slug`（字符串）
- `_id` 是 Sanity 文档的唯一标识符，总是需要返回，用于 React `key` 和条件判断

**3. `getAllCategories()`**
- `*[_type == "category"]` — GROQ 的过滤语法。`*` 表示所有文档，`[条件]` 是过滤器
- `| order(order)` — 按 `order` 字段升序排列（数字小的先显示）
- `${categoryFields}` — 将字段片段插入到查询中（模板字符串拼接）
- 返回 `Promise<CategoryDoc[]>` — 数组中可能为空

**4. `getCategoryBySlug()`**
- `slug.current == $slug` — `$slug` 是参数占位符。`client.fetch(query, { slug })` 将参数值注入。**重要：不要直接用字符串拼接** `"${slug}"`——那会产生 GROQ 注入风险
- `[0]` — 取过滤结果的第一个（即使只有一个匹配，GROQ 也返回数组）。如果没有匹配，返回 `null`
- 返回 `Promise<CategoryDoc | null>` — 单一结果或 null

**5. `getProjectsByCategory()`**
- `category->slug.current` — **这是 GROQ 最强大的特性之一：引用展开**。`category` 字段是一个 reference（存储目标文档的 `_id`），`->` 运算符自动跟随这个指针，把目标文档的字段展开
- 完整语义：找所有 project，其中它引用的 category 文档的 slug.current 等于参数值
- 这需要**一次查询**完成——没有 N+1 问题

**6. `getBlogPost()` vs `getBlogPostWithCollection()`**
- 两个函数的区别仅在于是否过滤 `collection->slug.current`。有 collection 的文章用第二个查询
- `!defined(collection)` — 检查 `collection` 字段不存在。这用于在 Project 页面中只列出"不属于任何合集的独立文章"

**7. `blogFullFields` 的引用链展开**
- `"project": project->{title, "slug": slug.current}` — 三层嵌套：展开 project，再在 project 内展开 slug
- `"category": project->category->{title, "slug": slug.current}` — **两层引用展开**：先展开 project，再展开 project 引用的 category
- 这种多级展开在一次查询中完成——Sanity 服务端 join 了三个文档

**8. `searchBlogs()`**
- `title match $q + "*"` — `match` 是 GROQ 的文本匹配运算符。`+ "*"` 表示前缀通配（如搜索 "next" 匹配 "Next.js 教程"）
- `||` — 逻辑或。匹配标题 OR 摘要 OR 正文
- `pt::text(body) match $q` — `pt::text()` 是 GROQ 的内置函数，将 Portable Text 的 JSON 结构提取为纯文本字符串，然后进行匹配
- `[0...10]` — 切片运算符，限制返回前 10 条结果

**9. `getCollectionsByProject()` 的 `postCount`**
- `count(*[_type == "blog" && references(^._id)])` — 子查询计数：
  - `*[_type == "blog" && references(^._id)]` 找所有引用当前 collection 的 blog
  - `references(^._id)` 中的 `^` 指向外层上下文（当前 collection 的 `_id`）
  - `count(...)` 返回匹配文档的数量
- `postCount` 显示在合集卡片上（如"5 篇文章"）

[关联说明] 此文件被所有页面组件和 API Routes 引用。它是前端与 CMS 之间的唯一数据通道。

#### 1.3.4 Sanity Image URL 工具

```ts
// lib/sanity/image.ts
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from './client';
import type { SanityImage } from './types';

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImage) {
  return builder.image(source);
}

// 使用例：
// 正文图片   → urlFor(img).width(1200).format('webp').auto('format').url()
// 卡片缩略图 → urlFor(img).width(600).format('webp').url()
// 头像       → urlFor(img).width(96).height(96).format('webp').url()
```

#### 1.3.5 环境变量校验

```ts
// lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_READ_TOKEN',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}`
    );
  }
}
```

`validateEnv()` 在两个位置被调用（双重保障）：

1. **`lib/sanity/client.ts`** — 在 `createClient()` 之前调用，确保 Sanity client 创建时 env vars 已就绪
2. **`app/layout.tsx`** — 在应用入口调用，即使不经过 Sanity client 的代码路径也能尽早暴露缺失的环境变量

```ts
// app/layout.tsx
import { validateEnv } from '@/lib/env';
validateEnv();
```

---

### 1.4 布局与导航

#### 1.4.1 根 Layout

`app/layout.tsx` 是 Next.js App Router 的**根布局**，定义了所有页面共享的 HTML 骨架（`<html>` 和 `<body>`），以及全局导航、页脚和 SEO 元数据。App Router 的路由系统会自动将 `children` 替换为当前路由对应的页面组件。根布局在整个应用生命周期中**只渲染一次**——客户端导航时不会重新挂载 `<SiteHeader>` 和 `<SiteFooter>`，只替换 `<main>` 内部的 `children`，这是 React 的 reconciliation 机制在 Next.js 中的体现。

**[文件用途]** 整个应用的 HTML 外壳，所有子页面都在此框架内渲染。

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { validateEnv } from '@/lib/env';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

validateEnv();

export const metadata: Metadata = {
  title: {
    default: 'iceaxing',
    template: '%s — iceaxing',
  },
  description: '个人博客',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-white text-zinc-900 antialiased font-sans">
        <SiteHeader />
        <main className="min-h-[calc(100vh-12rem)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

**逐行解释：**

- `import type { Metadata } from 'next'` — Next.js 提供的 Metadata 类型，用于类型安全地配置 SEO 元数据（title、description、Open Graph 等）
- `validateEnv()` — 在应用启动时校验必需的环境变量是否存在（如 `SANITY_API_READ_TOKEN`），缺失时立即抛出明确错误，避免部署后发现"白屏"才排查
- `metadata.title.default: 'iceaxing'` — 默认页面标题，用于首页等未单独设置 `title` 的页面
- `metadata.title.template: '%s — iceaxing'` — 标题模板，子页面只需写 `title: '关于'`，渲染后自动生成 `"关于 — iceaxing"`，`%s` 是占位符
- `<html lang="zh">` — 声明 HTML 文档语言为中文，辅助屏幕阅读器选择正确的语音引擎，同时帮助搜索引擎判断页面语言
- `min-h-screen` — 最小高度为视口高度，确保即使页面内容很少，`<body>` 也能撑满屏幕（避免页脚飘在中间）
- `antialiased` — Tailwind 的工具类，启用子像素抗锯齿，让文字边缘更平滑（在 macOS 的 Retina 屏幕上效果尤为明显）
- `<main className="min-h-[calc(100vh-12rem)]">` — 主内容区最小高度 = 视口高度 - 预估的 header + footer 总高度（约 12rem），内容不足时页脚仍贴在底部而非悬浮在中间

#### 1.4.2 SiteHeader（Phase 1 纯文字导航）

导航栏使用了经典的 **sticky + backdrop-blur** 模式。`sticky top-0` 让导航栏吸附在视口顶部，滚动时始终可见（不随页面滚动消失）；`bg-white/80`（80% 不透明度的白色背景）配合 `backdrop-blur` 实现"毛玻璃"效果——既能透过半透明背景感知到下方有内容滚动，又保证了导航文字始终清晰可读。这种模式源自 Apple 的 Human Interface Guidelines，在现代 Web 设计中已成为导航栏的标准范式。

**[文件用途]** 网站顶部导航栏组件（Server Component），包含品牌名、分类下拉菜单、主要页面链接和搜索入口。

```tsx
// components/layout/site-header.tsx
import Link from 'next/link';
import { getAllCategories } from '@/lib/sanity/queries';

export async function SiteHeader() {
  const categories = await getAllCategories();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="font-bold text-lg tracking-tight">
          iceaxing
        </Link>

        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          {/* 分类下拉 */}
          <div className="relative group">
            <button className="hover:text-zinc-900 transition-colors">
              分类
            </button>
            <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px] py-1">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/${cat.slug}`}
                  className="block px-4 py-2 hover:bg-zinc-50 text-sm"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/log" className="hover:text-zinc-900 transition-colors">
            日志
          </Link>
          <Link href="/about" className="hover:text-zinc-900 transition-colors">
            关于
          </Link>
          <Link href="/friends" className="hover:text-zinc-900 transition-colors">
            友链
          </Link>

          {/* 搜索按钮（Phase 1b 激活） */}
          <button
            className="hover:text-zinc-900 transition-colors"
            aria-label="搜索"
          >
            🔍
          </button>
        </nav>
      </div>
    </header>
  );
}
```

**逐行解释：**

- `getAllCategories()` — 从 Sanity 获取所有分类列表，这是服务端数据获取，在 HTML 发送到浏览器之前完成（无客户端 loading 状态）
- `sticky top-0 z-40` — 粘性定位 + 吸附视口顶部 + `z-index: 40`（确保在其他内容之上，但不覆盖 dialog/modal）
- `bg-white/80 backdrop-blur border-b` — 半透明白色背景 + CSS `backdrop-filter: blur()` 模糊效果 + 底部 1px 边框作为视觉分隔
- `max-w-4xl mx-auto` — 内容最大宽度约 896px（Tailwind 的 `max-w-4xl`）+ 水平自动居中
- `h-14` — 导航栏高度 56px（Tailwind 的 `h-14` = 3.5rem）
- `group` — Tailwind 的 group 标识符，标记此元素后，其任意深度的子元素可以通过 `group-hover:` 前缀响应此元素的鼠标悬停状态
- `opacity-0 invisible group-hover:opacity-100 group-hover:visible` — 下拉菜单默认完全透明且不可交互（`invisible` 阻止点击穿透），鼠标悬停 `.group` 元素时才完全显示
- `transition-all` — 所有可动画的 CSS 属性变化都有过渡动画（opacity、visibility 等），时长由 Tailwind 默认值控制
- `min-w-[140px]` — 下拉菜单最小宽度 140px，防止文字较短的分类导致菜单过窄

#### 1.4.3 SiteFooter

```tsx
// components/layout/site-footer.tsx
import Link from 'next/link';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-8 mt-16">
      <div className="max-w-4xl mx-auto px-4 text-center text-sm text-zinc-400">
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/profile" className="hover:text-zinc-600 transition-colors">
            个人简介
          </Link>
          <Link href="/feed.xml" className="hover:text-zinc-600 transition-colors">
            RSS
          </Link>
        </div>
        <p>&copy; {currentYear} iceaxing</p>
      </div>
    </footer>
  );
}
```

#### 1.4.4 全局样式补充

CSS 自定义属性（`var(--blog-*)`）是主题系统的核心机制。它们相当于"样式接口"——全局 CSS 中通过 `var(--xxx, fallback)` 声明默认值，每个主题通过 CSS 类选择器（如 `.theme-terminal`）覆盖这些变量，从而在同一种 HTML 结构上呈现完全不同的视觉效果。例如 `var(--blog-line-height, 1.8)` 表示：优先使用 `--blog-line-height` 变量的值，如果当前主题未定义该变量则回退到 `1.8`。这种方式避免了为每个主题复制整份 CSS 规则——只需在 `<article>` 上切换一个 CSS 类即可切换整个文章的视觉风格。

**[文件用途]** 文章正文排版样式 + CSS 变量主题系统 + 第三方库（KaTeX、highlight.js）样式入口。

Next.js 初始模板的 `globals.css` 包含 Geist 字体变量引用（`--font-geist-sans`），由于我们改用系统字体栈，需要替换默认字体定义，同时追加 blog-body 样式：

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: "Cascadia Code", "Fira Code", "JetBrains Mono", monospace;
}

/* ═══ KaTeX 公式基础样式 ═══ */
@import 'katex/dist/katex.min.css';

/* 代码高亮主题 */
@import 'highlight.js/styles/github-dark.css';

/* ── 文章正文通用排版（配合 CSS 变量实现主题切换） ── */
.blog-body {
  line-height: var(--blog-line-height, 1.8);
  font-family: var(--blog-font-body, inherit);
}

.blog-body h1, .blog-body h2, .blog-body h3 {
  font-family: var(--blog-font-heading, inherit);
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.blog-body h1 { font-size: 1.75rem; }
.blog-body h2 { font-size: 1.5rem; }
.blog-body h3 { font-size: 1.25rem; }

.blog-body p {
  line-height: var(--blog-line-height, 1.8);
  margin-bottom: 1rem;
}

.blog-body a {
  color: var(--blog-link-color, #2563eb);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blog-body blockquote {
  border-left: 3px solid var(--blog-blockquote-border, #e4e4e7);
  padding-left: 1rem;
  color: var(--blog-blockquote-color, #71717a);
  margin: 1.5rem 0;
}

.blog-body ul, .blog-body ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.blog-body li {
  margin-bottom: 0.25rem;
}

.blog-body pre {
  border-radius: 0.5rem;
  overflow-x: auto;
}

.blog-body img {
  border-radius: 0.5rem;
  max-width: 100%;
  height: auto;
}

/* Terminal 主题专用 */
.theme-terminal .blog-body h1::before { content: '# '; color: #71717a; }
.theme-terminal .blog-body h2::before { content: '## '; color: #71717a; }
.theme-terminal .blog-body h3::before { content: '### '; color: #71717a; }
.theme-terminal .blog-body code {
  background: #1a1a1a;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}
```

**逐行解释：**

- `@import 'katex/dist/katex.min.css'` — 引入 KaTeX 数学公式的基础样式（分式、积分符号、矩阵、希腊字母等约 100+ 数学符号的排版规则）
- `@import 'highlight.js/styles/github-dark.css'` — 引入 highlight.js 的 GitHub Dark 代码高亮主题（约 30 种编程语言的关键字、字符串、注释等 token 颜色规则）
- `.blog-body` — 文章正文的样式作用域容器，所有排版规则通过此类限定范围，避免影响到导航栏、页脚等非文章区域
- `var(--blog-line-height, 1.8)` — CSS 自定义属性：行高，`1.8` 是默认回退值，适合中文正文阅读（比英文的 1.5-1.6 更宽松）
- `var(--blog-font-body, inherit)` — CSS 自定义属性：正文字体族，未设置时继承 `<body>` 的字体（即 Tailwind 默认的系统字体栈）
- `var(--blog-font-heading, inherit)` — CSS 自定义属性：标题字体族，支持主题单独指定标题字体（如衬线标题 + 无衬线正文）
- `var(--blog-link-color, #2563eb)` — CSS 自定义属性：链接颜色，默认 Tailwind blue-600
- `text-underline-offset: 2px` — 下划线偏移量，让下划线与文字底部保持 2px 间距，避免下划线紧贴文字基线影响可读性
- `var(--blog-blockquote-border, #e4e4e7)` — CSS 自定义属性：引用块左边框颜色，默认 Tailwind zinc-200
- `var(--blog-blockquote-color, #71717a)` — CSS 自定义属性：引用块文字颜色，默认 Tailwind zinc-500（灰色以示区分正文）
- `overflow-x: auto` — 代码块超出容器宽度时显示横向滚动条，而非溢出破坏页面布局
- `.theme-terminal .blog-body h1::before { content: '# '; }` — Terminal 主题专用规则：用 CSS `::before` 伪元素在标题前插入 Markdown 风格的 `#` 前缀，纯 CSS 实现无需 JavaScript
- `.theme-terminal .blog-body code` — Terminal 主题的行内代码样式：深色背景模拟终端界面，内边距防止背景色紧贴文字

---

### 1.5 首页占位

[文件用途] `app/page.tsx` 是网站的首页（根路由）。Phase 1 中它渲染一个静态占位页——像素风插画 + 分类导航入口。Phase 3 会被替换为 Phaser.js 交互庄园，但文件路径和路由结构不变。

[架构背景] 首页作为服务端组件（`async function`），在服务器端调用 `getAllCategories()` 获取 Sanity 中的分类列表，生成导航链接。这样首页始终展示最新的分类结构，无需手动维护。

```tsx
// app/page.tsx
import { getAllCategories } from '@/lib/sanity/queries';
import Link from 'next/link';

export default async function HomePage() {
  const categories = await getAllCategories();

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      {/* 像素风占位插画（用一张 PNG） */}
      <img
        src="/assets/manor-under-construction.png"
        alt="庄园建设中"
        className="mx-auto mb-8 w-64 h-64"
        style={{ imageRendering: 'pixelated' }}
      />

      <h1 className="text-2xl font-bold mb-4">庄园正在建设中……</h1>
      <p className="text-zinc-500 mb-8">
        欢迎来到 iceaxing 的数字花园
      </p>

      {/* 分类入口列表 */}
      <nav className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/${cat.slug}`}
            className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
          >
            {cat.title}
          </Link>
        ))}
        <Link
          href="/log"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          日志
        </Link>
        <Link
          href="/about"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          关于
        </Link>
        <Link
          href="/friends"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          友链
        </Link>
        <Link
          href="/profile"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          个人简介
        </Link>
      </nav>
    </div>
  );
}
```

逐行解读：
1. `import { getAllCategories } from '@/lib/sanity/queries'` — 从数据层导入获取分类列表的函数，它在服务端执行 GROQ 查询
2. `export default async function HomePage()` — Next.js App Router 的页面组件，文件名 `page.tsx` 自动映射为路由。`async` 允许直接在组件内 `await` 数据
3. `const categories = await getAllCategories()` — 在服务端获取所有已发布的 Category 文档
4. `className="max-w-2xl mx-auto px-4 py-20 text-center"` — 最大宽度 672px 居中，上下留白 80px，内容居中
5. `<img style={{ imageRendering: 'pixelated' }} />` — `imageRendering: 'pixelated'` 是关键属性：让放大后的像素图保持硬边缘而非模糊，这是像素风视觉的核心
6. `{categories.map((cat) => (...))}` — 将 Sanity 返回的 Category 数组动态渲染为导航链接，每个链接用 `cat.slug` 构建 URL
7. `className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"` — 胶囊形按钮样式：圆角全圆（`rounded-full`）、悬停时浅灰背景、颜色过渡动画
8. 日志/关于/友链/个人简介 — 这些是独立页面，不与 Category 关联，所以硬编码链接而非从 Sanity 查询

> **Phase 3 替换点**：这个文件中的内容将替换为 `<ManorOrFallback />`，`app/page.tsx` 本身保留。

> **占位图**：任意 256×256 像素 PNG 放在 `public/assets/manor-under-construction.png`。现在不需要画——先用一个简单的纯色方块或从 [itch.io](https://itch.io) 找一个免费像素资产。

---

### 1.6 博客路由（Category → Project → Blog）

> 本章节实现博客的三级路由体系。

**路由架构：**
```
/                                    → 首页
/[category]                          → Category 页（项目列表）
/[category]/[project]                → Project 页（合集 + 文章列表）
/[category]/[project]/[blog]         → Blog 正文（无合集）
/[category]/[project]/[coll]/[blog]  → Blog 正文（合集内）
```

**Next.js 16 App Router 关键概念：**
- `[param]` — 动态路由段，`[category]` 匹配任意路径段
- `[...slug]` — Catch-all 路由，匹配 1-N 段，路径段通过 `slug[]` 数组访问
- `(group)` — 路由组，`(site)` 不影响 URL 但允许不同 layout
- `params: Promise<>` — Next.js 16 的新签名，`await params` 后才能访问参数

---

#### 1.6.1 Category 页

[文件用途] `app/(site)/[category]/page.tsx` 展示某分类下的项目列表。模式：查询 → 不存在则 404 → 空则空状态 → 渲染 grid。

```tsx
// app/(site)/[category]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getProjectsByCategory } from '@/lib/sanity/queries';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return { title: '未找到' };
  return { title: cat.title };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const projects = await getProjectsByCategory(category);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{cat.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{cat.title}</h1>
      {cat.description && (
        <p className="text-zinc-500 mb-8">{cat.description}</p>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p>这个分类下还没有项目</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/${category}/${project.slug}`}
              className="block p-6 border rounded-lg hover:border-zinc-400 transition-colors"
            >
              <h2 className="font-semibold text-lg mb-1">{project.title}</h2>
              {project.description && (
                <p className="text-sm text-zinc-500 line-clamp-2">
                  {project.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 1.6.2 Project 页

```tsx
// app/(site)/[category]/[project]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectBySlug, getBlogPostsByProject, getCollectionsByProject, getCategoryBySlug } from '@/lib/sanity/queries';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ category: string; project: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project } = await params;
  const proj = await getProjectBySlug(project);
  if (!proj) return { title: '未找到' };
  return { title: proj.title };
}

export default async function ProjectPage({ params }: Props) {
  const { category, project } = await params;
  const [proj, cat] = await Promise.all([
    getProjectBySlug(project),
    getCategoryBySlug(category),
  ]);
  if (!proj) notFound();

  const posts = await getBlogPostsByProject(project);
  const collections = await getCollectionsByProject(project);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href={`/${category}`} className="hover:text-zinc-600">
          {cat?.title || category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{proj.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{proj.title}</h1>
      {proj.description && (
        <p className="text-zinc-500 mb-8">{proj.description}</p>
      )}

      {/* Collection 入口（Phase 2 UI 激活前也渲染，因为路由已有） */}
      {collections.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">合集</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((col) => (
              <Link
                key={col._id}
                href={`/${category}/${project}/${col.slug}`}
                className="block p-4 border rounded-lg hover:border-zinc-400 transition-colors"
              >
                <h3 className="font-medium">{col.title}</h3>
                {col.description && (
                  <p className="text-sm text-zinc-500">{col.description}</p>
                )}
                <span className="text-xs text-zinc-400">{col.postCount} 篇文章</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 独立文章列表 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">文章</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p>这里还没有文章，敬请期待</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/${category}/${project}/${post.slug}`}
                className="block p-4 border rounded-lg hover:border-zinc-400 transition-colors"
              >
                <h3 className="font-medium mb-1">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-sm text-zinc-500 line-clamp-2">{post.excerpt}</p>
                )}
                <time className="text-xs text-zinc-400" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                </time>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

#### 1.6.3 Blog 正文页（支持 Collection 可选路径）

> **Phase 2 注意**：此文件在 Phase 2 会被整体替换，加入 Collection 列表页的检测逻辑。详见 [3.2 Collection UI 激活](#32-collection-ui-激活)。

```tsx
// app/(site)/[category]/[project]/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost, getBlogPostWithCollection } from '@/lib/sanity/queries';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { BlogThemeWrapper } from '@/components/blog/blog-theme-wrapper';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ category: string; project: string; slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, project } = await params;
  if (slug.length > 2) return { title: '未找到' };

  const post = slug.length === 1
    ? await getBlogPost(project, slug[0])
    : await getBlogPostWithCollection(project, slug[0], slug[1]);

  if (!post) return { title: '未找到' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, category, project } = await params;

  let post;
  if (slug.length === 1) {
    // 路径：/[category]/[project]/[blog]
    post = await getBlogPost(project, slug[0]);
  } else if (slug.length === 2) {
    // 路径：/[category]/[project]/[collection]/[blog]
    post = await getBlogPostWithCollection(project, slug[0], slug[1]);
  } else {
    notFound();
  }

  if (!post) notFound();

  const breadcrumbPath = slug.length === 1
    ? `/${category}/${project}`
    : `/${category}/${project}/${slug[0]}`;

  return (
    <BlogThemeWrapper theme={post.theme ?? 'default'}>
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* 面包屑 */}
        <nav className="text-sm text-zinc-400 mb-8">
          <Link href="/" className="hover:text-zinc-600">首页</Link>
          <span className="mx-2">/</span>
          <Link href={`/${category}`} className="hover:text-zinc-600">{post.category?.title || category}</Link>
          <span className="mx-2">/</span>
          <Link href={breadcrumbPath} className="hover:text-zinc-600">
            {post.project?.title || project}
          </Link>
        </nav>

        {/* 标题区 */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
            </time>
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* 正文 */}
        <div className="blog-body">
          <BlogBody content={post.body} />
        </div>

        {/* 页脚元信息 */}
        {post.updatedAt && (
          <p className="text-sm text-zinc-400 mt-12 pt-6 border-t">
            最后更新于 {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
          </p>
        )}

        {/* Giscus 评论（Phase 1b 加入） */}
        {/* <GiscusComments /> */}
      </article>
    </BlogThemeWrapper>
  );
}
```

---

### 1.7 Portable Text 渲染器 + 自定义 Block

> **本章节是将 Sanity 数据变成可视页面的关键环节。** 前面定义的 Schema（数据结构）和查询到的数据，通过本章节的渲染器转换为用户实际看到的 HTML。

**Portable Text 是什么？**

Portable Text 是 Sanity 的富文本格式。与 Markdown 或 HTML 不同，它不是字符串而是 **JSON 数组**。每个段落、标题、图片、自定义 block 都是数组中的一个对象。这种结构化表示让你可以：
- 在正文中嵌入任意自定义组件（思维导图、数学公式、代码块）
- 完全控制渲染输出的 HTML/CSS
- 在不同平台之间安全传输富文本（JSON 不会产生 XSS）

**渲染流程：**
```
Sanity body 数据（PortableTextBlock[]）
    ↓
<PortableText value={body} components={components} />
    ↓
遍历每个 block → 检查 block._type → 匹配 components.types 中的对应渲染器
    ↓
React 组件树 → 浏览器中的 HTML
```

---

#### 1.7.1 主渲染器

[文件用途] `components/blog/portable-text-renderer.tsx` 是 Portable Text 的**总调度器**。它定义了一个 `components` 映射表，告诉 `<PortableText>` 组件："当遇到 `_type === 'mindmap'` 的 block 时，用 `<MindMap>` 组件渲染；遇到 `_type === 'image'` 时，用 `<Image>` 渲染"。

[架构背景] `@portabletext/react` 是 Sanity 官方维护的 React 渲染库。它本身不渲染任何自定义类型——只处理标准 block（段落、标题、列表等）。自定义类型的渲染逻辑由你通过 `components` prop 注入。

```tsx
// components/blog/portable-text-renderer.tsx
import { Fragment } from 'react';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import katex from 'katex';
import { MindMap } from './custom-blocks/mindmap';
import { MathBlock } from './custom-blocks/math-block';
import { CodeBlock } from './custom-blocks/code-block';
import { PdfEmbed } from './custom-blocks/pdf-embed';
import { urlFor } from '@/lib/sanity/image';
import type { SanityImage } from '@/lib/sanity/types';
import Image from 'next/image';

/** Internal types matching Portable Text span / mark-def structures. */
interface SpanData {
  _type?: 'span';
  _key?: string;
  text: string;
  marks?: string[];
}

interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

/** Split a text string on $...$ delimiters, returning alternating text/math segments. */
function parseInlineMath(text: string): { type: 'text' | 'math'; content: string }[] {
  const segments: { type: 'text' | 'math'; content: string }[] = [];
  const regex = /(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'math', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/** Render a single Portable Text span, processing inline $...$ math. */
function renderSpan(
  span: SpanData,
  markDefs: MarkDef[],
  childIndex: number,
): React.ReactNode {
  const segments = parseInlineMath(span.text);

  const rendered = segments.map((seg, i) => {
    const key = `s-${childIndex}-${i}`;
    if (seg.type === 'math') {
      const html = katex.renderToString(seg.content, {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
      return (
        <span key={key} className="katex-inline" dangerouslySetInnerHTML={{ __html: html }} />
      );
    }
    return <Fragment key={key}>{seg.content}</Fragment>;
  });

  return applyMarks(span.marks ?? [], markDefs, rendered, childIndex);
}

/** Wrap content with the HTML tags corresponding to Portable Text marks. */
function applyMarks(
  markKeys: string[],
  markDefs: MarkDef[],
  children: React.ReactNode,
  spanIndex: number,
): React.ReactNode {
  let wrapped = children;

  for (const key of markKeys) {
    if (key === 'strong') {
      wrapped = <strong key={`m-${spanIndex}-${key}`}>{wrapped}</strong>;
    } else if (key === 'em') {
      wrapped = <em key={`m-${spanIndex}-${key}`}>{wrapped}</em>;
    } else if (key === 'code') {
      wrapped = <code key={`m-${spanIndex}-${key}`}>{wrapped}</code>;
    } else if (key === 'underline') {
      wrapped = <u key={`m-${spanIndex}-${key}`}>{wrapped}</u>;
    } else if (key === 'strike-through') {
      wrapped = <s key={`m-${spanIndex}-${key}`}>{wrapped}</s>;
    } else {
      const def = markDefs.find((d) => d._key === key);
      if (def?._type === 'link') {
        wrapped = (
          <a key={`m-${spanIndex}-${key}`} href={def.href ?? '#'}>
            {wrapped}
          </a>
        );
      }
    }
  }

  return wrapped;
}

const components: PortableTextComponents = {
  types: {
    mindmap: ({ value }) => (
      <MindMap data={value.data} caption={value.caption} />
    ),
    mathBlock: ({ value }) => (
      <MathBlock formula={value.formula} />
    ),
    codeBlock: ({ value }) => (
      <CodeBlock
        code={value.code}
        language={value.language}
        filename={value.filename}
      />
    ),
    pdfEmbed: ({ value }) => (
      <PdfEmbed file={value.file} caption={value.caption} />
    ),
    image: ({ value }: { value: SanityImage }) => {
      const src = urlFor(value).width(1200).format('webp').auto('format').url();
      return (
        <figure className="my-6">
          <Image
            src={src}
            alt={value.alt || ''}
            width={1200}
            height={675}
            className="rounded-lg"
          />
        </figure>
      );
    },
  },

  block: {
    normal: ({ value }) => {
      const raw = value as any;
      const spans: SpanData[] = (raw.children ?? []).filter(
        (c: SpanData) => c._type === 'span',
      );
      const defs: MarkDef[] = raw.markDefs ?? [];

      if (spans.length === 0) return <br />;

      return (
        <p>
          {spans.map((span, i) =>
            renderSpan(span, defs, i),
          )}
        </p>
      );
    },
  },
};

export function BlogBody({ content }: { content: PortableTextBlock[] }) {
  return <PortableText value={content} components={components} />;
}
```

逐行解读：

1. `import { Fragment } from 'react'` — React Fragment 用于包裹 inline math 解析后的文本片段，避免产生额外 DOM 节点

2. `import katex from 'katex'` — KaTeX 库，用于将 LaTeX 公式渲染为 HTML/CSS。通过 `renderToString()` 在服务端生成静态 HTML，不依赖运行时 JavaScript

3. `interface SpanData` / `interface MarkDef` — 本地类型定义。`@portabletext/react` 未公开导出 `PortableTextSpan` 和 `PortableTextMarkDefinition` 类型，因此在组件内自行定义最小化的接口

4. `parseInlineMath(text)` — 核心解析函数。将字符串按 `$...$` 分隔符拆分为交替的"纯文本"和"数学公式"片段：
   - 正则 `/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g` 匹配被 `$` 包裹的内容
   - `(?<!\\)` 是负向后顾断言——`\$` 不会触发匹配（允许在文本中用 `\$` 转义美元符号）
   - `[^$\n]+?` 非贪婪匹配公式内容，排除换行符（防止跨行误匹配）
   - 返回统一的 `{ type, content }` 数组，即使纯文本也包装为数组，简化下游处理

5. `renderSpan(span, markDefs, childIndex)` — 渲染单个 Portable Text span：
   - 调用 `parseInlineMath` 拆分文本
   - 对 `type === 'math'` 的片段调用 `katex.renderToString(seg.content, { displayMode: false })` 生成行内公式 HTML
   - 对 `type === 'text'` 的片段用 `<Fragment>` 包裹
   - 最后调用 `applyMarks` 为渲染结果包裹加粗/斜体/链接等标记

6. `applyMarks(markKeys, markDefs, children, spanIndex)` — 将 Portable Text 的 marks 系统转换为 HTML 标签：
   - 遍历 markKeys 数组（如 `['strong', 'em']`），从内到外包裹对应的 HTML 标签
   - 内置装饰器（strong, em, code, underline, strike-through）直接映射为 `<strong>`, `<em>`, `<code>`, `<u>`, `<s>`
   - 链接标注从 markDefs 数组中查找 `_key` 对应的定义，提取 `href` 属性渲染 `<a>` 标签
   - `href ?? '#'` 回退处理——当链接 markDef 缺少 href 字段时不会输出 `undefined`

7. `components.types` — 自定义 block type 映射表：
   - **key**（如 `'mindmap'`）必须与 Sanity Schema 中 `defineType({ name: 'mindmap' })` 的 `name` 值**完全一致**
   - **value** 是接收 `{ value }` prop 的 React 组件。`value` 是该 block 在 Sanity 中存储的全部字段

8. `components.block.normal` — 重写段落渲染逻辑。默认的 `@portabletext/react` 段落渲染不支持行内 `$...$` LaTeX，通过自定义 `normal` 渲染器拦截每个段落：
   - 从 `value.children` 中提取所有 `_type === 'span'` 的子元素
   - 从 `value.markDefs` 中提取标记定义（链接等）
   - 通过 `renderSpan` 处理每个 span，检测并渲染其中的行内数学公式
   - 空段落（无 span）渲染 `<br />` 避免段落塌陷

9. `export function BlogBody({ content }: { content: PortableTextBlock[] })` — 导出的入口组件。接收从 GROQ 查询返回的 `body` 数组，传给 `<PortableText>`

**已知限制：**

- `$...$` 仅在**段落块**（`block.normal`）中生效。标题（h1-h6）、引用（blockquote）、列表项中的行内公式无法渲染——如需支持，需同样覆盖对应的 block 渲染器
- Markdown 代码块（`` ` ``）内的 `$...$` 不会被解析为公式——`code` 类型的 span mark 在 `applyMarks` 中以 `<code>` 标签包裹，但 `parseInlineMath` 在 `renderSpan` 中先于 marks 处理执行，因此代码标记内的 LaTeX 仍会被转换为公式 HTML。如遇到此问题，需在 `parseInlineMath` 调用前检测 `code` mark 并跳过数学解析
- MindMap 中的 LaTeX 无法渲染——markmap-view 通过 SVG `<foreignObject>` 注入内容，其 CSS 隔离环境与 KaTeX 不兼容（详见 1.7.2 节末尾说明）

[关联说明] `<BlogBody>` 在 blog 正文页中被调用：`<BlogBody content={post.body} />`。CSS 样式由父元素 `.blog-body` 提供（通过 CSS 变量实现主题切换）。Profile 页（2.1.3）使用默认 `<PortableText>` 渲染器（不需要行内公式），因此不经过此渲染管线。

---

#### 1.7.2 思维导图（客户端组件）

[文件用途] `components/blog/custom-blocks/mindmap.tsx` 将 Markdown 文本渲染为交互式思维导图 SVG。

[架构背景] 思维导图使用 `markmap-lib`（Markdown → 树形结构）和 `markmap-view`（树形结构 → SVG 渲染）。这两个库都**只能在浏览器中运行**（依赖 DOM API），所以必须用 `'use client'` 声明为客户端组件。Next.js 16 中，不带 `'use client'` 的文件默认是 Server Component。

```tsx
// components/blog/custom-blocks/mindmap.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

interface Props {
  data: string; // Markdown 内容
  caption?: string;
}

export function MindMap({ data, caption }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = svgRef.current;
    // 清除之前渲染的内容（React Strict Mode 下 effect 会执行两次，不清除会叠加）
    svg.innerHTML = '';
    const transformer = new Transformer();
    // transformer.transform() 接收 Markdown 字符串，返回 { root, features }
    const { root } = transformer.transform(data);

    const mm = Markmap.create(svg, undefined, root);
    mm.fit(); // 自适应缩放

    return () => {
      svg.innerHTML = '';
    };
  }, [data]);

  return (
    <figure className="my-8">
      {caption && (
        <figcaption className="text-sm text-zinc-500 text-center mb-2">
          {caption}
        </figcaption>
      )}
      <svg ref={svgRef} className="w-full h-[400px] border rounded-lg" />
    </figure>
  );
}
```

逐行解读：

1. `'use client'` — React 的客户端指令。标记此组件及其所有导入的依赖都在浏览器中执行。必须放在文件第一行（import 之前）

2. `import { useEffect, useRef } from 'react'` — 两个 React Hook：
   - `useRef<SVGSVGElement>` — 创建对 SVG DOM 元素的引用，用于后续 markmap 渲染
   - `useEffect` — 在组件挂载后执行 DOM 操作。第二个参数 `[data]` 表示当 `data` prop 变化时重新渲染思维导图

3. `import { Transformer } from 'markmap-lib'` — Transformer 将 Markdown 解析为 markmap 的树形数据格式。`transform()` 返回 `{ root, features }`，`root` 是树形节点

4. `import { Markmap } from 'markmap-view'` — Markmap 接收 SVG 元素和树形数据，在 SVG 中渲染可交互的思维导图

5. `const svgRef = useRef<SVGSVGElement>(null)` — 创建 ref，<svg> 元素通过 `ref={svgRef}` 绑定后，`svgRef.current` 指向实际的 DOM 节点

6. `useEffect(() => { ... }, [data])` — 副作用执行：
   - `if (!svgRef.current || !data) return` — 安全守卫：SVG 元素未挂载或 data 为空时跳过
   - `const svg = svgRef.current` — 将 ref 值捕获为局部变量，避免闭包中 ref 可能为 null 的问题
   - `svg.innerHTML = ''` — **关键**：清除 SVG 之前的内容。React Strict Mode 在开发环境下会执行两次 effect，不清除会导致思维导图叠加渲染
   - `new Transformer().transform(data)` — 解析 Markdown 为树形结构
   - `Markmap.create(svg, undefined, root)` — 在 SVG 中渲染树。第二个参数 `undefined` 使用默认配置（颜色、间距等）
   - `mm.fit()` — 自动缩放思维导图以适应容器
   - `return () => { svg.innerHTML = ''; }` — 清理函数，组件卸载时清空 SVG 内容

7. `dangerouslySetInnerHTML` **不需要**在这里使用——markmap 通过 JavaScript API 直接操作 SVG DOM，而非注入 HTML 字符串

#### 已知限制：MindMap 中的 LaTeX 公式无法渲染

markmap-lib 的 Transformer 虽然内置了 KaTeX 自动转换（将 Markdown 中的 `$...$` 转换为 KaTeX HTML），但 markmap-view 在渲染时将节点内容注入 SVG 的 `<foreignObject>` 元素中，而 SVG 内的 CSS 上下文与页面全局 CSS 隔离。KaTeX 生成的 HTML 依赖页面级的 CSS 样式定义（如 `.katex` 类的字体规则），在 `<foreignObject>` 隔离环境中这些样式不生效，导致公式显示为原始 HTML 标记或错位字符。

**替代方案**：在 MindMap 的 Markdown 内容中，使用 Unicode 数学符号直接书写（如 `α = β + γ`、`x² + y² = r²`），或使用描述性文本（如 "sum of squared errors"）代替 LaTeX 公式符号。

---

#### 1.7.3 代码块（服务端组件 — 用 highlight.js 替代 shiki）

> **为什么不用 shiki？** shiki 的 TextMate 语法文件约 5-10MB，在 Server Component 中每次渲染都会加载，对个人博客是过度设计。`highlight.js` 在服务端渲染，且语法覆盖够用。

```bash
npm install highlight.js
npm install -D @types/highlight.js 2>/dev/null || true
```

[文件用途] `components/blog/custom-blocks/code-block.tsx` 在服务端用 highlight.js 对代码进行语法高亮，输出带语法着色 HTML。

[架构背景] 选择服务端渲染（而非客户端）的好处：代码高亮在构建时或首次请求时完成，客户端收到的是已着色的 HTML，不需要下载高亮库到浏览器。

```tsx
// components/blog/custom-blocks/code-block.tsx
import hljs from 'highlight.js/lib/common';

interface Props {
  code: string;
  language: string;
  filename?: string;
}

export function CodeBlock({ code, language, filename }: Props) {
  const highlighted = hljs.highlight(code, {
    language: hljs.getLanguage(language) ? language : 'plaintext',
  }).value;

  return (
    <figure className="my-6 rounded-lg overflow-hidden border border-zinc-200">
      {filename && (
        <figcaption className="px-4 py-2 bg-zinc-100 text-zinc-500 text-sm font-mono border-b border-zinc-200">
          {filename}
        </figcaption>
      )}
      <pre className="overflow-x-auto">
        <code
          className={`language-${language} hljs block px-4 py-4 text-sm leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </figure>
  );
}
```

逐行解读：

1. `import hljs from 'highlight.js/lib/common'` — 从 highlight.js 的 "common" bundle 导入（包含约 40 种最常用语言），而非完整版（200+ 语言，体积更大）。如果需要的语言不在 common 中，可以改用 `highlight.js/lib/core` 然后手动注册语言

2. `hljs.getLanguage(language) ? language : 'plaintext'` — **安全回退机制**。如果用户选择的语言 highlight.js 不支持（或拼写错误），自动回退到 `plaintext`（无高亮），避免运行时错误

3. `hljs.highlight(code, { language }).value` — 执行服务端语法高亮。
   - 输入：原始代码字符串 + 目标语言
   - 输出：带 `<span class="hljs-*">` 标签的 HTML 字符串
   - `.value` 提取 HTML 字符串（而非完整结果对象）

4. `dangerouslySetInnerHTML={{ __html: highlighted }}` — React 的 HTML 注入 API。之所以"dangerous"，是因为如果你注入用户输入的 HTML，可能被 XSS 攻击。但这里注入的是 highlight.js 的输出（用户原始代码被转义，只生成了着色 span），是安全的

5. `overflow-x-auto` — 代码超出屏幕宽度时出现水平滚动条，避免代码行折断

---

#### 1.7.4 数学公式（服务端渲染）

[文件用途] `components/blog/custom-blocks/math-block.tsx` 在服务端用 KaTeX 将 LaTeX 公式渲染为 HTML+CSS。

[架构背景] 选择 KaTeX 而非 MathJax：KaTeX 体积更小（~300KB vs ~2MB）、渲染更快（纯服务端字符串替换 vs DOM 操作）。**在服务端渲染公式是关键**——客户端渲染会导致页面闪烁（先显示 LaTeX 源码再渲染为公式）。

```tsx
// components/blog/custom-blocks/math-block.tsx
import katex from 'katex';

interface Props {
  formula: string;
}

export function MathBlock({ formula }: Props) {
  const html = katex.renderToString(formula, {
    displayMode: true,
    throwOnError: false,
    strict: false,
  });

  return (
    <div
      className="my-6 overflow-x-auto py-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

逐行解读：

1. `import katex from 'katex'` — KaTeX 库。`renderToString()` 是同步方法（不需要 canvas/DOM），可以在 Node.js 服务端直接调用
2. `displayMode: true` — 块级公式模式（公式居中显示，大符号如积分、求和用块级尺寸）。如果做行内公式，设为 `false`
3. `throwOnError: false` — 解析 LaTeX 出错时，不抛出异常，而是渲染错误文本。避免一个公式错误导致整个页面崩溃
4. `strict: false` — 关闭 KaTeX 的严格模式，允许一些非标准但常用的 LaTeX 语法
5. `overflow-x-auto` — 长公式可横向滚动，避免在手机上超出屏幕

---

#### 1.7.5 PDF 嵌入

[文件用途] `components/blog/custom-blocks/pdf-embed.tsx` 将 Sanity 上传的 PDF 文件通过 iframe 嵌入页面。

[架构背景] Sanity 的文件存储使用 CDN，文件 ref 的格式是 `file-<id>-<ext>`。这个组件解析 ref 构建 CDN URL，用 `<iframe>` 嵌入 PDF（浏览器内置 PDF 阅读器渲染）。

```tsx
// components/blog/custom-blocks/pdf-embed.tsx
import { client } from '@/lib/sanity/client';

interface Props {
  file: {
    asset: {
      _ref: string;
    };
  };
  caption?: string;
}

export function PdfEmbed({ file, caption }: Props) {
  // 从 Sanity file asset ref 构建 URL（ref 格式：file-<id>-<ext>）
  const [, id, extension] = file.asset._ref.split('-');
  const { projectId, dataset } = client.config();
  const fileUrl = `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${extension}`;

  return (
    <figure className="my-8">
      {caption && (
        <figcaption className="text-sm text-zinc-500 text-center mb-2">
          {caption}
        </figcaption>
      )}
      <iframe
        src={fileUrl}
        className="w-full h-[600px] border rounded-lg"
        title={caption || 'PDF'}
      />
      <div className="text-center mt-2">
        <a
          href={fileUrl}
          download
          className="text-sm text-blue-600 hover:underline"
        >
          下载 PDF
        </a>
      </div>
    </figure>
  );
}
```

逐行解读：

1. `import { client } from '@/lib/sanity/client'` — 导入 Sanity client 实例不是为了查询，而是为了读取 `client.config()` 中的 `projectId` 和 `dataset`，用于构建 CDN URL

2. `const [, id, extension] = file.asset._ref.split('-')`
   - Sanity file ref 格式：`file-abc123def456-pdf`
   - `.split('-')` 按 `-` 分割 → `['file', 'abc123def456', 'pdf']`
   - 解构赋值 `[, id, extension]` — 第一个元素（`'file'`）用 `,` 跳过，取 `id` 和 `extension`
   - 这是一种**解析 Identifier**的常见模式

3. `const { projectId, dataset } = client.config()` — 从 client 实例中提取配置值。使用解构而非 `process.env` 更安全（client 已经做了环境变量校验）

4. `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${extension}` — Sanity CDN 文件 URL 的标准格式。`cdn.sanity.io` 是全球 CDN，文件下载速度快

5. `<iframe src={fileUrl}>` — 浏览器内置 PDF 阅读器会在 iframe 中渲染 PDF。`download` 属性在 `<a>` 标签上提示浏览器下载而非打开

---

### 1.8 文章主题系统

[架构背景] 主题系统采用 **CSS 自定义属性（CSS Variables）驱动**的设计：每个主题是一个 React 组件，通过 `style` 属性注入一组 `--blog-*` CSS 变量。博客正文的 CSS 规则（`globals.css` 中的 `.blog-body`）通过 `var(--blog-font-body)` 等引用这些变量。切换主题 = 更换包裹组件 = 更换 CSS 变量值，无需重新加载 CSS 文件。

这种设计的优势：
- 主题数量可无限扩展，只需新建一个组件并注册到 `themeMap`
- CSS 规则和主题值完全解耦——新增主题只需定义变量值，CSS 规则不变
- 支持文章级别的主题切换（每篇文章的 `theme` 字段决定使用哪个 Theme 组件）

#### 1.8.1 Theme Wrapper

[文件用途] `components/blog/blog-theme-wrapper.tsx` 是主题切换的入口。它根据传入的 `theme` 字符串，从注册表中取出对应的主题组件，包裹文章内容。

```tsx
// components/blog/blog-theme-wrapper.tsx
import { DefaultTheme } from '@/lib/themes/default';
import { TerminalTheme } from '@/lib/themes/terminal';

const themeMap: Record<string, React.ComponentType<{ children: React.ReactNode }>> = {
  default: DefaultTheme,
  terminal: TerminalTheme,
  // Phase 1b 追加:
  // serif: SerifTheme,
  // manga: MangaTheme,
  // minimal: MinimalTheme,
};

interface Props {
  theme: string;
  children: React.ReactNode;
}

export function BlogThemeWrapper({ theme, children }: Props) {
  const Theme = themeMap[theme] ?? themeMap.default;
  return <Theme>{children}</Theme>;
}
```

逐行解读：
1. `const themeMap: Record<string, React.ComponentType<...>>` — 主题注册表，key 是主题名（对应 Blog 文档的 `theme` 字段值），value 是对应的 React 组件。类型 `React.ComponentType` 表示可以是函数组件或类组件
2. `default: DefaultTheme, terminal: TerminalTheme` — 当前注册的两个主题。新增主题只需在这里添加一行
3. `const Theme = themeMap[theme] ?? themeMap.default` — 查找主题组件，`??` 是空值合并运算符：如果 `themeMap[theme]` 是 `undefined`（主题名不存在），回退到 `default`。这确保即使 Sanity 中写错了主题名，页面也能正常渲染
4. `<Theme>{children}</Theme>` — 渲染主题包裹组件，`children` 是 `<BlogArticle>` 的全部内容

#### 1.8.2 Default Theme

[文件用途] `lib/themes/default.tsx` 定义默认主题的 CSS 变量值——白底黑字、无衬线字体、蓝色链接。

```tsx
// lib/themes/default.tsx
export function DefaultTheme({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        '--blog-font-body': "'Noto Sans SC', sans-serif",
        '--blog-font-heading': "'Noto Sans SC', sans-serif",
        '--blog-line-height': '1.8',
        '--blog-link-color': '#2563eb',
        '--blog-blockquote-border': '#e4e4e7',
        '--blog-blockquote-color': '#71717a',
        color: '#18181b',
        backgroundColor: '#ffffff',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
```

逐行解读：
1. `--blog-font-body` / `--blog-font-heading` — 正文字体和标题字体，使用 Noto Sans SC（思源黑体简体中文版），`sans-serif` 是回退字体
2. `--blog-line-height: '1.8'` — 行高 1.8 倍，中文阅读舒适的行距标准（比英文 1.5 略大，因为汉字更密集）
3. `--blog-link-color: '#2563eb'` — 链接蓝色（Tailwind blue-600），在 `.blog-body a` 规则中使用
4. `--blog-blockquote-border` / `--blog-blockquote-color` — 引用块左边框和文字颜色
5. `color: '#18181b'` (zinc-900) 和 `backgroundColor: '#ffffff'` — 直接设置文字色和背景色，不通过 CSS 变量（这两个是全局的，不是可覆盖的博客样式变量）
6. `as React.CSSProperties` — TypeScript 类型断言，让 `style` 对象中的 CSS 自定义属性（`--xxx`）通过类型检查

#### 1.8.3 Terminal Theme

[文件用途] `lib/themes/terminal.tsx` 定义终端主题——黑底绿字、等宽字体，模拟命令行终端的视觉风格。

```tsx
// lib/themes/terminal.tsx
export function TerminalTheme({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="theme-terminal"
      style={{
        '--blog-font-body': "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        '--blog-font-heading': "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        '--blog-line-height': '1.7',
        '--blog-link-color': '#38bdf8',
        '--blog-blockquote-border': '#22c55e',
        '--blog-blockquote-color': '#4ade80',
        color: '#22c55e',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        padding: '1rem',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
```

逐行解读：
1. `className="theme-terminal"` — 附加的 CSS class，可用于在 `globals.css` 中为 Terminal 主题添加特殊样式（如代码块边框色、滚动条颜色等）
2. `--blog-font-body / --blog-font-heading: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace` — 等宽字体栈：JetBrains Mono 优先，Fira Code 次之，Consolas 第三，系统 monospace 兜底。等宽字体是终端美学的核心
3. `--blog-link-color: '#38bdf8'` — 浅蓝链接（sky-400），在黑底上比深蓝色更具可读性
4. `--blog-blockquote-border: '#22c55e'` / `--blog-blockquote-color: '#4ade80'` — 绿色系的引用块，配合终端主题的整体绿屏配色
5. `color: '#22c55e'` (green-500) 和 `backgroundColor: '#0a0a0a'` — 绿字黑底，经典 CRT 终端配色
6. `minHeight: '100vh'` — 最小高度铺满整个视口，即使文章很短，终端背景也会覆盖全屏
7. `padding: '1rem'` — 16px 内边距，防止内容贴边

[关联说明] 主题组件在 `BlogThemeWrapper` 中被引用，`BlogThemeWrapper` 在博客路由页（1.6.3）的 `BlogArticle` 组件中使用。新增主题的步骤：① 在 `lib/themes/` 创建新组件 → ② 在 `blog-theme-wrapper.tsx` 的 `themeMap` 中注册 → ③ 在 Sanity Blog Schema 的 `theme` 字段 options 中添加新选项。

---

### 1.9 部署上线

[架构背景] 项目部署到 Vercel（Next.js 的创建者），是 Next.js 应用最自然的托管平台。Vercel 自动检测 Next.js 框架，零配置支持 ISR、SSR、API Routes、环境变量注入。部署后每次 `git push` 自动触发重新构建和发布。

#### 1.9.1 首次 commit 和 push

```bash
git add .
git commit -m "feat: Phase 1a MVP — blog skeleton with Sanity CMS"
git branch -M main
git push -u origin main
```

逐行解读：
1. `git add .` — 暂存所有文件（确保 `.env.local` 在 `.gitignore` 中，不会被提交）
2. `git commit -m "..."` — 创建初始提交，消息遵循 conventional commits 规范（`feat:` 前缀表示新功能）
3. `git branch -M main` — 将当前分支重命名为 `main`（新 GitHub 仓库默认分支名）
4. `git push -u origin main` — 推送到 GitHub，`-u` 设置上游跟踪，之后只需 `git push`

#### 1.9.2 Vercel 部署

1. 打开 [vercel.com](https://vercel.com) → Add New → Project
2. 导入你的 GitHub 仓库
3. 框架自动识别 Next.js（无需手动选择，Vercel 检测到 `next.config.ts` 即自动配置）
4. 在 **Environment Variables** 中，逐项添加 `.env.local` 中的所有变量（**包括 `NEXT_PUBLIC_*` 变量**）
   - 特别注意：`NEXT_PUBLIC_SITE_URL` 在部署后需改为 `https://iceaxing.com`
5. 点击 Deploy

**为什么环境变量要在 Vercel 设置而不是上传 `.env.local`？** `.env.local` 在 `.gitignore` 中，不会被提交到 Git。Vercel 通过 Dashboard 注入环境变量到构建和运行时环境，这是安全最佳实践——密钥不进入版本控制。

#### 1.9.3 DNS 配置

1. Vercel 项目 → Settings → Domains → 添加 `iceaxing.com`
2. 在域名提供商添加 Vercel 指定的 DNS 记录（通常是 A 记录指向 `76.76.21.21`，或 CNAME 指向 `cname.vercel-dns.com`）
3. 等待 SSL 自动签发（约 1-2 分钟，Vercel 通过 Let's Encrypt 自动申请和续期）

**常见问题**：DNS 生效需要全球传播时间（最长 48 小时，通常 5-30 分钟）。如果访问显示 "Vercel 404"，先用 `https://<project-name>.vercel.app` 验证部署是否成功，确认是 DNS 问题而非部署问题。

#### 1.9.4 Phase 1a 验收检查

- [ ] `iceaxing.com` 可访问，显示静态首页
- [ ] 分类页 → 项目页 → 文章页可正常浏览
- [ ] 一篇文章包含所有 4 种自定义 block，均渲染正常
- [ ] Terminal 主题可切换
- [ ] `next build` 无错误（本地运行 `npm run build` 验证）

---

## 二、Phase 1b：功能完善

> 目标：博客功能齐全，搜索/评论/RSS/SEO/响应式全部到位。

### 2.1 独立页面

#### 2.1.1 关于页

[文件用途] app/(pages)/about/page.tsx -- 关于页（服务端组件），Phase 1 阶段为静态手写 HTML 内容，Phase 2 可迁入 Sanity profile 文档型数据源。

[架构背景] 关于页选择了最简方案——直接手写静态 JSX 而非从 Sanity 拉取数据。设计考量如下：
- 关于页内容更新频率极低（可能几个月才改一次），不值得为它单独建 Sanity Schema 和维护数据查询。
- 静态内容直接内嵌在组件中，零网络请求、零延迟，构建时即确定。
- 如果未来需要更丰富的排版（如头像、社交链接、时间线），有两种升级路径：(a) 迁入已有的 profile Schema，复用 ProfilePage 的数据源；(b) 在 about 页内嵌 Portable Text 渲染器，在 Sanity 中维护内容但仍不走服务端查询。
- `export const metadata` 是 Next.js App Router 的约定——每个 page.tsx 可以导出 metadata 对象（静态）或 generateMetadata 函数（动态），框架会自动将其注入 `<head>`。

```tsx
// app/(pages)/about/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '关于',
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">关于</h1>
      <div className="prose prose-zinc">
        <p>
          这里写关于你的内容。Phase 1 先手写静态 HTML，
          Phase 2 考虑迁入 Sanity profile 或保持静态。
        </p>
      </div>
      <Link href="/" className="text-sm text-blue-600 hover:underline mt-8 inline-block">
        ← 返回首页
      </Link>
    </div>
  );
}
```

逐行解读：
- `export const metadata: Metadata = { title: '关于' }` -- Next.js 静态 metadata 导出。对象内的 `title` 会被注入到 `<title>` 标签。这是最简单的方式——对于内容不变的页面（如关于页），无需 generateMetadata 函数。
- `export default function AboutPage()` -- Next.js App Router 的页面组件约定。默认导出函数即为该路由的页面。此函数为同步组件（非 async），因为它不依赖任何异步数据获取。
- `<div className="max-w-2xl mx-auto px-4 py-12">` -- 页面容器。`max-w-2xl`（约 672px）限制内容宽度，`mx-auto` 居中，`px-4` 留水平内边距，`py-12` 留垂直内边距。
- `<div className="prose prose-zinc">` -- Tailwind Typography 插件的 prose 类，为内部 HTML 元素提供美观的排版样式（字号、行高、间距、颜色）。`prose-zinc` 将色调设为 zinc 灰。
- `<Link href="/">` -- Next.js 内置的客户端路由组件，点击后进行 SPA 式导航（不刷新页面），同时预取目标页面的数据。

[关联说明] 关于页与 ProfilePage（2.1.3）共享相同的页面容器样式（`max-w-2xl mx-auto px-4 py-12`）。Phase 2 统一迁移到 Sanity 后，这两个页面可以合并为同一数据源的不同视图。当前页面在 `app/(pages)/about/` 路由组下，与 `(site)` 路由组共享同一 layout.tsx。

#### 2.1.2 友链页

[文件用途] app/(pages)/friends/page.tsx -- 友链页（服务端组件），从 Sanity 获取 friend 文档列表并渲染为卡片网格。

[架构背景] 友链页的数据存储在 Sanity 的 `friend` 文档类型中，而非手写静态列表。设计考量：
- 友链需要频繁增删（添加新朋友、移除失效链接），每次改代码部署成本太高。存储在 CMS 中可以随时在 Studio 中增删，触发 Webhook → ISR 刷新页面。
- 友链卡片使用 Sanity 图片 CDN（urlFor）加载头像，自动生成 webp 格式、限定尺寸，避免源图过大导致页面加载缓慢。
- 空状态（`friends.length === 0`）处理很重要——新博客初期可能没有友链，不应该展示空白网格或报错。
- `target="_blank"` + `rel="noopener noreferrer"` 是安全最佳实践：noopener 防止新页面通过 window.opener 访问原页面，noreferrer 防止泄露 Referer header。

```tsx
// app/(pages)/friends/page.tsx
import { getFriends } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '友链',
};

export default async function FriendsPage() {
  const friends = await getFriends();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">友链</h1>

      {friends.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p>暂未添加好友链接</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {friends.map((friend) => (
            <a
              key={friend._id}
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 border rounded-lg hover:border-zinc-400 transition-colors"
            >
              {friend.avatar && (
                <img
                  src={urlFor(friend.avatar).width(80).height(80).format('webp').url()}
                  alt={friend.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div>
                <h2 className="font-semibold">{friend.name}</h2>
                {friend.description && (
                  <p className="text-sm text-zinc-500 line-clamp-2">
                    {friend.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

逐行解读：
- `export default async function FriendsPage()` -- 服务端异步组件。`async` 是关键——组件在服务端执行 `await getFriends()` 获取数据后再渲染 HTML。与 AboutPage（同步）不同，FriendsPage 依赖外部数据源。
- `const friends = await getFriends()` -- 调用 `lib/sanity/queries.ts` 中封装的查询函数，获取所有已发布的 friend 文档。数据在服务端获取，不会暴露 API token。
- `{friends.length === 0 ? (...) : (...)}` -- 条件渲染。三目运算符根据数组长度决定展示空状态还是卡片列表。React 中 `array.length === 0` 比 `!array.length` 更显式易读。
- `friends.map((friend) => (...))` -- 标准的列表渲染模式。每个 friend 对象需要唯一的 `key` 属性（这里用 Sanity 文档的 `_id`），React 用 key 做列表 diff 优化。
- `urlFor(friend.avatar).width(80).height(80).format('webp').url()` -- Sanity 图片 CDN 的链式 API：width/height 限定尺寸（减少传输量），format('webp') 指定现代图片格式（比 PNG/JPG 小 30-50%），url() 返回最终 CDN URL。
- `<img className="w-10 h-10 rounded-full object-cover">` -- 40px 圆形头像。object-cover 保证图片裁剪填充（不变形），flex-shrink-0 防止在窄容器中被压缩。
- `target="_blank" rel="noopener noreferrer"` -- 外链安全三件套：_blank 在新标签页打开，noopener 阻断 window.opener 反向引用（防钓鱼），noreferrer 阻止发送 Referer 头（隐私保护）。

[关联说明] 友链页与 ProfilePage 共享相同的 Sanity 图片处理模式（urlFor 链式调用）。数据查询函数 `getFriends()` 在 `lib/sanity/queries.ts` 中定义（参考 1.3.3 节）。当 Sanity 中 friend 文档发生变更时，2.6.1 节的 Webhook 会 revalidate `/friends` 路径触发 ISR 刷新。

#### 2.1.3 个人简介页

[文件用途] app/(pages)/profile/page.tsx -- 个人简介页（服务端组件），从 Sanity 获取 profile 文档，渲染头像、Portable Text 简介内容和社交链接列表。

[架构背景] Profile 页与 About 页（2.1.1）形成鲜明对比——Profile 走 CMS 数据源，About 手写静态 HTML。选择差异的原因：
- Profile（个人简介）的内容会随博主的职业发展、技能变化、项目经历而更新，频率远高于 About 页的核心介绍文字。
- Profile 使用 Portable Text 渲染 `bio` 字段，支持富文本排版（加粗、链接、列表等），而 About 的静态 JSX 无法做到可视化编辑。
- 社交链接（socialLinks）存储在 Sanity 的数组字段中，增删链接不需要改代码。
- 头像使用 Sanity 图片 CDN（urlFor），与友链页共享相同的图片处理管道。
- 空状态守卫（`if (!profile)`）是关键——如果博主还没在 Sanity 中创建 profile 文档，页面不会崩溃，而是展示友好提示。

```tsx
// app/(pages)/profile/page.tsx
import { getProfile } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '个人简介',
};

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-zinc-400">
        <p>个人简介尚未创建</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        {profile.avatar && (
          <img
            src={urlFor(profile.avatar).width(96).height(96).format('webp').url()}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <h1 className="text-3xl font-bold">{profile.name}</h1>
      </div>

      <div className="prose prose-zinc mb-8">
        <PortableText value={profile.bio} />
      </div>

      {profile.socialLinks && profile.socialLinks.length > 0 && (
        <div className="flex gap-4">
          {profile.socialLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

逐行解读：
- `export default async function ProfilePage()` -- 异步服务端组件，在渲染前通过 `await getProfile()` 获取数据。
- `const profile = await getProfile()` -- 调用查询函数获取 profile 文档。注意这里拿到的是单个对象（或 null），而非数组。
- `if (!profile)` -- 空值守卫。如果 Sanity 中尚未创建 profile 文档，getProfile() 返回 null，组件渲染"尚未创建"的提示信息而非崩溃。这是防御性编程——避免 `profile.avatar` 等属性访问抛出 TypeError。
- `<PortableText value={profile.bio} />` -- Portable Text 渲染器。`bio` 字段存储为 Portable Text 富文本（而非纯字符串），支持内联格式（加粗、斜体、链接）和块级结构。渲染器将 JSON 结构的 Portable Text 转换为 React 组件树。
- `profile.socialLinks && profile.socialLinks.length > 0 &&` -- 短路求值（short-circuit evaluation）。只有当 socialLinks 存在且非空数组时才渲染社交链接区域。如果直接用 `profile.socialLinks.length > 0`，当 socialLinks 为 undefined 时会报错。
- `socialLinks.map((link, i) => (...))` -- 注意这里用索引 `i` 作为 key。理论上应该用稳定唯一标识，但社交链接数组通常不大且不会频繁重排，用索引在这个场景下可接受。
- `urlFor(profile.avatar).width(96).height(96).format('webp').url()` -- 96px 头像，比友链页的 40px 大（简介页头像是页面核心视觉元素，需要更大尺寸）。

[关联说明] Profile 页的数据查询函数 `getProfile()` 在 `lib/sanity/queries.ts` 中定义。当 Sanity 中 profile 文档发生变更时，2.6.1 节的 Webhook 会 revalidate `/profile` 路径。Profile 页与 Blog 正文页共享 Portable Text 渲染管线（1.7 节），但 Profile 只用默认渲染器（不需要 math/mindmap 等自定义 block）。

---

### 2.2 日志页

#### 2.2.1 日志入口页（贡献图 Grid）

核心思路：
1. 查所有 log，按 date 排序
2. 生成过去 52 周 × 7 天的网格
3. 有日志的日期 → 彩色地块（可点击），无日志 → 灰色占位

算法详解：52 周 x 7 天贡献图网格

这个网格的核心数据结构是 dateMap——一个 Map<string, Log>，key 为 "YYYY-MM-DD" 格式的日期字符串。构建它只需要遍历一次 logs 数组 O(n)，之后判断某一天是否有日志只需 dateMap.get(dateStr)，是 O(1) 操作。如果没有这个 Map，每次判断都需要遍历整个 logs 数组，在 52x7=364 个格子中做 O(n) 查找，总复杂度会从 O(n+364) 退化到 O(nx364)。

周的计算方式：从今天往前推 52x7=364 天作为 startDate（左侧起点），然后双重循环生成 52 列 weeks x 7 行 days。每个格子的日期通过 startDate + w*7 + d 天计算得出，再格式化为 YYYY-MM-DD 存入 Map 做匹配。这样网格的最后一列永远对应"本周"，左侧延伸至 52 周前。注意：这个算法不考虑时区（使用本地时间），对于个人博客日志场景完全够用；如果需要跨时区精确展示，应将所有日期统一为 UTC 或使用 date-fns 等库处理。

为什么不用 CSS Grid？这里的 flex + flex-col 嵌套方案刻意模拟了 GitHub 贡献图的视觉结构——列是周、行是星期几。如果改用 CSS Grid grid-cols-52，同一行的 52 个格子会按"周一行 -> 周二行 -> ..."的顺序排列，而不是"第1周日一二三四五六 -> 第2周日一二三四五六 -> ..."这种日历式排列。当然也可以用 grid-flow-col 配合固定行数实现，但 flex 嵌套更直观、更易维护。

[文件用途] app/(pages)/log/page.tsx -- 日志入口页（服务端组件），展示过去 52 周的博客更新贡献图，仿 GitHub 贡献图风格。

```tsx
// app/(pages)/log/page.tsx
import Link from 'next/link';
import { getAllLogs } from '@/lib/sanity/queries';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '日志',
};

const categoryColorMap: Record<string, string> = {
  content: 'bg-amber-400 hover:bg-amber-500',
  site: 'bg-yellow-500 hover:bg-yellow-600',
  other: 'bg-orange-400 hover:bg-orange-500',
};

export default async function LogPage() {
  const logs = await getAllLogs();

  // 构建日期到 log 的映射
  const dateMap = new Map<string, (typeof logs)[number]>();
  for (const log of logs) {
    dateMap.set(log.date, log);
  }

  // 生成过去 52 周的网格数据
  const today = new Date();
  const weeks: { date: string; dayOfWeek: number }[][] = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 52 * 7 + 1);

  for (let w = 0; w < 52; w++) {
    const week: { date: string; dayOfWeek: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      week.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: d,
      });
    }
    weeks.push(week);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">日志</h1>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1" style={{ minWidth: '780px' }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                const log = dateMap.get(day.date);
                return log ? (
                  <Link
                    key={day.date}
                    href={`/log/${log.slug}`}
                    title={`${log.title}\n${log.description || ''}`}
                    className={`w-3.5 h-3.5 rounded-sm ${categoryColorMap[log.category] || categoryColorMap.content} transition-colors`}
                  />
                ) : (
                  <div
                    key={day.date}
                    className="w-3.5 h-3.5 rounded-sm bg-zinc-100"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 mt-6 text-sm text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-400" /> 内容更新
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-yellow-500" /> 网站维护
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-orange-400" /> 其他
        </span>
      </div>
    </div>
  );
}
```

逐行解析：

- `export const metadata` -- Next.js App Router 约定的静态 metadata 导出，设置页面 title 为"日志"。因为这是服务端组件，metadata 在服务端渲染时生效，会被 Next.js 自动注入 head。
- `categoryColorMap` -- 用 Record 类型定义日志分类到 Tailwind 颜色类的映射。key 对应 Sanity log schema 中 category 字段的三个可选值（content/site/other），value 是 Tailwind 的背景色和 hover 色组合。
- `const logs = await getAllLogs()` -- 调用 lib/sanity/queries.ts 中定义的 GROQ 查询函数，在服务端获取所有已发布的 log 文档。async 组件是 Next.js 14 服务端组件的核心能力——组件顶层可以直接 await。
- `dateMap` -- 构建一个 Map 用于 O(1) 查找。key 是 "YYYY-MM-DD" 字符串，value 是整个 log 对象。这个 Map 在后续 364 个格子的循环中保证每次查找都是 O(1) 而不是 O(n)。
- `const today = new Date()` -- 获取当前日期作为基准。注意这里用的是服务器时间，如果部署在 UTC 时区的 Vercel 上，today 会是 UTC 日期的零点，对于中文博客需要在未来考虑时区偏移。
- `startDate.setDate(startDate.getDate() - 52 * 7 + 1)` -- 从今天往前推 363 天得到起点。为什么是 `+1`？因为循环中 `w*7+d` 的最大偏移是 51×7+6 = 363，若起点为 `today-364`，则最后一天是 `today-364+363 = today-1`（昨天），今天的日志就无法显示。加 1 后起点变为 `today-363`，最后一天 = `today-363+363 = today`，确保网格始终覆盖到当天。52 周 x 7 天 = 364 天，覆盖 [today-363, today] 共 364 个日期。
- 双重循环 -- 外层 52 次迭代对应 52 个列（weeks），内层 7 次对应一周的 7 天。`startDate + w*7 + d` 计算每个格子的确切日期。
- `date.toISOString().split('T')[0]` -- 将 Date 对象转为 "YYYY-MM-DD" 格式。注意 toISOString() 返回 UTC 时间，如果服务器在东八区，new Date() 会正确反映本地日期，但 toISOString 可能产生日期偏移。对于个人博客，只要 Sanity 中的 date 字段也都是本地日期，一致性就不会有问题。
- 渲染层 -- `overflow-x-auto` 确保在手机屏幕上可以横向滚动。`pb-2` 给滚动容器底部留 8px 内边距，防止浏览器水平滚动条（~17px）紧贴下方的图例文字。`minWidth: '780px'` 确保 52 列 x 每个格子约 15px = 780px 不被压缩变形。
- `dateMap.get(day.date)` -- 对每个格子做 O(1) 查找。有匹配则渲染彩色 Link，没有则渲染灰色 div 占位。
- `title` 属性 -- 在 Link 上设置 title 实现 hover 时的 tooltip，显示日志标题和描述。

#### 2.2.2 日志正文页

日志正文页使用的设计模式：Next.js 动态路由 + params Promise。在 Next.js 14 App Router 中，[slug] 文件夹对应动态路由参数，page.tsx 中的 params 是一个 Promise 类型，需要用 await 解包。generateMetadata 和默认导出的页面组件各自独立请求一次数据——这看起来像是 N+1，但实际上 Next.js 会在同一个请求周期内自动去重相同的 fetch 调用（通过 React 的 cache() 机制）。

[文件用途] app/(pages)/log/[slug]/page.tsx -- 日志正文页（服务端组件），根据 URL 中的 slug 参数查询对应的 log 文档并渲染正文。

```tsx
// app/(pages)/log/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLogBySlug } from '@/lib/sanity/queries';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const log = await getLogBySlug(slug);
  if (!log) return { title: '未找到' };
  return { title: log.title };
}

const categoryLabels: Record<string, string> = {
  content: '内容更新',
  site: '网站维护',
  other: '其他',
};

export default async function LogDetailPage({ params }: Props) {
  const { slug } = await params;
  const log = await getLogBySlug(slug);
  if (!log) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <nav className="text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/log" className="hover:text-zinc-600">日志</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{log.title}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{log.title}</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <time dateTime={log.date}>
            {new Date(log.date).toLocaleDateString('zh-CN')}
          </time>
          <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
            {categoryLabels[log.category] || log.category}
          </span>
        </div>
      </header>

      <div className="prose prose-zinc">
        <BlogBody content={log.body} />
      </div>

      <Link href="/log" className="text-sm text-blue-600 hover:underline mt-8 inline-block">
        ← 返回日志
      </Link>
    </div>
  );
}
```

逐行解析：

- `generateMetadata` -- Next.js 动态路由的 metadata 生成函数。参数 params 是 `Promise<{ slug: string }>`，需要 await 解包。这里做一次数据查询获取标题，如果 log 不存在返回 `{ title: '未找到' }` 作为 fallback。
- `categoryLabels` -- 中文标签映射表，用于在前端展示时把英文 key（content/site/other）转换为中文（内容更新/网站维护/其他）。
- `const log = await getLogBySlug(slug)` -- 默认导出的页面组件中再次查询。虽然 generateMetadata 已经查过一次，但 Next.js 通过 React cache() 机制会自动去重——如果 getLogBySlug 函数内部用 cache() 包装，同一个请求周期内相同参数的调用只会执行一次。
- `if (!log) notFound()` -- notFound() 是 next/navigation 提供的函数，调用后会触发 Next.js 内置的 404 页面渲染（next 会自动寻找 not-found.tsx）。
- 面包屑导航 -- 手动实现的简单面包屑：首页 > 日志 > 当前文章标题。适合页面层级不深的场景，层级深时可用结构化数据 + JSON-LD 补充 SEO。
- `<time dateTime={log.date}>` -- 语义化 HTML。dateTime 属性方便搜索引擎和屏幕阅读器解析，内部用 toLocaleDateString('zh-CN') 格式化为中文日期。
- `import { BlogBody } from '@/components/blog/portable-text-renderer'` — 导入项目自定义的 Portable Text 渲染器（含所有自定义 block 组件），替代裸 `<PortableText>`，确保日志正文中的 mindmap、数学公式、代码块等自定义 block 能正确渲染。
- `<BlogBody content={log.body} />` — 将 log.body（PortableTextBlock 数组）传入自定义渲染器。与 blog 正文页用同一个渲染入口，共享全部自定义 block 渲染逻辑。

---

### 2.3 Giscus 评论

[文件用途] components/comments/giscus.tsx -- Giscus 评论组件（客户端组件），封装 @giscus/react 库，在博客正文页底部嵌入基于 GitHub Discussions 的评论系统。

[架构背景] 为什么选择 Giscus 而非自建评论系统？
- **零数据库成本**：Giscus 将评论数据存储在 GitHub Discussions 中，不需要自建数据库、不需要维护评论 API。GitHub 免费提供无限存储和 API 访问。
- **零运维负担**：不需要管理垃圾评论过滤（GitHub 有内置的反滥用机制）、不需要处理用户认证（评论者需要 GitHub 账号，天然过滤了大部分匿名垃圾）。
- **与博客技术栈天然契合**：博客代码已经托管在 GitHub，Giscus 直接读取同一个仓库的 Discussions，配置只需 4 个环境变量（repo、repoId、category、categoryId）。
- 与自建评论（存 Sanity）对比：自建需要建 Schema、写 API Route、处理垃圾评论、做邮件通知。工作量至少多 3-5 天。对于个人博客来说，Giscus 的"够用"远比"自建"的灵活性更重要。
- 组件标注 `'use client'` 是因为 @giscus/react 内部依赖浏览器 API（DOM 操作、脚本加载），无法在服务端渲染。`'use client'` 指令告诉 Next.js 这个组件及其子组件只在客户端执行。

```bash
npm install @giscus/react@^3
```

```tsx
// components/comments/giscus.tsx
'use client';

import GiscusReact from '@giscus/react';

export function GiscusComments() {
  return (
    <div className="mt-12 pt-8 border-t">
      <GiscusReact
        repo={process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}`}
        repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
        category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
        categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
```

逐行解读：
- `'use client'` -- Next.js 客户端组件指令。缺少这一行会导致服务端渲染报错，因为 @giscus/react 内部使用了 `useEffect`、`document` 引用等仅浏览器可用的 API。'use client' 将组件标记为"在客户端水合（hydrate）"，跳过服务端渲染。
- `import GiscusReact from '@giscus/react'` -- 导入 @giscus/react 库的主组件。该库封装了 giscus 的 iframe 加载逻辑和 GitHub Discussions API 对接。
- `repo={process.env.NEXT_PUBLIC_GISCUS_REPO as \`${string}/${string}\`}` -- GitHub 仓库全名（格式 `owner/repo`）。`as \`${string}/${string}\`` 是 TypeScript 类型断言，约束环境变量的值必须包含斜杠。环境变量前缀 `NEXT_PUBLIC_` 是 Next.js 的约定——以此开头的变量会被打包进客户端 JS bundle，可在浏览器中直接访问。
- `repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}` -- GitHub 仓库的数字 ID（非仓库名）。末尾的 `!` 是 TypeScript 非空断言（non-null assertion），告诉编译器"我确定这个环境变量已设置"。
- `category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}` -- GitHub Discussions 的分类名。评论会在这个分类下以 Discussion 形式存储。需要在 GitHub 仓库的 Discussions 设置中预先创建分类（如 "Blog Comments"）。
- `categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}` -- 分类的数字 ID。与分类名一一对应。
- `mapping="pathname"` -- 评论映射策略。pathname 表示用当前页面的 URL 路径（如 `/tech/nextjs/my-post`）作为 Discussion 的查找 key。同一 URL 路径的所有访问者看到同一组评论。其他可选值：url（完整 URL）、title（页面标题）、og:title（OG meta 标题）、specific（手动指定 ID）。
- `reactionsEnabled="1"` -- 启用评论反应（reactions），即 GitHub 的 👍👎😄🎉😕❤️ 表情。设为 "0" 可禁用。
- `emitMetadata="0"` -- 不在页面上额外输出 giscus 的 meta 标签。设为 "0" 可避免与 Next.js 自有的 metadata 机制冲突。
- `inputPosition="bottom"` -- 评论输入框在评论列表下方（GitHub 风格），而非上方。可选 "top"。
- `lang="zh-CN"` -- 界面语言设为简体中文。giscus 内置了多语言支持，无需额外配置 i18n。
- `loading="lazy"` -- 延迟加载评论 iframe。评论在用户滚动到可视区域时才加载，减少首屏 JS 体积和 API 调用。对 SEO 友好（搜索引擎不会等待 iframe）。

> **已知限制**：当前 Giscus 组件未根据文章主题（default/terminal）动态切换颜色方案。terminal 主题的深色背景下，Giscus 仍渲染浅色 widget，视觉上不协调。如需解决，可向 `<GiscusReact>` 传入 `theme` prop（如 `theme="dark"`），由父组件根据 post.theme 动态选择。

在 blog 正文页底部引入（放在 `</article>` 之后、`</BlogThemeWrapper>` 之前）：

```tsx
// app/(site)/[category]/[project]/[...slug]/page.tsx 顶部 — 新增 import
import { GiscusComments } from '@/components/comments/giscus';

// ... 在 return 的 </article> 之后、</BlogThemeWrapper> 之前新增：
      </article>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        <GiscusComments />
      </div>
    </BlogThemeWrapper>
```

> 评论组件放在 `<article>` 之外是因为评论是文章的讨论元数据，而非文章内容本身。`max-w-3xl mx-auto px-4` 保持与文章正文相同的宽度约束，`pb-12` 提供底部间距。

#### 环境变量

需在 `.env.local` 中配置 4 个 Giscus 环境变量。以下为 `.env.example` 模板（可提交到 git）：

```bash
# ── Giscus ──
NEXT_PUBLIC_GISCUS_REPO=your-github-username/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=Comments
NEXT_PUBLIC_GISCUS_CATEGORY_ID=
```

获取方式：
1. 在 GitHub 仓库 Settings → Features 中启用 Discussions
2. 访问 [giscus.app](https://giscus.app) 填写仓库名
3. 选择 Discussion 分类（需提前在仓库中创建一个分类，如 "Comments"）
4. 页面自动生成 repoId、categoryId 等配置值

---

### 2.4 搜索

#### 2.4.1 Search API Route

这里使用了 Next.js API Route 的 REST 风格设计模式。Search API 使用 GET 方法 + query params（而非 POST body），因为搜索是幂等的读取操作，天然适合 GET。这种模式的优势：
- URL 可直接分享（如 /api/search?q=nextjs），别人打开就能看到相同结果。
- 浏览器自动缓存 GET 请求（配合 Cache-Control header 可控）。
- 符合 REST 语义——GET 代表"获取资源"，不产生副作用。

与一般搜索引擎的复杂度不同，这里的搜索仅依赖 GROQ 字符串匹配，没有倒排索引、没有向量搜索。对于个人博客的几百篇文章规模来说完全够用，但如果未来扩展到数千篇文章，就需要考虑 Sanity 的 GROQ 性能限制（单次查询扫描文档数有上限），以及在前端加更好的输入防抖。

[文件用途] app/api/search/route.ts -- 搜索 API Route（GET），接收 q 查询参数，调用 GROQ 搜索并返回 JSON 结果。

```ts
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchBlogs } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchBlogs(q.trim());
  return NextResponse.json({ results });
}
```

逐行解析：

- `export async function GET(request: NextRequest)` -- Next.js API Route 的约定导出名。GET 函数处理 HTTP GET 请求，函数名决定 HTTP 方法。NextRequest 是 Web Request API 的 Next.js 扩展，提供了 searchParams 等附加属性。
- `request.nextUrl.searchParams.get('q')` -- 从 URL query string 中提取 q 参数。nextUrl 是标准 URL 对象的扩展版，searchParams 返回 URLSearchParams 实例。
- 空查询判断 -- 如果 q 为空或仅含空格，直接返回空数组，避免执行无意义的 GROQ 查询。这同时也是防御性编程——防止客户端传空字符串导致 Sanity 返回全量数据。
- `searchBlogs(q.trim())` -- 调用 lib/sanity/queries.ts 中封装好的 GROQ 搜索函数。q.trim() 去除首尾空白。这层封装让 API Route 保持简单——它只负责 HTTP 层面的逻辑（解析请求、返回响应），数据查询细节交给 queries.ts。
- `NextResponse.json({ results })` -- Next.js 提供的辅助方法，帮你自动设置 Content-Type: application/json 并序列化 JSON。返回的 shape 是 { results: [...] }，前端消费时统一解包。

#### 2.4.2 Search Dialog（客户端组件）

Search Dialog 是一个典型的前端状态机组件，管理了 5 个独立的状态变量，各自有明确的职责：

- `open`（布尔值）-- 控制弹窗的显示/隐藏。这是整个状态机的"总开关"，onClose 时会将 query 置空、results 清空、selectedIndex 重置为 -1。
- `query`（字符串）-- 用户输入框的当前值。每次变化触发 debounced fetch。是触发网络请求的唯一源头。
- `results`（数组）-- API 返回的搜索结果列表。渲染结果列表和空状态判断的依据。
- `loading`（布尔值）-- 请求进行中的标记。控制 loading skeleton 的显示，防止用户在结果未返回时看到"没有找到"。
- `selectedIndex`（数字，-1 表示无选中）-- 键盘导航的当前位置。用上下箭头递增/递减，Enter 时导航到对应结果的 URL。初始值为 -1 意味着"未选中任何项"。

此外，组件使用了 4 个交互模式：

1. Ctrl+K 快捷键 -- 全局 listen window keydown 事件，检测 Ctrl+K / Meta+K 打开弹窗。Meta 键兼容 Mac。
2. 300ms 防抖（debounce）-- query 变化后不立即发请求，等 300ms 无新输入才执行 fetch。如果用户连续输入，前一个 timer 被 clearTimeout 取消。
3. 上下箭头键盘导航 -- ArrowDown 递增 selectedIndex（不超过 results.length-1），ArrowUp 递减（不低于 0）。Enter 触发导航。
4. 点击外部关闭 -- 外层 div 监听 onClick 关闭弹窗，内层 dialog div 用 stopPropagation() 阻止冒泡，确保点击对话框内部不会误关闭。

[文件用途] components/ui/search-dialog.tsx -- 搜索弹窗客户端组件，封装键盘快捷键、防抖搜索、键盘导航等完整交互逻辑。

```tsx
// components/ui/search-dialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/sanity/queries';

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        const result = results[selectedIndex];
        setOpen(false);
        setQuery('');
        router.push(
          `/${result.category.slug}/${result.project.slug}/${result.slug}`
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, router]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounce 搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSelectedIndex(-1);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="hover:text-zinc-900 transition-colors text-sm text-zinc-600"
        aria-label="搜索 (Ctrl+K)"
      >
        🔍
      </button>

      {/* 弹窗 */}
      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索文章..."
              className="w-full px-4 py-3 text-lg border-b outline-none"
            />

            {loading && (
              <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                搜索中...
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                没有找到相关文章
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-2">
                {results.map((result, i) => (
                  <button
                    key={result._id}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      i === selectedIndex ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                    }`}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                      router.push(
                        `/${result.category.slug}/${result.project.slug}/${result.slug}`
                      );
                    }}
                  >
                    <div className="font-medium text-sm">{result.title}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {result.category.title} &gt; {result.project.title}
                    </div>
                    {result.excerpt && (
                      <div className="text-xs text-zinc-500 mt-1 line-clamp-1">
                        {result.excerpt}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

三个 useEffect 的详细解析：

useEffect #1 -- 全局键盘事件（依赖：open, results, selectedIndex, router）
这是组件中最核心的 effect。它向 window 注册了一个全局 keydown 监听器，处理 5 种按键：
- Escape：关闭弹窗。无论弹窗是否打开都处理，让用户随时可以 Esc 退出。
- Ctrl+K / Meta+K：打开弹窗。e.preventDefault() 阻止浏览器默认行为（如 Chrome 的焦点跳转）。Meta 键兼容 Mac 的 Cmd 键。
- ArrowDown：如果弹窗已打开，selectedIndex 递增。`Math.min(prev + 1, results.length - 1)` 防止越界到数组末尾之后。
- ArrowUp：selectedIndex 递减。`Math.max(prev - 1, 0)` 防止越界到负数。
- Enter：如果弹窗已打开且有选中项（selectedIndex >= 0），执行导航。用 router.push() 做客户端路由跳转（不刷新页面），然后关闭弹窗、清空 query。
依赖数组包含 open / results / selectedIndex / router，因为这些变量在回调中被读取。如果省略某个依赖，回调会捕获到过期的闭包值（stale closure）——例如 open 变为 false 后，旧的回调仍认为 open 是 true。cleanup 函数在组件卸载或依赖变化时执行 removeEventListener，防止内存泄漏。

useEffect #2 -- 自动聚焦（依赖：open）
当 open 从 false 变为 true 时执行，用 ref 获取 input DOM 元素并调用 focus()。`?.` 可选链操作符安全处理 ref.current 为 null 的情况（组件首次渲染时 ref 尚未绑定）。为什么不在 useEffect #1 的 Ctrl+K 处理中直接 focus？因为 setOpen(true) 触发的状态更新是异步的，调用 setOpen 后立即 focus 可能获取不到尚未挂载的 input。单独的 useEffect 监听 open 变化，保证 focus 在 DOM 更新完成后执行。

useEffect #3 -- 防抖搜索（依赖：query）
这是实现 300ms 防抖的核心。流程：
1. 如果 query 为空/空白，直接清空 results 并 return，不发请求。
2. 否则设置 300ms 的 setTimeout，到期后执行 fetch。
3. fetch 开始前设置 loading = true、selectedIndex = -1（新搜索重置键盘导航位置）。
4. fetch 调用 /api/search?q=... 端点，拿到 JSON 后 setResults。
5. catch 捕获网络错误返回空数组（生产环境应至少 console.error 方便排查）。
6. finally 设置 loading = false。
7. cleanup 函数 `() => clearTimeout(timer)` 是防抖的关键：如果 query 在 300ms 内再次变化，前一个 timer 被取消，新 timer 启动。用户快速输入时，只有最后一次按键后 300ms 才会真正发请求。
为什么 selectedIndex 要在发请求时重置为 -1？因为新结果列表和旧列表长度不同，旧的 selectedIndex 指向的位置可能无效。

在 `SiteHeader` 中集成搜索（替换原来的非功能按钮）：

```tsx
// components/layout/site-header.tsx 顶部新增 import
import { SearchDialog } from '@/components/ui/search-dialog';

// nav 末尾原来的 <button>🔍</button> 替换为：
<SearchDialog />
```

`SearchDialog` 自带触发按钮（🔍 + Ctrl+K 提示），所以不需要额外的包裹。导入 `SearchDialog` 后，原先的无功能按钮直接替换即可。

---

### 2.5 RSS + Sitemap + SEO

#### 2.5.1 RSS Feed

[文件用途] app/feed.xml/route.ts -- RSS Feed 生成端点（Route Handler），从 Sanity 获取最新 20 篇博客文章，使用 `feed` 库生成 RSS 2.0 格式的 XML 响应。

[架构背景] RSS Feed 是博客的基础设施——它让读者可以通过 RSS 阅读器（如 Feedly、Inoreader、Reeder）订阅博客更新，而不需要每次打开网站。设计决策：
- **Route Handler 而非静态文件**：Feed 内容需要随文章发布动态更新，不能是手写的静态 XML。Next.js Route Handler（`route.ts`）在每次请求时执行 GET 函数生成最新 XML。
- **为什么只取最新 20 篇**：RSS 规范没有条目数上限，但 20 篇是约定俗成的"足够多"——覆盖几个月的内容，同时避免 XML 文件过大导致 RSS 阅读器解析缓慢。对于个人博客，20 篇的 RSS 文件大小通常在 50-100KB 之间。
- **`feed` 库 vs 手写 XML**：手写 XML 字符串拼接容易出错（特殊字符转义、CDATA 包裹、日期格式等），`feed` 库封装了 RSS 2.0 / Atom / JSON Feed 三种格式的生成逻辑，只需提供结构化数据即可。
- **跳过引用断裂的文章**：`if (!post.category?.slug || !post.project?.slug) continue` 是一个防御性守卫——如果 Sanity 中 blog 文档的 project 引用被删除，展开后的 `project` 为 null，`post.project.slug` 会抛 TypeError。跳过的代价是少一篇 RSS 条目，远比 RSS 生成崩溃强。
- **合集文章使用 4 段 URL**：属于合集的 blog 文章需要展开 `collection->slug.current`，根据是否存在 collection 动态选择 3 段 URL（`/cat/proj/post`）或 4 段 URL（`/cat/proj/col/post`），与站内链接保持一致，避免搜索引擎将同一内容索引为两个不同 URL。
- **错误处理**：GROQ 查询包裹在 try/catch 中，Sanity 不可达时返回 HTTP 503 + 最小可用 XML，RSS 阅读器遇到 503 会稍后重试而非放弃抓取。
- **环境变量回退**：`process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com'`——生产环境优先使用环境变量（方便本地测试时指向 localhost），回退到硬编码域名。

```bash
npm install feed@^5
```

```ts
// app/feed.xml/route.ts
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { Feed } from 'feed';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  try {
    const posts = await client.fetch(groq`
      *[_type == "blog"] | order(publishedAt desc) [0...20] {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        publishedAt,
        "project": project->{title, "slug": slug.current},
        "category": project->category->{"slug": slug.current},
        "collection": collection->{"slug": slug.current}
      }
    `);

    const feed = new Feed({
      title: 'iceaxing',
      description: 'iceaxing 的个人博客',
      id: siteUrl,
      link: siteUrl,
      language: 'zh',
      copyright: `All rights reserved ${new Date().getFullYear()}`,
      feedLinks: {
        rss2: `${siteUrl}/feed.xml`,
      },
    });

    for (const post of posts) {
      if (!post.category?.slug || !post.project?.slug) continue;

      const link = post.collection?.slug
        ? `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.collection.slug}/${post.slug}`
        : `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.slug}`;

      feed.addItem({
        title: post.title,
        id: post._id,
        link,
        description: post.excerpt || '',
        date: new Date(post.publishedAt),
      });
    }

    return new Response(feed.rss2(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>iceaxing</title><description>Temporarily unavailable</description></channel></rss>',
      {
        status: 503,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
```

逐行解读：
- `export async function GET()` -- Route Handler 的 GET 方法。访问 `/feed.xml` 时 Next.js 调用此函数，返回的 Response 对象直接发送给客户端。
- `const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com'` -- 获取站点 URL。回退值保证本地开发时 RSS 也能正常生成（只是链接指向生产域名）。
- `try { ... } catch { ... }` -- 包裹整个查询和 Feed 生成逻辑。Sanity 不可达时返回 HTTP 503 + 最小可用 XML，RSS 阅读器遇到 503 会稍后重试而非放弃抓取。
- `client.fetch(groq\`...\`)` -- 直接使用 Sanity client（而非 queries.ts 中的封装函数）执行 GROQ 查询。这里绕过了查询层封装，因为 Feed 的数据结构（顶级字段投影）与博客列表页不同，不值得单独写一个查询函数。
- `[0...20]` -- GROQ 切片语法，取排序后的前 20 条。等效于 SQL 的 `LIMIT 20`。
- `"slug": slug.current` -- GROQ 字段别名。slug 是 Sanity 的 slug 类型（含 `_type` 和 `current` 两个子字段），`"slug": slug.current` 将嵌套值提升到顶层，避免在代码中使用 `post.slug.current`。
- `"project": project->{...}` -- GROQ 引用展开（dereference）。`project->` 展开 reference 字段，获取被引用文档的字段。`{title, "slug": slug.current}` 只取需要的字段而非整个文档。
- `"category": project->category->{"slug": slug.current}` -- 两级引用展开：blog → project → category，最终拿到 category 的 slug。这种嵌套展开在 GROQ 中是合法的。
- `"collection": collection->{"slug": slug.current}` -- 展开 collection 引用。合集文章需要此字段来生成 4 段 URL（`/cat/proj/col/post`），不属合集的文章此值为 null。
- `const link = post.collection?.slug ? ... : ...` -- 根据是否有 collection 动态选择 3 段或 4 段 URL，确保与站内链接和 sitemap 的 URL 格式保持一致。避免同一文章在两个 URL 下被 RSS 阅读器视为两篇不同内容。
- `for (const post of posts)` -- 遍历查询结果，为每篇文章调用 `feed.addItem()`。
- `if (!post.category?.slug || !post.project?.slug) continue` -- 可选链守卫。`?.` 如果 category 为 null 则整个表达式返回 undefined（而非抛 TypeError），筛掉引用断裂的文章。这是防御性编程——RSS 生成不应因数据不一致而崩溃。
- `catch` 分支 -- 返回 HTTP 503 的占位 XML。选择 503（Service Unavailable）而非 500 是因为它明确表达"临时不可用，稍后重试"的语义，RSS 阅读器不会因此将 Feed 标记为已失效。
- `new Response(feed.rss2(), {...})` -- `feed.rss2()` 生成 RSS 2.0 格式的 XML 字符串，用 `new Response()` 构造 HTTP 响应。Content-Type 设置为 `application/xml` 确保浏览器和 RSS 阅读器正确解析。

#### 2.5.2 Sitemap

[文件用途] app/sitemap.xml/route.ts -- Sitemap 生成端点（Route Handler），合并静态页面路径 + Sanity 动态内容路径，生成符合 sitemap.org 规范的 XML SiteMap。

[架构背景] Sitemap 是 SEO 的基础设施——它告诉搜索引擎（Google、Bing 等）网站有哪些页面需要索引。设计决策：
- **静态 + 动态 URL 合并**：静态页面（首页、关于、友链、简介、日志入口）的路径写死在数组中，动态页面（blog 文章、log 详情、分类列表、项目列表）从 Sanity 查询获得。五组数据源通过 spread 运算符合并为一个 URL 数组后去重。
- **模板字符串拼 XML vs XML 库**：这里直接手写 XML 模板字符串，因为 sitemap XML 结构极其简单（只有 `<urlset>` + `<url>` + `<loc>` + `<changefreq>` + `<priority>`）。引入 XML 库（如 xmlbuilder）反而增加依赖和构建体积，收益不大。对于需要 CDATA 或命名空间的复杂 XML 场景，才值得上库。
- **priority 策略**：首页 `1.0`（最高优先级），其他页面 `0.7`。这是 Google 建议的——首页通常是搜索结果中应该展示的主要页面，内页权重降低。
- **changefreq = weekly**：所有页面统一标记为每周更新。虽然不太精确（有的页面可能几个月不变），但搜索引擎主要依据实际抓取频率而非此字段，所以不需要精确区分。
- **URL 去重**：`[...new Set(urls)]` 消除重复 URL。合集文章在 blog 查询和 collection 查询中都可能产生相同的 4 段 URL（`/cat/proj/col/post`），不去重会导致 sitemap 中出现重复 `<url>` 条目，浪费爬虫抓取配额。
- **错误处理**：`try/catch` 包裹全部查询，Sanity 不可达时返回 HTTP 503 + 空 `<urlset>`。搜索引擎遇到 503 会保留已有索引并在下次抓取时重试，而非删除所有 URL。
- **为什么也是 Route Handler 而非 `generateSitemap()`**：Next.js 内置的 `sitemap.ts` 约定文件也可以生成 sitemap，但这里用 Route Handler 是刻意保持与 RSS Feed 一致的实现模式（手写 XML 字符串 + `new Response()`），降低认知负担——两个 SEO 端点用同一种模式。

```ts
// app/sitemap.xml/route.ts
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  try {
    const staticPages = ['', '/about', '/friends', '/profile', '/log'];

    const [blogs, logs, categories, projects, collections] = await Promise.all([
      client.fetch(groq`
        *[_type == "blog"] {
          "slug": slug.current,
          "project": project->slug.current,
          "category": project->category->slug.current,
          "collection": collection->slug.current
        }
      `),
      client.fetch(groq`
        *[_type == "log"] { "slug": slug.current }
      `),
      client.fetch(groq`
        *[_type == "category"] { "slug": slug.current }
      `),
      client.fetch(groq`
        *[_type == "project"] {
          "slug": slug.current,
          "category": category->slug.current
        }
      `),
      client.fetch(groq`
        *[_type == "collection"] {
          "slug": slug.current,
          "project": project->slug.current,
          "category": project->category->slug.current
        }
      `),
    ]);

    const urls = [
      ...staticPages.map((path) => `${siteUrl}${path}`),
      ...categories.map(
        (c: any) => `${siteUrl}/${c.slug}`
      ),
      ...projects
        .filter((p: any) => p.category)
        .map(
          (p: any) => `${siteUrl}/${p.category}/${p.slug}`
        ),
      ...collections
        .filter((c: any) => c.category && c.project)
        .map(
          (c: any) => `${siteUrl}/${c.category}/${c.project}/${c.slug}`
        ),
      ...blogs
        .filter((b: any) => b.category && b.project)
        .map((b: any) => {
          if (b.collection) {
            return `${siteUrl}/${b.category}/${b.project}/${b.collection}/${b.slug}`;
          }
          return `${siteUrl}/${b.category}/${b.project}/${b.slug}`;
        }),
      ...logs.map(
        (l: any) => `${siteUrl}/log/${l.slug}`
      ),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(urls)]
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === siteUrl ? '1.0' : '0.7'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 503,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
```

逐行解读：
- `export async function GET()` -- Route Handler。访问 `/sitemap.xml` 时被调用。与 RSS Feed 使用完全相同的函数签名模式。
- `try { ... } catch { ... }` -- 包裹全部查询，Sanity 不可达时返回 HTTP 503 + 空 `<urlset>`。搜索引擎遇到 503 保留已有索引，下次抓取时重试。
- `const staticPages = ['', '/about', '/friends', '/profile', '/log']` -- 静态路径列表。空字符串 `''` 对应首页（`siteUrl + ''` = `https://iceaxing.com`），其余是独立页面路径。新增页面时需要在此数组中添加对应路径。
- `Promise.all([...])` -- 五组 GROQ 查询并行执行，而非串行 await。每个查询独立、无依赖关系，并行执行将总等待时间从 `T1+T2+T3+T4+T5` 压缩到 `max(T1..T5)`。
- `*[_type == "blog"]` -- GROQ 查询所有 blog 文档。这里没有 `[0...n]` 切片限制——sitemap 需要包含**所有**文章，而非像 RSS 那样只取最新 20 篇。
- `"collection": collection->slug.current` -- 展开 collection 引用。用于生成合集文章的 4 段 URL。
- `*[_type == "category"]` / `*[_type == "project"]` / `*[_type == "collection"]` -- 查询分类、项目、合集列表页 URL。这些页面之前被遗漏在 sitemap 之外，搜索引擎只能通过内链发现它们，不可靠。
- `.filter((b: any) => b.category && b.project)` -- 过滤引用断裂的 blog 文档。与 RSS 的策略一致——跳过而非崩溃。`any` 类型标注是因为 GROQ 查询返回的是未类型化的 JSON。
- 合集文章的条件 URL -- `if (b.collection)` 动态选择 3 段或 4 段 URL，与 RSS Feed 和站内链接保持一致。
- `[...new Set(urls)]` -- 去重。合集文章 URL 可能从 blog 查询和 collection 查询中产生重复条目，`Set` 构造器消除重复，避免 sitemap 中出现同一 `<loc>`。
- `const sitemap = \`<?xml version="1.0" encoding="UTF-8"?>...\`` -- 手写 XML 模板字符串。`${urls.map(...).join('\n')}` 将 URL 数组转换为多个 `<url>` 元素的拼接。注意这里是 JS 模板字符串嵌套 `map().join()` 的写法。
- `<loc>${url}</loc>` -- 页面完整 URL。搜索引擎根据此 URL 抓取页面内容。
- `<changefreq>weekly</changefreq>` -- 页面更新频率提示。搜索引擎主要依据实际抓取历史而非此值，但提供它不会有坏处。
- `<priority>${url === siteUrl ? '1.0' : '0.7'}</priority>` -- 首页优先。1.0 是最高优先级（0.0-1.0），告诉搜索引擎"如果资源有限，优先抓取首页"。
- `catch` 分支 -- 返回 HTTP 503 + 空 `<urlset>`。空 sitemap 比无响应好——搜索引擎不会因此删除已有索引中的 URL。
- `return new Response(sitemap, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })` -- 与 RSS 完全相同的 Response 构造模式。`charset=utf-8` 确保中文 URL 被正确编码。

#### 2.5.3 robots.txt

[文件用途] app/robots.txt/route.ts -- 网站爬虫协议文件，告诉搜索引擎哪些路径可以抓取、Sitemap 文件位置。

[架构背景] robots.txt 选择了动态 Route Handler 而非 `public/` 静态文件。最初考虑过静态文件方案（内容永远不变、零运行时开销），但发现一个问题：Vercel 预览部署（preview deployment）的 robots.txt 会硬编码生产域名，导致预览环境被意外索引时 sitemap 指向错误的域名。改用 Route Handler 后，`NEXT_PUBLIC_SITE_URL` 环境变量可在不同部署环境中指向正确的域名。

```ts
// app/robots.txt/route.ts
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  const body = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
```

#### 2.5.4 SEO Metadata（每个页面已有 `generateMetadata`）

[架构背景] SEO Metadata 采用的是 Next.js App Router 的约定式导出模式，而非集中式配置。每个 `page.tsx` 独立导出自己的 `metadata` 或 `generateMetadata`，框架在构建时自动收集并注入 `<head>`。

这种"去中心化"的元数据策略有两个优势：
1. **就近维护**：页面与它的 SEO 信息在同一文件中，修改页面内容时不会忘记更新标题和描述。
2. **动态 vs 静态**：内容不变的页面（如关于页、友链页）用静态 `export const metadata`，内容动态的页面（如 Blog 正文页）用 `generateMetadata({ params })` 异步函数，后者可以基于路由参数查询 Sanity 获取文章标题、摘要等信息。

Blog 正文页的 SEO 在 1.6.3 中已实现（通过 `generateMetadata` 动态生成文章专属的 title、description、OpenGraph）。

**需要确认所有页面都有 metadata**：

| 页面 | 类型 | 状态 |
|------|------|------|
| 首页 `/` | static `metadata` | `title` + `description` |
| 分类列表 `/[category]` | `generateMetadata` | title + description（来自 Sanity） |
| 项目列表 `/[category]/[project]` | `generateMetadata` | title + description（来自 Sanity） |
| Blog 正文 | `generateMetadata` | title + description + OpenGraph |
| 合集列表（catch-all fallback） | `generateMetadata` | title + description |
| 关于 `/about` | static `metadata` | title + description |
| 友链 `/friends` | static `metadata` | title + description |
| 日志列表 `/log` | static `metadata` | title + description |
| 日志详情 `/log/[slug]` | `generateMetadata` | title + description（来自 Sanity） |
| 个人简介 `/profile` | static `metadata` | title + description |

**`description` 是 SEO 的关键字段**——搜索引擎在搜索结果中展示它作为页面摘要。缺少 description 的页面会被搜索引擎自行从正文中截取片段，通常效果很差。所有静态页面都需要至少一个 `description` 字段，动态页面从 Sanity 数据中获取。

---

### 2.6 ISR Webhook + 错误处理

#### 2.6.1 Webhook Route

**[文件用途]** `app/api/revalidate/route.ts` 接收 Sanity CMS 的内容变更通知，按文档类型精确刷新受影响的静态页面缓存，使内容更新无需全站重新构建即可对用户可见。

[架构背景] ISR（Incremental Static Regeneration，增量静态再生）是 Next.js 的核心特性：页面在首次请求时生成静态 HTML 并缓存，后续请求直接返回缓存；当内容变更时，通过 `revalidatePath()` 主动使缓存失效，下一次请求触发后台重新生成。这个 Webhook Route 正是缓存失效的触发器。

三个关键设计决策：
1. **Secret 校验**：通过 `x-sanity-webhook-secret` 请求头 + `crypto.timingSafeEqual()` 常量时间比较验证请求来源。使用 `timingSafeEqual` 而非 `!==` 的原因是：字符串不等比较会逐字符短路，攻击者可以通过测量响应时间逐字节猜解 secret（时序攻击）。`timingSafeEqual` 总是遍历完整 buffer 长度，杜绝此攻击面。
2. **Layout 级 revalidation**：blog/category/project 变更使用 `revalidatePath('/', 'layout')` 而非仅 `revalidatePath('/')`。原因是——blog 修改会影响首页、分类列表、项目列表、文章正文等多个路由段（每个都有独立的缓存）。只刷新首页会导致其他页面的缓存残留，用户看到旧内容。layout 级刷新会清除该路由下所有页面和 layout 的缓存，确保全站一致。
3. **类型守卫 + 白名单**：对 `body._type` 做类型检查（`typeof body._type !== 'string'`）后再进入 switch，未知类型返回 400 而非静默返回 200。webhook 配置错误时不会产生"已处理但实际没做任何事"的假成功。

```ts
// app/api/revalidate/route.ts
import { timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const SAFE_COMPARE_LENGTH = 64;

function safeCompare(a: string, b: string): boolean {
  // 将两个 buffer 填充到相同长度，避免长度检查泄露 secret 长度信息
  const bufA = Buffer.alloc(SAFE_COMPARE_LENGTH, a);
  const bufB = Buffer.alloc(SAFE_COMPARE_LENGTH, b);
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-sanity-webhook-secret');
  const expectedSecret = process.env.SANITY_WEBHOOK_SECRET;

  if (!secret || !expectedSecret) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!safeCompare(secret, expectedSecret)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body._type !== 'string') {
      return NextResponse.json(
        { message: 'Invalid webhook payload: missing _type' },
        { status: 400 }
      );
    }

    const { _type } = body;

    switch (_type) {
      case 'blog':
      case 'category':
      case 'project':
        // 使用 layout 级 revalidation：这些类型的变更影响多个路由段
        revalidatePath('/', 'layout');
        break;

      case 'log':
        // layout 级：同时刷新 /log 列表和 /log/[slug] 详情
        revalidatePath('/log', 'layout');
        break;

      case 'friend':
        revalidatePath('/friends', 'layout');
        break;

      case 'profile':
        revalidatePath('/profile', 'layout');
        break;

      default:
        console.warn('[revalidate] Unknown document type:', _type);
        return NextResponse.json(
          { message: `Unknown document type: ${_type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      { message: 'Error revalidating' },
      { status: 500 }
    );
  }
}
```

逐行解读：
1. `import { timingSafeEqual } from 'crypto'` — Node.js 内置的常量时间字符串比较。与 `!==` 不同，它遍历完整 buffer 长度而不在第一个不同字符处短路，杜绝时序攻击
2. `import { revalidatePath } from 'next/cache'` — Next.js 缓存失效 API，传入路径即可标记缓存"过期"，下次访问自动触发后台重新生成
3. `safeCompare()` — 将两个 secret 填充到 64 字节的 buffer 后做常量时间比较。`Buffer.alloc(64, str)` 把字符串写入 buffer 前 64 字节，超出部分补零。保证无论输入长度如何，比较的 buffer 长度始终为 64，不泄露 secret 长度信息
4. `export async function POST()` — 只接受 POST 请求，防止 GET 误触发。Next.js 中导出的 HTTP 方法名决定 Route 处理哪些请求方法
5. `if (!secret || !expectedSecret)` — 任一为假值（null/undefined/空字符串）直接返回 401。这同时处理了 header 缺失和环境变量未配置的情况
6. `if (!safeCompare(secret, expectedSecret))` — 常量时间比较。不匹配返回 401，与上面的空值检查返回相同的错误信息，不给攻击者区分"secret 缺失"和"secret 错误"的能力
7. `if (!body || typeof body._type !== 'string')` — 类型守卫。防止 body 为 null、数组或缺少 `_type` 字段时进入 switch。返回 400（Bad Request）而非 401（Unauthorized）——secret 已通过，但 payload 格式错误
8. `case 'blog': case 'category': case 'project':` — 这三种类型的变更影响全站（首页、分类列表、项目列表、文章正文），使用 `revalidatePath('/', 'layout')` 刷新所有共享根 layout 的页面
9. `revalidatePath('/', 'layout')` — layout 级刷新。`'layout'` 参数告诉 Next.js 不仅使该路径的 page 缓存失效，还要使该路由段的所有 layout 缓存失效。路径 `/` 的 layout 是根 layout，因此这会刷新整个应用的所有页面
10. `case 'log': revalidatePath('/log', 'layout')` — layout 级刷新，同时影响 `/log` 列表页和 `/log/[slug]` 详情页
11. `default: console.warn(...)` — 未知文档类型返回 400 + 明确的消息。如果 webhook filter 配置错误（如新增了文档类型但未添加对应的 case），Sanity 会收到明确的错误消息，方便排查
12. `return NextResponse.json({ revalidated: true, now: Date.now() })` — 返回成功响应，附带时间戳方便在 Webhook 日志中查看触发时间
13. `catch (error) { console.error(...) }` — 服务端日志记录。`console.error` 在 Vercel 上会被捕获并显示在 Functions 日志中，便于排查。**不**将 `String(error)` 返回给客户端——防止泄露内部路径、库名称等敏感信息

[关联说明] 此 Route 依赖 `SANITY_WEBHOOK_SECRET` 环境变量（在 `lib/env.ts` 中作为可选变量校验，缺失时打印警告而非崩溃）。Phase 2 邮件通知逻辑将在 `case 'blog'` 分支中追加（见 3.1.4）。

#### 2.6.2 配置 Sanity Webhook

[架构背景] Sanity Webhook 在文档变更（Create/Update/Delete）时向指定 URL 发送 POST 请求。Filter 表达式 `_type in [...]` 确保只触发博客相关文档类型，避免不相关的变更产生无意义请求。Delete 事件也需监听，否则已删除内容的缓存残留会导致 404。

1. Sanity 项目 → API → Webhooks → Create
2. **URL**：`https://iceaxing.com/api/revalidate`
3. **Secret**：你的 `SANITY_WEBHOOK_SECRET`
4. **Header**：自动添加 `x-sanity-webhook-secret`
5. **Trigger on**：Create、Update、Delete
6. **Filter**：`_type in ["blog", "category", "project", "log", "friend", "profile"]`

#### 2.6.3 Error Boundary

**[文件用途]** `app/error.tsx` 是 Next.js App Router 的错误边界组件。当页面组件或嵌套的 Server/Client Component 在渲染过程中抛出未捕获错误时，Next.js 自动渲染此组件替代出错页面，防止整个应用白屏崩溃。

[架构背景] Next.js 通过文件命名约定实现错误边界：`error.tsx` 必须放在对应路由目录下（或父级目录），且必须是 Client Component（`'use client'`），因为它接收来自 React Error Boundary 的两个关键 props：

- `error` — 被捕获的 Error 对象。Next.js 在 production 环境下会为每个错误生成一个 `digest` 字段（错误哈希），用于在服务端日志中追踪具体错误。
- `reset` — 一个函数，调用它会尝试重新渲染出错的路由段。这相当于对用户说"再试一次"——React 会丢弃出错时的组件树状态，从头重新渲染。注意 `reset` 不会恢复全局状态（如 Redux store），只恢复组件树。

`error.tsx` 只捕获其所在路由段及其子段的错误。如果需要在 Layout 中也能捕获错误，需要额外在同一目录放一个 `global-error.tsx`（但通常不需要，因为 Layout 的错误极少见）。

```tsx
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error-boundary]', error.digest, error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h2 className="text-xl font-bold mb-2">内容暂时不可用</h2>
      <p className="text-zinc-500 mb-4">请稍后重试</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
```

逐行解读：
1. `'use client'` — 声明为客户端组件。Error Boundary 必须有这一行，因为 `reset` 函数需要浏览器事件处理（`onClick`），不能在服务端运行
2. `useEffect(() => { console.error(...) }, [error])` — 将 `error.digest` 输出到浏览器控制台。`digest` 是 Next.js 在 production 下为每个错误生成的哈希值，与 Vercel 服务端日志中的错误一一对应。当用户报告错误时，开发者可以通过 digest 在日志中精确定位
3. `error: Error & { digest?: string }` — TypeScript 交叉类型：标准 Error 对象 + Next.js 专有的可选 `digest` 字段
4. `reset: () => void` — 函数类型 prop，由 Next.js 自动注入。调用它会触发重新渲染，相当于 React 的"再试一次"机制
5. `className="max-w-2xl mx-auto px-4 py-20 text-center"` — 与 404 页面相同的居中布局，保持视觉一致性
6. `<h2>内容暂时不可用</h2>` — 用户友好的错误提示，不暴露技术细节（如错误堆栈）。这是最佳实践——production 环境绝不应向用户展示原始 error.message
7. `<button onClick={reset}>` — 点击调用 `reset` 重新渲染。如果错误是暂时的（如网络波动导致数据获取失败），重试很可能会成功

#### 2.6.4 Empty State 组件

**[文件用途]** `components/ui/empty-state.tsx` 是一个通用的空状态占位组件，接收一条提示消息并在页面居中展示。当 Sanity 查询返回空数组时（如某分类下暂无文章），用此组件替代空白区域，给用户明确的反馈。

```tsx
// components/ui/empty-state.tsx
import type { ReactNode } from 'react';

interface Props {
  message: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ message, children, className }: Props) {
  return (
    <div className={`text-center py-20 text-zinc-400 ${className || ''}`}>
      <p>{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
```

- `children?: ReactNode` — 可选的子元素插槽。当空状态需要附带操作按钮时（如"创建第一篇文章"），调用方可以传入 `<Link>` 或 `<button>`，无需修改本组件
- `className?: string` — 可选的额外样式类。允许调用方覆盖外层 div 的样式（如调整 padding 或文字大小），与 Tailwind 的工具类模式兼容

各页面中已将内联空状态 div 替换为 `<EmptyState message="..." />`。

---

### 2.7 响应式 + 404

#### 2.7.1 404 页面

[文件用途] `app/not-found.tsx` 是 Next.js 约定的 404 页面。当访问不存在的路由或组件调用 `notFound()` 时自动渲染。无需任何路由配置，文件名即约定。

```tsx
// app/not-found.tsx
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      {/* 像素风迷路小人 SVG（Phase 1 用简单 CSS 替代） */}
      <div className="text-6xl mb-4">🧭</div>
      <h1 className="text-2xl font-bold mb-2">这里什么都没有……</h1>
      <p className="text-zinc-500 mb-6">
        你似乎走到了一个不存在的地方
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800 transition-colors"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
```

逐行解读：
1. `import Link from 'next/link'` — Next.js 内置的客户端路由链接组件，提供 SPA 式的无刷新页面跳转和预加载（prefetch）能力
2. `export default function NotFoundPage()` — 文件名 `not-found.tsx` 是 Next.js 的约定。当路由不匹配或组件调用 `notFound()` 时，框架自动渲染此页面。无需在路由配置中声明
3. `<div className="text-6xl mb-4">🧭</div>` — 指南针 emoji 作为"迷路"的视觉隐喻。Phase 3 将替换为像素风 SVG 动画
4. `<h1>这里什么都没有……</h1>` — 用中文口语化表达而非冰冷的技术术语，符合博客的亲切调性
5. `<p>你似乎走到了一个不存在的地方</p>` — 用第二人称"你"与读者建立直接对话感，而非"404 Not Found"
6. `<Link href="/" className="px-4 py-2 bg-zinc-900 text-white ...">` — 返回首页按钮，使用 Next.js `<Link>` 而非 `<a>`，享受客户端路由的性能优势（无需完整页面刷新）

[关联说明] 在数据查询组件中，当 `getBlogBySlug()` 或类似函数返回 `null` 时，调用 `notFound()` 即可触发此页面渲染（而非手动返回 404 JSX）。见 1.6.3 中 `if (!post) notFound()` 的用法。

#### 2.7.2 响应式检查清单

[架构背景] Tailwind CSS 的响应式方案基于 **Mobile First** 策略：所有不加前缀的类作用在全部屏幕尺寸，加 `sm:` / `md:` / `lg:` / `xl:` 前缀的类仅在对应断点及以上生效。这意味着写 `className="text-sm md:text-base"` 表示小屏用小字号、中屏及以上用正常字号——小屏是默认，大屏是覆盖。

这个检查清单中的四个断点覆盖了博客 95% 以上的访问设备（根据 Web 流量统计，手机 + 平板约占 55-65%）。375px 是 iPhone SE（最小的现代智能手机），如果在这个宽度下布局不崩溃，其他手机基本不会有问题。

| 断点 | 宽度 | 需要确认 |
|------|------|---------|
| 手机 | 375px (iPhone SE) | 正文可读、代码块横向滚动、表格不超出屏幕 |
| 手机 | 390px (iPhone 14) | 导航不折行或已收为汉堡菜单 |
| 平板 | 768px (iPad) | 两列 grid 正常、首页静态图居中 |
| 桌面 | 1440px | 最大宽度不无限制扩展（`max-w-4xl` 约束） |

**需要微调的点：**
- `SiteHeader` 在窄屏上改为汉堡菜单（2.7.3 已实现）
- 代码块 `<pre>` 加 `overflow-x-auto`（code-block.tsx 中已完成）
- 思维导图 SVG 在移动端 `max-sm:h-[250px]`（mindmap.tsx 中已完成）
- PDF iframe 在移动端 `max-sm:h-[400px]`（pdf-embed.tsx 中已完成）

#### 2.7.3 移动端导航（汉堡菜单）

[文件用途] `components/layout/mobile-nav.tsx` 是移动端汉堡菜单组件。在 `sm` 断点以下显示汉堡图标，点击展开全屏下拉导航面板。

[架构背景] 这个组件展示了 Next.js App Router 中 **Client Component 的最小化原则**：仅在需要交互的部分使用 `'use client'`，其余保持 Server Component。导航数据（`categories`）由父级 Server Component（`SiteHeader`）异步获取后通过 props 传入，`MobileNav` 本身只负责交互状态管理。

设计要点：
- **`sm:hidden`** 是 Tailwind 断点关键：在 `sm`（640px）及以上断点，按钮和下拉面板都隐藏（`display: none`），桌面端使用 `hidden sm:flex` 包裹的完整导航。这样可以避免服务端渲染多余的 DOM，减少首次 HTML 体积。
- **`onClick={() => setOpen(false)}`** 在每个链接点击时关闭菜单，确保用户选择导航目标后面板立即收起——这种 UX 细节容易被忽略但影响体验。
- **`useState(false)` + 条件渲染**（`{open && (...)}`）是最简单的 toggle 模式，不需要 useEffect、不需要 DOM ref、不需要第三方库，适合博客这种低复杂度场景。

```tsx
// components/layout/mobile-nav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CategoryDoc } from '@/lib/sanity/types';

interface Props {
  categories: CategoryDoc[];
}

export function MobileNav({ categories }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="sm:hidden text-lg"
        aria-label="菜单"
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg py-4 px-4">
          <nav className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-zinc-400">分类</div>
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="text-sm hover:text-zinc-900 transition-colors"
              >
                {cat.title}
              </Link>
            ))}
            <hr />
            <Link href="/log" onClick={() => setOpen(false)} className="text-sm">日志</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="text-sm">关于</Link>
            <Link href="/friends" onClick={() => setOpen(false)} className="text-sm">友链</Link>
          </nav>
        </div>
      )}
    </>
  );
}
```

逐行解读：
1. `'use client'` — 标记为客户端组件，允许使用 `useState` 和浏览器事件处理。这是最小化边界的例子：只有 `MobileNav` 需要客户端渲染，父级 `SiteHeader` 仍是 Server Component
2. `import { useState } from 'react'` — React 的状态 Hook。这里只需要一个布尔值 `open`，不需要 `useEffect`、`useRef` 等更复杂的 Hook
3. `interface Props { categories: CategoryDoc[] }` — 只接收一个 prop：分类列表。数据由父组件（Server Component）获取并传入，MobileNav 不关心数据来源
4. `const [open, setOpen] = useState(false)` — 初始状态为 `false`（关闭）。页面首次加载时菜单是收起的，减少不必要的渲染
5. `<button onClick={() => setOpen(!open)} className="sm:hidden">` — 切换按钮。`sm:hidden` 确保在 640px 以上隐藏——桌面端不需要汉堡菜单
6. `aria-label="菜单"` — 无障碍标签，屏幕阅读器会读出"菜单按钮"，而非无意义的"✕"或"☰"字符
7. `{open ? '✕' : '☰'}` — 状态驱动的图标切换：关闭时显示三条横线（☰），打开时显示叉号（✕），这是常见的 UI 约定
8. `{open && (<div className="sm:hidden absolute top-full ...">)}` — 条件渲染下拉面板。`absolute top-full` 让面板出现在按钮正下方。`open` 为 false 时 React 完全从 DOM 中移除（不是隐藏），避免无意义的渲染开销
9. `{categories.map((cat) => (...))}` — 将 `categories` prop 动态渲染为导航链接列表。链接 URL 使用 `cat.slug` 构建，符合三级路由结构
10. `<Link onClick={() => setOpen(false)}>` — 每个链接点击后关闭菜单。`Link` 是 Next.js 客户端路由组件，`onClick` 在跳转前先执行关闭逻辑
11. `className="text-sm hover:text-zinc-900 transition-colors"` — 链接悬停效果：从默认文本色过渡到深灰色，`transition-colors` 让颜色变化有 150ms 的平滑过渡

在 `SiteHeader` 中引入：

```tsx
// components/layout/site-header.tsx 完整结构
import { MobileNav } from './mobile-nav';

// 桌面导航包裹在 hidden sm:flex 中 —— 移动端隐藏
<nav className="hidden sm:flex items-center gap-4 ...">
  {/* 分类下拉 + 日志/关于/友链链接 + SearchDialog */}
</nav>

// 移动端容器 —— 桌面端隐藏，relative 为下拉面板提供定位参考
<div className="relative flex items-center gap-2 sm:hidden">
  <SearchDialog />
  <MobileNav categories={categories} />
</div>
```

- `hidden sm:flex` — 桌面导航在 640px 以下隐藏，640px 及以上显示为 flex
- `relative` — 移动端容器必须有 `position: relative`，否则 `MobileNav` 的下拉面板 `absolute top-full` 会向上寻找最近的定位祖先（可能跳到 header），位置不可预测
- `sm:hidden` — 移动端容器在 640px 及以上隐藏

---

### 2.8 环境变量校验 + 图片优化

[架构背景] 本节将两个看似不相关但性质相似的主题合并：它们都是在 Phase 1b 收尾阶段对已有代码的"固化"——把隐性经验和临时做法提炼为显式规则：

- **环境变量校验**（已在 1.3.5 实现）——在构建时（`next build`）校验 `SANITY_API_READ_TOKEN` 等必需变量是否存在，缺失则立即失败并给出明确错误信息。这比部署后访问网站才发现"白屏"要高效得多。关键原则：**fail fast at build time**，而非 fail silently at runtime。
- **图片优化策略**——Sanity 的 `@sanity/image-url` 工具可以在图片 URL 上添加查询参数（width、format、quality），由 Sanity CDN 动态处理图片。将所有 `urlFor()` 调用集中在 Server Component 中有两个好处：① 避免在客户端暴露 Sanity 项目配置细节；② 图片尺寸在服务端确定，客户端无需根据 viewport 动态计算。

环境变量校验已在 1.3.5 完成。图片优化策略：

**规则固化：**

| 场景 | urlFor 参数 | 
|------|-----------|
| 正文图片 | `.width(1200).format('webp').auto('format')` |
| 卡片缩略图 | `.width(600).format('webp')` |
| 头像 | `.width(96).height(96).format('webp')` |

**不在客户端拼接 URL 参数**——所有 `urlFor()` 调用发生在 Server Component 中。

---

### 2.9 Phase 3 预留

#### 2.9.1 Manor Navigation Bar 占位

```tsx
// components/manor/navigation-bar.tsx
// Phase 1b: 仅占位，不做任何渲染
export function ManorNavigationBar() {
  return null; // Phase 3 激活
}
```

在 `app/layout.tsx` 中需要此组件的位置预留 import，但不实际渲染。Phase 3 时去掉 `hidden`。

#### 2.9.2 Manor Config API 空端点

```ts
// app/api/manor/config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    buildings: [],
    npcs: [],
    farmField: null,
  });
}
```

#### 2.9.3 首页组件拆分

Phase 1b 结束时，将 1.5 的首页内容从 `app/page.tsx` 抽离为独立组件，为 Phase 3 替换做准备：

```tsx
// components/home/static-homepage.tsx
import { getAllCategories } from '@/lib/sanity/queries';
import Link from 'next/link';

export async function StaticHomePage() {
  const categories = await getAllCategories();

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <img
        src="/assets/manor-under-construction.png"
        alt="庄园建设中"
        className="mx-auto mb-8 w-64 h-64"
        style={{ imageRendering: 'pixelated' }}
      />
      <h1 className="text-2xl font-bold mb-4">庄园正在建设中……</h1>
      <p className="text-zinc-500 mb-8">欢迎来到 iceaxing 的数字花园</p>
      <nav className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/${cat.slug}`}
            className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
          >
            {cat.title}
          </Link>
        ))}
        {/* ... 其他入口链接同 1.5 ... */}
      </nav>
    </div>
  );
}
```

然后修改 `app/page.tsx` 为一个薄壳：

```tsx
// app/page.tsx
import { StaticHomePage } from '@/components/home/static-homepage';

export default function HomePage() {
  return <StaticHomePage />;
}

// ═══ Phase 3 替换： ═══
// import { ManorOrFallback } from '@/components/manor/manor-or-fallback';
// export default function HomePage() {
//   return <ManorOrFallback />;
// }
```

---

## 三、Phase 2：互动系统

> 目标：订阅可用、Collection UI 激活、英文版上线、数据备份运行。

### 3.1 订阅系统（Resend Contacts API）

#### 3.1.1 Rate Limit 工具

**概念说明——内存限流（In-Memory Rate Limiting）**

此方案使用 `Map` 结构在 Node.js 进程内存中追踪每个客户端的请求计数，实现**滑动窗口算法（Sliding Window）**：

- **数据结构**：`Map<string, { count: number; resetAt: number }>`，key 为客户端标识（IP 地址），value 为当前窗口内的请求次数和窗口重置时间。
- **算法逻辑**：每次请求时，先检查当前时间是否已超过 `resetAt`——若已超过则重置计数开启新窗口，若未超过且计数已达上限则拒绝请求。
- **适用场景**：单实例部署（Vercel Serverless 冷启动会丢失 Map 状态）。对于个人博客，防恶意爬虫和刷订阅完全够用；多实例高流量场景需改用 Redis 或 Upstash。
- **为什么不用 Redis**：Phase 2 的订阅量预计极低（个位数/天），引入 Redis 会增加成本（Upstash 最低 $0.2/月）和复杂度，不值得。若未来日订阅量超过 100，再考虑迁移。

**[文件用途]** `lib/rate-limit.ts`——内存限流工具，订阅接口调用前做频率校验，防止邮箱 API 被滥用。

```ts
// lib/rate-limit.ts
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `const rateMap = new Map<...>()` | 模块级 Map，进程存活期间持久化。key 为客户端标识（IP），value 包含当前窗口计数 `count` 和重置时间 `resetAt` |
| `const now = Date.now()` | 获取当前毫秒级时间戳，用于比较窗口是否过期 |
| `if (!entry \|\| now > entry.resetAt)` | 两种情况进入新窗口：① 首次请求（无记录）② 当前时间已超过窗口重置时间 |
| `rateMap.set(key, { count: 1, resetAt: now + windowMs })` | 初始化/重置窗口：计数从 1 开始，resetAt 设为 now + windowMs |
| `if (entry.count >= limit) return false` | 窗口内计数已达上限，拒绝本次请求 |
| `entry.count++` | 窗口内计数加 1，放行请求 |

---

#### 3.1.2 Subscribe API Route

**概念说明——订阅流程**

整个订阅流程是一个多步骤的服务器端操作，Resend 提供了基础设施（联系人管理 + 邮件发送），我们只需实现输入端逻辑：

1. **Rate Check**：调用 `checkRateLimit()` 校验该 IP 是否在窗口内超限，超限返回 429。这一步防止恶意脚本批量提交垃圾邮箱。
2. **Validate Email**：检查邮箱格式（`includes('@')`）。Resend 服务端会做完整校验，但前端过滤可以减少无效 API 调用。
3. **Extract Subscription Preferences**：从请求体中解析 `subscriptions: string[]` 数组，过滤非字符串元素后 join 为逗号分隔字符串（如 `"category:tech,project:blog"`）。
4. **Resend `contacts.create()`**：将邮箱和订阅偏好写入 Resend 联系人列表。`properties.subscriptions` 存储偏好字符串；`segments` 将联系人归入指定分组。Resend v6 中 `audienceId` 参数已废弃。
5. **Duplicate Handling**：若邮箱已存在（422），走 `contacts.update()` 更新其偏好设置，而非报错——允许用户修改订阅范围。
6. **Send Confirmation Email**：使用 `@react-email/components` 渲染的自定义确认邮件模板，根据用户语言发送中文或英文版本。邮件中列出已选择的订阅范围。
7. **Double Opt-In**：Resend 默认开启双重确认——用户提交邮箱后，SDK 会自动发送确认邮件。只有点击确认链接后，联系人才变为 "subscribed" 状态。

> **为什么用 Resend 而不是自建订阅表**：自建需要处理邮件发送、退订链接、确认流程、状态管理——每一项都是坑。Resend 的 free tier 每月 1000 封邮件，个人博客足够；contacts.create() 自动处理 double opt-in 和 GDPR 合规，省下大量开发时间。

**[文件用途]** `app/api/subscribe/route.ts`——订阅接口的 POST handler，处理邮箱提交、Rate Limit 校验、调用 Resend 创建联系人并存储订阅偏好。

```bash
npm install resend@^6
```

```ts
// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limit';
import { ConfirmSubscriptionEmail } from '@/lib/email/templates/confirm-subscription';

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[subscribe] RESEND_API_KEY is not configured');
    return NextResponse.json(
      { success: false, message: '订阅服务暂未配置' },
      { status: 500 }
    );
  }

  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!segmentId) {
    console.error('[subscribe] RESEND_SEGMENT_ID is not configured');
    return NextResponse.json(
      { success: false, message: '订阅服务暂未配置' },
      { status: 500 }
    );
  }

  // Rate limit: 每 IP 每分钟最多 3 次
  const forwarded = request.headers.get('x-forwarded-for') || 'unknown';
  const ip = forwarded.split(',')[0].trim();
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json(
      { success: false, message: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const locale: 'zh' | 'en' = body.locale === 'en' ? 'en' : 'zh';
    const subscriptions: string[] =
      Array.isArray(body.subscriptions) ? body.subscriptions.filter((s: unknown) => typeof s === 'string') : [];
    const subscriptionValue = subscriptions.join(',');

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create or update contact
    const createResult = await resend.contacts.create({
      email,
      segments: [{ id: segmentId }],
      properties: { subscriptions: subscriptionValue },
    });

    if (createResult.error) {
      const err = createResult.error as { statusCode?: number; message?: string };
      // Duplicate contact — update their subscription preferences
      if (err.statusCode === 422 && err.message?.includes('already')) {
        const updateResult = await resend.contacts.update({
          email,
          properties: { subscriptions: subscriptionValue },
        });
        if (updateResult.error) {
          console.error('[subscribe] contacts.update error:', updateResult.error);
          return NextResponse.json(
            { success: false, message: '订阅更新失败，请稍后重试' },
            { status: 500 }
          );
        }
      } else {
        console.error('[subscribe] contacts.create error:', err);
        return NextResponse.json(
          { success: false, message: '订阅失败，请稍后重试' },
          { status: 500 }
        );
      }
    }

    // Send confirmation email (non-fatal: contact already created/updated)
    const sendResult = await resend.emails.send({
      from: 'notify@iceaxing.com',
      to: email,
      subject: locale === 'en'
        ? 'iceaxing — Subscription Confirmed'
        : 'iceaxing — 订阅确认',
      react: ConfirmSubscriptionEmail({
        email,
        locale,
        subscriptionCount: subscriptions.length,
        isAllContent: subscriptions.length === 0,
      }),
    });
    if (sendResult.error) {
      console.error('[subscribe] Failed to send confirmation email:', sendResult.error);
    }

    return NextResponse.json({
      success: true,
      message: locale === 'en'
        ? 'Please check your email to confirm your subscription'
        : '请查收确认邮件以完成订阅',
    });
  } catch (error: unknown) {
    console.error('[subscribe] Error:', error);
    return NextResponse.json(
      { success: false, message: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `if (!process.env.RESEND_API_KEY)` | **安全检查**：API Key 缺失时提前返回 500 并记录日志，避免 SDK 在缺失 Key 时抛出未定义行为 |
| `if (!segmentId)` | **安全检查**：Segment ID 缺失时同样返回 500。联系人必须加入指定 Segment 以区分来源 |
| `const ip = forwarded.split(',')[0].trim()` | **关键处理**：`x-forwarded-for` 可能包含多个 IP，只取第一个（客户端真实 IP） |
| `if (!checkRateLimit(ip, 3, 60_000))` | 调用限流工具：同一 IP 每分钟最多 3 次订阅请求 |
| `typeof body.email === 'string' ? body.email.trim() : ''` | **类型守卫 + trim**：确保 email 是字符串后再 trim，防止 `null`/`undefined` 时 `trim()` 抛错 |
| `const locale = body.locale === 'en' ? 'en' : 'zh'` | 从请求体获取用户当前浏览语言，用于发送对应语言的确认邮件 |
| `Array.isArray(body.subscriptions) ? body.subscriptions.filter(...)` | **类型守卫**：过滤数组中非字符串元素，防止恶意注入异常数据 |
| `const subscriptionValue = subscriptions.join(',')` | 将订阅偏好序列化为逗号分隔字符串（如 `"category:tech,project:blog"`），存储在 Resend contact 的 `properties` 字段 |
| `resend.contacts.create({ segments: [{ id: segmentId }], properties: {...} })` | 核心操作：创建联系人并加入 Segment。`properties.subscriptions` 存储分类偏好 |
| `err.statusCode === 422 && err.message?.includes('already')` | **AND 条件判断重复邮箱**：重复邮箱返回 422 → 走 `contacts.update()` 更新其偏好设置，而非报错 |
| `resend.emails.send({ react: ConfirmSubscriptionEmail({...}) })` | 发送自定义确认邮件（异步），失败仅记录日志不阻断订阅流程——联系人已成功创建 |
| `console.error('[subscribe] Error:', error)` | 记录完整错误到服务端日志。客户端只收到通用错误信息，不泄露内部细节 |

---

#### 3.1.3 订阅表单 UI

**概念说明——状态机模式（State Machine Pattern）**

此组件使用 `useState<'idle' | 'loading' | 'success' | 'error'>` 管理 UI 状态，这是一种轻量级的**有限状态机**：

- **`idle`**：初始状态，表单等待用户输入。显示输入框 + 订阅按钮。
- **`loading`**：用户点击提交后，网络请求进行中。按钮文字变为"提交中..."并禁用，阻止重复提交。
- **`success`**：接口返回 `{ success: true }`。表单被替换为成功提示卡片，输入框清空。
- **`error`**：接口返回错误或网络异常。表单下方显示红色错误消息，用户可以重试。

**为什么用 enum 字面量而非 `useReducer` 或状态机库**：这个表单只有 4 个互斥状态，没有复杂的状态转换逻辑（一个状态只能从特定前置状态进入），`useState` + TS 字面量联合类型足以保证类型安全，不需要引入 xstate 等重量级方案。

**[文件用途]** `components/subscribe/subscribe-form.tsx`——订阅表单客户端组件，管理输入、状态转换和 API 调用。

```tsx
// components/subscribe/subscribe-form.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { PreferenceTree } from './preference-tree';
import type { SubscriptionOption } from '@/lib/sanity/types';

interface Props {
  showHeading?: boolean;
}

export function SubscribeForm({ showHeading = true }: Props) {
  const t = useTranslations('subscribe');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<SubscriptionOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/subscription-options');
        const json = await res.json();
        if (!cancelled && json.success) {
          setOptions(json.data);
        }
      } catch {
        // options fetch failure is non-fatal
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSelectionChange = useCallback((next: Set<string>) => {
    setSubscriptions(next);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus('loading');

    const trimmedEmail = email.trim();

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          locale,
          subscriptions: [...subscriptions],
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(String(data.message ?? '') || t('success'));
        setEmail('');
        setSubscriptions(new Set());
      } else {
        setStatus('error');
        setMessage(String(data.message ?? '') || t('error'));
      }
    } catch {
      setStatus('error');
      setMessage(t('networkError'));
    } finally {
      submittingRef.current = false;
    }
  }

  if (status === 'success') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showHeading && (
        <h3 className="font-semibold text-sm">{t('title')}</h3>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          required
          className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-zinc-400 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? t('submitting') : t('submit')}
        </button>
      </div>

      {/* Subscription preferences */}
      <fieldset className="border rounded-lg p-3">
        <legend className="text-xs text-zinc-500 px-1">
          {t('preferencesLabel')}
        </legend>
        {optionsLoading ? (
          <p className="text-xs text-zinc-400 py-2">{t('loadingOptions')}</p>
        ) : (
          <PreferenceTree
            options={options}
            selected={subscriptions}
            onSelectionChange={handleSelectionChange}
          />
        )}
        <p className="text-xs text-zinc-400 mt-1">{t('preferencesHint')}</p>
      </fieldset>

      {status === 'error' && (
        <p className="text-sm text-red-600">{message}</p>
      )}
    </form>
  );
}
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `'use client'` | 标记为客户端组件——需要 `useState`、`useRef`、`useEffect`、`fetch`、浏览器事件 |
| `useTranslations('subscribe')` | 使用 `next-intl` 加载订阅命名空间的翻译文本，支持中英双语 |
| `useLocale()` | 获取用户当前浏览语言（`zh` 或 `en`），提交时传给 API 用于发送对应语言邮件 |
| `useState<Set<string>>(new Set())` | **关键数据结构**：使用 Set 存储已选中的订阅 key（如 `"category:tech"`），去重且 O(1) 查找 |
| `useEffect(() => { load() }, [])` | 组件挂载后从 `/api/subscription-options` 获取分类树数据，`cancelled` 标志防止 Strict Mode 重复请求或卸载后 setState |
| `handleSelectionChange = useCallback(...)` | 缓存回调引用避免 PreferenceTree 无意义重渲染。Set 是不可变更新——每次传入新的 Set 实例 |
| `submittingRef` | **双重提交守卫**：ref 在 React 渲染周期外同步置 true，防止快速双击或延迟响应导致的重复提交 |
| `subscriptions: [...subscriptions]` | 将 Set 展开为数组传给 API。API 端再 join 为逗号分隔字符串存储 |
| `showHeading` prop | 在 Dialog 弹窗中已显示标题，嵌入页面侧边栏时显示标题——同一组件适配两种场景 |
| `<fieldset>` 偏好选择区 | HTML 原生 `<fieldset>` + `<legend>` 提供无障碍语义分组，加载中显示骨架文本 |
| `PreferenceTree` 组件 | 递归渲染 category → project → collection 树，处理复选框的父子联动逻辑 |
| `catch { setMessage(t('networkError')) }` | **i18n 错误消息**：网络异常时根据当前语言显示对应文本，而非硬编码中文 |

---

#### 3.1.3.1 订阅选项 API

**概念说明——数据来源**

订阅偏好选择器需要从 Sanity 获取所有 Category → Project → Collection 的关系树。这些数据与博客渲染页面相同，但需要扁平化为选项列表供树形组件消费。

设计决策：用 ISR（Incremental Static Regeneration）缓存 1 小时。分类结构变化频率极低（数月一次），无需每次请求都实时查询 Sanity。

**[文件用途]** `app/api/subscription-options/route.ts`——GET API，返回全部分类/项目/合集选项列表。

```ts
// app/api/subscription-options/route.ts
import { NextResponse } from 'next/server';
import { getSubscriptionOptions } from '@/lib/sanity/queries';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  try {
    const options = await getSubscriptionOptions();
    return NextResponse.json(
      { success: true, data: options },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[subscription-options] Error:', error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500 }
    );
  }
}
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `dynamic = 'force-static'` + `revalidate = 3600` | ISR 策略：构建时生成静态 JSON，1 小时后后台重新生成。分类结构极少变化 |
| `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` | CDN 缓存 1 小时，过期后仍可返回旧数据（最长 24h）同时后台刷新 |
| `{ success: false, data: [] }` | **降级策略**：Sanity 查询失败时返回空数组而非 500。订阅表单显示"暂无可选分类"，不阻断订阅流程——用户仍可"全选"订阅 |

对应的 Sanity 查询函数（`lib/sanity/queries.ts`）：

```ts
export async function getSubscriptionOptions(): Promise<SubscriptionOption[]> {
  const categories = await client.fetch(
    groq`*[_type == "category"] | order(order) {
      "type": "category", "slug": slug.current, title
    }`
  );
  const projects = await client.fetch(
    groq`*[_type == "project"] | order(order) {
      "type": "project", "slug": slug.current, title,
      "parentSlug": category->slug.current
    }`
  );
  const collections = await client.fetch(
    groq`*[_type == "collection"] | order(order) {
      "type": "collection", "slug": slug.current, title,
      "parentSlug": project->slug.current
    }`
  );
  return [...categories, ...projects, ...collections] as SubscriptionOption[];
}
```

> **为什么 `parentSlug` 对 collection 特别重要**：Collection slug 只在同一 project 内唯一——不同 project 下可以有同名的 collection（如两个 project 都有 "changelog" 合集）。订阅时需要用 `collection:projectSlug/collectionSlug` 格式来唯一标识，而 `parentSlug`（即 project slug）正是构造这个复合 key 所必需的数据。

**TypeScript 类型**（`lib/sanity/types.ts`）：

```ts
export interface SubscriptionOption {
  type: 'category' | 'project' | 'collection';
  slug: string;
  title: string;
  parentSlug?: string; // project 的父 category slug；collection 的父 project slug
}
```

---

#### 3.1.3.2 偏好树组件

**概念说明——key 格式与级联逻辑**

偏好树组件将扁平的 `SubscriptionOption[]` 构建为 category → project → collection 三层树，通过 checkbox 让用户选择订阅范围。关键设计：

- **Key 格式**：`category:slug`、`project:slug`、`collection:projectSlug/collectionSlug`（collection key 包含父 project slug，解决 slug 非全局唯一问题）
- **级联逻辑**：勾选父节点自动勾选所有子节点；取消父节点自动取消所有子节点。这是单向级联——取消子节点不影响父节点
- **匹配语义**：通知发送时使用 OR 逻辑——只要用户的订阅 key 集合中匹配 category、project 或 collection 任一维度，就发送通知

**[文件用途]** `components/subscribe/preference-tree.tsx`——分类偏好树组件，渲染 checkbox 树并处理级联逻辑。

```tsx
// components/subscribe/preference-tree.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { SubscriptionOption } from '@/lib/sanity/types';

interface Props {
  options: SubscriptionOption[];
  selected: Set<string>;
  onSelectionChange: (newSelected: Set<string>) => void;
}

interface TreeNode {
  type: 'category' | 'project' | 'collection';
  slug: string;
  title: string;
  parentSlug?: string;
  children: TreeNode[];
}

function buildTree(options: SubscriptionOption[]): TreeNode[] {
  const catMap = new Map<string, TreeNode>();
  const projMap = new Map<string, TreeNode>();
  const result: TreeNode[] = [];

  // Pass 1: build category nodes
  for (const o of options) {
    if (o.type === 'category') {
      const node: TreeNode = { type: 'category', slug: o.slug, title: o.title, children: [] };
      catMap.set(o.slug, node);
      result.push(node);
    }
  }
  // Pass 2: build project nodes, attach to parent category
  for (const o of options) {
    if (o.type === 'project') {
      const node: TreeNode = { type: 'project', slug: o.slug, title: o.title, parentSlug: o.parentSlug, children: [] };
      projMap.set(o.slug, node);
      const parent = catMap.get(o.parentSlug ?? '');
      if (parent) parent.children.push(node);
    }
  }
  // Pass 3: build collection nodes, attach to parent project
  for (const o of options) {
    if (o.type === 'collection') {
      const node: TreeNode = { type: 'collection', slug: o.slug, title: o.title, parentSlug: o.parentSlug, children: [] };
      const parent = projMap.get(o.parentSlug ?? '');
      if (parent) parent.children.push(node);
    }
  }

  return result;
}

function getKey(type: string, slug: string, parentSlug?: string) {
  if (type === 'collection' && parentSlug) {
    return `${type}:${parentSlug}/${slug}`;
  }
  return `${type}:${slug}`;
}

export function PreferenceTree({ options, selected, onSelectionChange }: Props) {
  const t = useTranslations('subscribe');
  const tree = buildTree(options);

  function nodeKey(node: TreeNode): string {
    return getKey(node.type, node.slug, node.parentSlug);
  }

  function handleToggle(node: TreeNode) {
    const key = nodeKey(node);
    const next = new Set(selected);

    if (next.has(key)) {
      next.delete(key);
      for (const child of node.children) removeDescendants(child, next);
    } else {
      next.add(key);
      for (const child of node.children) addDescendants(child, next);
    }

    onSelectionChange(next);
  }

  function removeDescendants(node: TreeNode, set: Set<string>) {
    set.delete(nodeKey(node));
    for (const child of node.children) removeDescendants(child, set);
  }

  function addDescendants(node: TreeNode, set: Set<string>) {
    set.add(nodeKey(node));
    for (const child of node.children) addDescendants(child, set);
  }

  return (
    <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
      {tree.map((cat) => (
        <div key={cat.slug}>
          <label className="flex items-center gap-2 py-0.5 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={selected.has(nodeKey(cat))}
              onChange={() => handleToggle(cat)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
            />
            <span>{cat.title}</span>
          </label>
          {cat.children.map((proj) => (
            <div key={proj.slug} className="ml-4">
              <label className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(nodeKey(proj))}
                  onChange={() => handleToggle(proj)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                />
                <span>{proj.title}</span>
              </label>
              {proj.children.map((col) => (
                <div key={col.slug} className="ml-4">
                  <label className="flex items-center gap-2 py-0.5 cursor-pointer text-zinc-500">
                    <input
                      type="checkbox"
                      checked={selected.has(nodeKey(col))}
                      onChange={() => handleToggle(col)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                    />
                    <span>{col.title}</span>
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      {tree.length === 0 && (
        <p className="text-zinc-400 text-xs py-2">{t('emptyOptions')}</p>
      )}
    </div>
  );
}
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `buildTree()` 三段式构建 | 先收集所有 category → Map，再遍历 project 挂到 category.children，最后 collection 挂到 project.children。三段而非一段，因为 GROQ 返回是扁平的——project 可能在 category 之前返回 |
| `parentSlug` 存储在 TreeNode | project 存储其父 category slug，collection 存储其父 project slug。后者用于 `getKey()` 构造 `collection:projectSlug/collectionSlug` 复合 key |
| `getKey(type, slug, parentSlug?)` | **核心逻辑**：仅 collection 类型使用 `parentSlug` 构造复合 key。category 和 project 的 slug 本身已全局唯一 |
| `nodeKey(node)` | 包装 `getKey()`，从 TreeNode 读取字段。`node.parentSlug` 在 buildTree 时已设置 |
| `handleToggle(node)` | **级联开关**：选中 → 递归 addChildren；取消 → 递归 removeChildren。每次创建新 Set 实例（不可变更新）通知父组件 |
| `max-h-48 overflow-y-auto` | 限制选项区高度 12rem（约 3 行半），内容多时出现纵向滚动条，防止弹窗过高 |
| `ml-4` 递进缩进 | project 相对 category 缩进 1rem，collection 相对 project 再缩进 1rem。纯 Tailwind 实现，无需嵌套组件传 depth |
| `font-medium` vs `text-zinc-500` | category 加粗，collection 用灰色——视觉层级：category > project > collection |
| `tree.length === 0` 空态 | API 异常返回空数组时显示"暂无可选分类"（i18n），表单仍可提交——此时即为"全选"订阅 |

---

在 blog 正文页底部（Giscus 上方）和 project 页侧边栏放置此表单。

#### 3.1.4 新文章通知邮件模板

**概念说明——@react-email/components（JSX -> HTML Email）**

`@react-email/components` 是一套专为邮件设计的 React 组件库，核心价值在于**用 JSX 编写模板，自动渲染为 HTML 邮件**。传统方式直接拼 HTML 字符串不仅难维护、容易写错，而且各邮件客户端（Outlook/Gmail/Apple Mail）对 CSS 支持严重不一致——Gmail 不支持 `<style>` 标签，Outlook 只支持 `table` 布局。

- **`<Html>`**：渲染 `<html>` 标签，设置 `lang` 属性。
- **`<Head>`**：空标签防止 React 18 的警告。
- **`<Preview>`**：生成隐藏在邮件正文中的预览文本，主流邮箱在收件箱列表显示此内容。
- **`<Body>`**：邮件正文容器。注意邮件中不支持 `style` 传对象，需用内联 style 对象逐个定义（如 `bodyStyle`）。
- **`<Container>`**：固定宽度容器（默认 600px），确保在宽屏客户端中邮件内容不会撑满全屏。
- **`<Text>` / `<Link>` / `<Hr>`**：分别渲染 `<p>`、`<a>`、`<hr>`，并自动附加不同客户端兼容的默认样式。
- **样式限制**：不支持 Grid/Flexbox/CSS Variables。必须使用内联样式（`style` 对象），背景图、自定义字体、`border-radius` 在部分客户端中无声失效。不要追求像素精度——邮件的最低公分母是 1999 年的 HTML。

`react-email` CLI（`npx email dev`）可在本地启动预览服务器，实时查看模板渲染效果。

**[文件用途]** `lib/email/templates/new-post-notification.tsx`——新文章通知邮件模板，定义邮件结构和样式。

```bash
npm install @react-email/components@^0 react-email@^4
```

```tsx
// lib/email/templates/new-post-notification.tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface Props {
  postTitle: string;
  postUrl: string;
  category: string;
  project: string;
  locale?: 'zh' | 'en';
}

const content = {
  zh: {
    preview: (title: string) => `iceaxing 有新文章：${title}`,
    heading: 'iceaxing 更新通知',
    intro: '你在 iceaxing 订阅的内容有更新：',
    article: (title: string) => `新文章：《${title}》`,
    readNow: '立即阅读',
    footer: '不想再收到此类通知？点击邮件底部的退订链接即可。',
  },
  en: {
    preview: (title: string) => `iceaxing — New Post: ${title}`,
    heading: 'iceaxing Update',
    intro: 'New content from your iceaxing subscription:',
    article: (title: string) => `"${title}"`,
    readNow: 'Read Now',
    footer: "Don't want these notifications? Click the unsubscribe link at the bottom of this email.",
  },
};

export function NewPostNotificationEmail({
  postTitle,
  postUrl,
  category,
  project,
  locale = 'zh',
}: Props) {
  const m = content[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.preview(postTitle)}</Preview>
      <Body style={bodyStyle}>
        <Container>
          <Text style={headingStyle}>{m.heading}</Text>
          <Text style={textStyle}>{m.intro}</Text>
          <Text style={textStyle}>
            {category} &gt; {project}
          </Text>
          <Text style={textStyle}>
            {m.article(postTitle)}
          </Text>
          <Link href={postUrl} style={buttonStyle}>
            {m.readNow}
          </Link>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>{m.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, sans-serif',
  padding: '20px',
};

const headingStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const textStyle = {
  fontSize: '14px',
  color: '#333',
  marginBottom: '8px',
};

const buttonStyle = {
  display: 'inline-block',
  padding: '10px 20px',
  backgroundColor: '#18181b',
  color: '#ffffff',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  marginTop: '12px',
};

const hrStyle = {
  marginTop: '24px',
  borderColor: '#e4e4e7',
};

const footerStyle = {
  fontSize: '11px',
  color: '#999',
  marginTop: '8px',
};
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `import { Html, Head, Preview, ... } from '@react-email/components'` | 导入邮件专用组件，每个组件对应一个 HTML 标签并附带客户端兼容的默认样式 |
| `locale?: 'zh' \| 'en'` | 新增 prop：根据文章语言选择邮件模板语言。默认为 `'zh'` |
| `const content = { zh: {...}, en: {...} }` | **双语内容对象**：将所有文案抽取到组件外的 `content` 对象中，按语言组织。组件内通过 `const m = content[locale]` 选择 |
| `<Html lang={locale}>` | 动态设置邮件语言属性，替代硬编码的 `lang="zh"` |
| `{category} &gt; {project}` | 在邮件正文中显示"分类 > 项目"路径，帮助订阅者快速了解文章所属范围 |
| `const bodyStyle = { backgroundColor: '#ffffff', ... }` | 所有样式定义为模块级常量对象，与 JSX 分离便于调整 |
| 注意：`const` 样式对象放在组件外部 | 避免每次渲染重新创建对象，减少不必要的内存分配（虽然邮件渲染是一次性的，保持这个习惯对 React 开发有益） |

---

#### 3.1.5 Webhook 中集成通知发送

**概念说明——新文章检测逻辑（`_createdAt === _updatedAt`）**

当 Sanity 文档发生变化时，webhook 会发送包含 `body._createdAt` 和 `body._updatedAt` 的 payload。检测"新创建"的常见手段有多种，各有优劣：

- **方案一——`_createdAt === _updatedAt`**（本教程采用）：文档被创建时，两个时间戳由 Sanity 设为同一值；后续编辑只更新 `_updatedAt`。逻辑简单，零额外依赖。**局限性**：如果文档创建后在同一秒内被编辑（几乎不可能），会产生假阴性。
- **方案二——检查 webhook event type**：Sanity 可以按 `document.create` / `document.update` / `document.delete` 分类发送 webhook。但如果创建草稿后直接发布，可能触发 `create` + `publish` 两次事件，需要去重处理。
- **方案三——数据库标记 `notified: boolean`**：在 blog schema 加一个字段记录是否已发送通知。最可靠但增加 schema 复杂度和一次额外的 patch 操作。

对于个人博客的低频更新场景，方案一已经足够——每篇文章发布前必然会编辑多次，`_createdAt === _updatedAt` 恰好只在第一次 publish 时为 true。

> **重要**：以下代码假设 webhook payload 中包含 `body._id`、`body._createdAt`、`body._updatedAt`。Sanity webhook 默认发送完整文档，这些字段自动包含。

**[文件用途]** 在 `app/api/revalidate/route.ts` 的 revalidation 逻辑后追加——当检测到新 blog 文档时，根据订阅者的分类偏好筛选后发送通知邮件。

**概念说明——偏好匹配逻辑**

通知发送不再"全员广播"，而是根据订阅者存储的 `subscriptions` 属性进行 OR 匹配：

- 订阅者选择了 `category:tech` → 任何 tech 分类下的文章都通知
- 订阅者选择了 `project:blog-site` → blog-site 项目的文章通知
- 订阅者选择了 `collection:blog-site/changelog` → 仅 changelog 合集通知
- 订阅者的 `subscriptions` 为空或不存在 → 视为"全选"（向后兼容旧订阅者）

**概念说明——分页与 N+1 查询**

Resend `contacts.list()` 不返回 `properties` 字段，只返回基础信息（id, email）。读取订阅偏好必须逐条调用 `contacts.get(id)`。对于个人博客 < 100 订阅者的规模，N+1 调用完全可接受；若未来订阅量增长至数千，可考虑用 Resend segments 或外部数据库缓存偏好数据。

**概念说明——Fail-Open 策略**

在整个通知链路中，任何不确定性都采用 fail-open：`contacts.get()` 失败 → 发送通知；`properties` 解析失败 → 发送通知。宁可多发不漏发——对于个人博客，多收一封邮件的代价远低于漏掉真正感兴趣的读者。

在 `app/api/revalidate/route.ts` 中，当 blog 被创建或更新时发送通知邮件。由于 webhook payload 中的 `project` 仅是 `_ref`，需要先查询展开：

```ts
// 在 revalidatePath 之后追加: app/api/revalidate/route.ts
// 完整实现在 switch case 'blog' 分支中调用 sendNewPostNotification()

async function sendNewPostNotification(blogId: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[revalidate] RESEND_API_KEY not set, skipping notification');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  // Resolve the blog post's category, project, collection, slug, AND language via GROQ
  const post = await client.fetch(
    groq`*[_id == $id][0]{
      title,
      language,
      "slug": slug.current,
      "project": project->{"slug": slug.current, title},
      "category": project->category->{"slug": slug.current, title},
      "collection": collection->{"slug": slug.current}
    }`,
    { id: blogId }
  );

  if (!post?.title || !post?.category?.slug || !post?.category?.title
      || !post?.project?.slug || !post?.project?.title || !post?.slug) {
    console.warn('[revalidate] Post not found or missing refs for notification:', blogId);
    return;
  }

  const postUrl = post.collection?.slug
    ? `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.collection.slug}/${post.slug}`
    : `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.slug}`;

  const postCatSlug = post.category.slug;
  const postProjSlug = post.project.slug;
  const postColSlug = post.collection?.slug ?? null;
  const postLocale: 'zh' | 'en' = post.language === 'en' ? 'en' : 'zh';

  const { Resend } = await import('resend');
  const { NewPostNotificationEmail } = await import(
    '@/lib/email/templates/new-post-notification'
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Fetch all contacts with pagination (contacts.list() does NOT return properties)
  const allContacts: { id: string; email: string }[] = [];
  let after: string | undefined;
  let hasMore = true;
  while (hasMore && allContacts.length < 500) {
    const listResponse = await resend.contacts.list(
      after ? { after, limit: 100 } : { limit: 100 }
    );
    if (listResponse.error) {
      console.error('[revalidate] contacts.list error:', listResponse.error);
      break;
    }
    const data = listResponse.data?.data;
    if (data && data.length > 0) {
      allContacts.push(...data.map((c) => ({ id: c.id, email: c.email })));
    }
    hasMore = listResponse.data?.has_more ?? false;
    after = data?.[data.length - 1]?.id;
  }

  if (allContacts.length === 0) return;

  // Filter contacts by subscription preferences (N+1 get for properties)
  const matchedContacts: { id: string; email: string }[] = [];
  for (const contact of allContacts) {
    try {
      const getResult = await resend.contacts.get(contact.id);
      if (getResult.error) {
        // Fail-open: if we can't read properties, include the contact
        matchedContacts.push(contact);
        continue;
      }
      const props = getResult.data?.properties as
        | Record<string, { type: string; value: unknown }>
        | undefined;
      const subsProp = props?.subscriptions;
      const subs: string | undefined =
        subsProp?.type === 'string' && typeof subsProp.value === 'string'
          ? subsProp.value
          : undefined;

      if (subs === undefined || subs === '') {
        // Legacy subscriber or "all content" — include
        matchedContacts.push(contact);
      } else {
        const prefSet = new Set(subs.split(','));
        if (
          prefSet.has(`category:${postCatSlug}`) ||
          prefSet.has(`project:${postProjSlug}`) ||
          (postColSlug && prefSet.has(`collection:${postProjSlug}/${postColSlug}`))
        ) {
          matchedContacts.push(contact);
        }
      }
    } catch {
      // Fail-open: include contact on any read error
      matchedContacts.push(contact);
    }
  }

  if (matchedContacts.length === 0) {
    console.log('[revalidate] No matching subscribers for this post');
    return;
  }

  // Send emails in parallel with allSettled
  const results = await Promise.allSettled(
    matchedContacts.map((c) =>
      resend.emails.send({
        from: 'notify@iceaxing.com',
        to: c.email,
        subject: postLocale === 'en'
          ? `iceaxing — New Post: ${post.title}`
          : `iceaxing 新文章: ${post.title}`,
        react: NewPostNotificationEmail({
          postTitle: post.title,
          postUrl,
          category: post.category.title,
          project: post.project.title,
          locale: postLocale,
        }),
      })
    )
  );

  const failed = results.filter((r) => {
    if (r.status === 'rejected') return true;
    if (r.status === 'fulfilled' && (r.value as { error?: unknown })?.error) return true;
    return false;
  }).length;
  if (failed > 0) {
    console.warn(`[revalidate] ${failed}/${results.length} notification emails failed`);
  }
}
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `language` field in GROQ query | 获取文章语言（`zh`/`en`），用于选择通知邮件的语言和邮件标题 |
| `postColSlug = post.collection?.slug ?? null` | Collection 可选——文章可能不属于任何合集。`null` 在后续匹配中跳过 collection 维度 |
| `postLocale: 'zh' \| 'en'` | 根据 blog 的 `language` 字段派生通知语言 |
| `while (hasMore && allContacts.length < 500)` | **分页循环**：`contacts.list()` 每页最多 100 条，通过 `after` 游标翻页。500 上限防止无限循环 |
| `listResponse.data?.has_more` | Resend API 的分页标志——为 `true` 时还有下一页，`after` 设为最后一页最后一个联系人的 ID |
| `resend.contacts.get(contact.id)` | **N+1 读取**：`contacts.list()` 不返回 `properties` 字段，必须逐个 `get()` 才能读取 `subscriptions` 属性。对于个人博客 < 100 订阅者的规模可接受 |
| `props?.subscriptions` | 从 contact 的 custom properties 中提取订阅偏好。Resend v6 属性格式为 `{ type: string; value: unknown }` |
| `subs === undefined \|\| subs === ''` | **向后兼容**：旧订阅者没有 `subscriptions` 属性（`undefined`），或选了全部分类（`''` 空字符串）→ 所有文章都发送通知 |
| `prefSet.has('category:...') \|\| prefSet.has('project:...') \|\| prefSet.has('collection:...')` | **OR 匹配**：只要文章的分类、项目或合集任一维度命中用户偏好，就发送通知 |
| `` `collection:${postProjSlug}/${postColSlug}` `` | **复合 key**：collection slug 非全局唯一，必须拼接 project slug 才能唯一标识——与前端 preference-tree 的 `getKey()` 格式完全一致 |
| `catch { matchedContacts.push(contact) }` | **Fail-open**：读取 contact 属性失败时仍包含该联系人，宁可多发不漏发 |
| `locale: postLocale` prop | 传给邮件模板，渲染对应语言的内容（中文/英文） |

---

### 3.2 Collection UI 激活

[文件用途] 升级 `app/(site)/[category]/[project]/[...slug]/page.tsx`，在 catch-all 路由中增加 Collection（合集）的识别与渲染逻辑。不增加新路由文件，而是在现有 `[...slug]/page.tsx` 中分支判断。

[架构背景] **为什么不在 `[collection]/page.tsx` 中做独立路由？** Next.js 中 `[collection]/page.tsx` 与 `[...slug]/page.tsx` 在同一目录层级会产生路由冲突：单段路径 `/[cat]/[proj]/xxx` 会被 `[collection]` 优先匹配，导致无 Collection 的 blog post 无法访问。解决方案：在 `[...slug]/page.tsx` 中通过 `getCollectionsByProject` 检测单段 slug 是否为 Collection，是则渲染合集列表，否则走 blog 正文逻辑。

**关键概念**：`slug.length` 是路由分发的核心判断条件：
- `slug.length === 1` → 可能是 Collection 列表页，也可能是无 Collection 的 Blog 正文
- `slug.length === 2` → 必然是 `[collection]/[blogSlug]`

**Phase 2 相比 Phase 1 的增量变更**：
1. 新增 import `getBlogPostsByCollection`、`getCollectionsByProject`、`getCategoryBySlug`、`getProjectBySlug`
2. 新增 import `GiscusComments` 和 `EmptyState` 组件
3. `generateMetadata` 中增加 `slug.length === 0` 和 `slug.length > 2` 的边界守卫
4. Collection 元数据包含 `description` 字段（优先 `collection.description`，回退默认文本）
5. `slug.length === 1` 分支中先检测是否为 Collection（per spec），是则渲染文章列表
6. Collection 列表页并行获取 `posts`、`cat`、`proj`（`Promise.all` 减少瀑布请求）
7. 面包屑导航中使用解析后的 `cat.title` / `proj.title` 而非原始 slug——用户体验更好
8. 空文章列表使用复用组件 `EmptyState` 而非内联 div
9. `GiscusComments` 已激活（非注释状态）

将 Phase 1 的 `app/(site)/[category]/[project]/[...slug]/page.tsx` **整体替换**为以下版本：

```tsx
// app/(site)/[category]/[project]/[...slug]/page.tsx （Phase 2 更新版）
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getBlogPost,
  getBlogPostWithCollection,
  getBlogPostsByCollection,
  getCollectionsByProject,
  getCategoryBySlug,
  getProjectBySlug,
} from '@/lib/sanity/queries';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { BlogThemeWrapper } from '@/components/blog/blog-theme-wrapper';
import { GiscusComments } from '@/components/comments/giscus';
import { EmptyState } from '@/components/ui/empty-state';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ category: string; project: string; slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, project } = await params;
  if (slug.length === 0 || slug.length > 2) return { title: '未找到' };

  if (slug.length === 1) {
    // Check collection first (per spec: collection check before blog post)
    const collections = await getCollectionsByProject(project);
    const collection = collections.find((c) => c.slug === slug[0]);
    if (collection) {
      return {
        title: collection.title,
        description: collection.description || `${collection.title} 合集`,
      };
    }

    const post = await getBlogPost(project, slug[0]);
    if (!post) return { title: '未找到' };
    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.publishedAt,
      },
    };
  }

  // slug.length === 2：collection + blog
  const post = await getBlogPostWithCollection(project, slug[0], slug[1]);
  if (!post) return { title: '未找到' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

export default async function CatchAllPage({ params }: Props) {
  const { slug, category, project } = await params;

  // ═══ 两段路径：Collection + Blog 正文 ═══
  if (slug.length === 2) {
    const post = await getBlogPostWithCollection(project, slug[0], slug[1]);
    if (!post) notFound();

    return (
      <BlogThemeWrapper theme={post.theme ?? 'default'}>
        <article className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-zinc-400 mb-8">
            <Link href="/" className="hover:text-zinc-600">首页</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}`} className="hover:text-zinc-600">{post.category?.title || category}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}`} className="hover:text-zinc-600">
              {post.project?.title || project}
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}/${slug[0]}`} className="hover:text-zinc-600">
              {post.collection?.title || slug[0]}
            </Link>
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
              </time>
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="blog-body">
            <BlogBody content={post.body} />
          </div>

          {post.updatedAt && (
            <p className="text-sm text-zinc-400 mt-12 pt-6 border-t">
              最后更新于 {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
            </p>
          )}
        </article>

        <div className="max-w-3xl mx-auto px-4 pb-12">
          <GiscusComments />
        </div>
      </BlogThemeWrapper>
    );
  }

  // ═══ 单段路径：Collection 列表 或 Blog 正文 ═══
  if (slug.length === 1) {
    // Check collection first (per spec)
    const collections = await getCollectionsByProject(project);
    const collection = collections.find((c) => c.slug === slug[0]);

    if (collection) {
      // → Collection 列表页
      const [posts, cat, proj] = await Promise.all([
        getBlogPostsByCollection(project, collection.slug),
        getCategoryBySlug(category),
        getProjectBySlug(project),
      ]);

      return (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-zinc-400 mb-8">
            <Link href="/" className="hover:text-zinc-600">首页</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}`} className="hover:text-zinc-600">{cat?.title || category}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}`} className="hover:text-zinc-600">{proj?.title || project}</Link>
          </nav>

          <h1 className="text-3xl font-bold mb-2">{collection.title}</h1>
          {collection.description && (
            <p className="text-zinc-500 mb-8">{collection.description}</p>
          )}

          {posts.length === 0 ? (
            <EmptyState message="这个合集中还没有文章" />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/${category}/${project}/${collection.slug}/${post.slug}`}
                  className="block p-4 border rounded-lg hover:border-zinc-400 transition-colors"
                >
                  <h2 className="font-medium mb-1">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-zinc-500 line-clamp-2">{post.excerpt}</p>
                  )}
                  <time className="text-xs text-zinc-400" dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                  </time>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    // → 无 Collection 的 Blog 正文
    const post = await getBlogPost(project, slug[0]);
    if (!post) notFound();

    return (
      <BlogThemeWrapper theme={post.theme ?? 'default'}>
        <article className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-zinc-400 mb-8">
            <Link href="/" className="hover:text-zinc-600">首页</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}`} className="hover:text-zinc-600">{post.category?.title || category}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}`} className="hover:text-zinc-600">
              {post.project?.title || project}
            </Link>
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
              </time>
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="blog-body">
            <BlogBody content={post.body} />
          </div>

          {post.updatedAt && (
            <p className="text-sm text-zinc-400 mt-12 pt-6 border-t">
              最后更新于 {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
            </p>
          )}
        </article>

        <div className="max-w-3xl mx-auto px-4 pb-12">
          <GiscusComments />
        </div>
      </BlogThemeWrapper>
    );
  }

  notFound();
}
```

> **注意**：`slug.length === 2` 分支放在了 `slug.length === 1` 之前。这是有意为之——两段路径是更具体的匹配条件，先处理可以避免 `slug.length === 1` 的分支无意中拦截。同时，blog 正文渲染逻辑出现了两次（单段和双段路径），这是因为 Collection 列表页插入后结构有分支。重构时可提取 `<BlogArticle post={post} />` 内部组件消除重复。

---

#### 3.1~3.2 Code Review 关键发现

以下是在 4 轮 Code Review 中发现的真实 Bug 及修复方案，记录于此供后续开发参考。

**X-Forwarded-For 多 IP 解析**（3.1.2）

问题：`x-forwarded-for` 头可能包含逗号分隔的多个 IP（如 `"1.2.3.4, 5.6.7.8"`），直接将整个字符串作为 Rate Limit 的 key 会导致同一客户端绕过限流——因为每次请求的代理链 IP 组合可能略有不同。

修复：`forwarded.split(',')[0].trim()` — 只取第一个 IP（客户端真实 IP），trim 去除空格。

**Resend v6 Response\<T\> 包装**（3.1.2 / 3.1.5）

问题：Resend v6 所有 API 返回值使用 `Response<T> = { data: T; error: null } | { data: null; error: { message: string } }` 联合类型。`contacts.list()` 返回 `Response<ListContactsResponseSuccess>`，其中 `ListContactsResponseSuccess = { object: 'list'; data: Contact[] }`。因此正确的数据访问路径是 `response.data?.data`，而非 `response.data`。

影响：使用单层解引用 `response.data` 会拿到 `ListContactsResponseSuccess` 对象而非 `Contact[]`，导致 `contacts.length` 始终为 `undefined`，通知邮件静默失败。

**resolved-with-error 模式**（3.1.5）

`emails.send()` 在 API 层错误时可能 **resolve** 而非 reject（携带 `error` 字段），因此 `Promise.allSettled` 后需要同时检查 `.status === 'rejected'` 和 `.status === 'fulfilled' && .value?.error`。

**重复邮箱的 AND 判断**（3.1.2）

问题：原代码用 `||`（OR）判断 Resend 422 错误：`err.statusCode === 422 || err.message?.includes('already')`。但 422 也可能因邮箱格式错误等原因触发——此时 `err.message` 不含 "already"，但 422 依然匹配，会返回误导性的 "该邮箱已订阅" 消息。

修复：改为 AND 条件：`err.statusCode === 422 && err.message?.includes('already')`，精准匹配 "已存在" 场景。

**双重提交竞态**（3.1.3）

`setStatus('loading')` 是异步批处理的，快速双击可能在 React 批量更新前两次进入 `handleSubmit`，`disabled` 属性此时还未生效。`useRef(false)` 同步置位解决了这个竞态窗口——ref 的赋值是同步的，不经过 React 的 reconciliation。

**Collection 通知 URL 缺失段**（3.1.5）

GROQ 查询中未展开 `collection->{"slug": slug.current}`，导致通知邮件中的链接始终使用 3 段路径（`/cat/proj/slug`），对于属于 Collection 的文章（实际在 `/cat/proj/col/slug`），链接指向 404。

**Server-Side Email Trim + 类型守卫**（3.1.2）

`body.email.trim()` 在 `body.email` 为 `null`、`undefined` 或非字符串时直接抛 TypeError。需先 `typeof body.email === 'string'` 守卫再 `trim()`。

---

### 3.3 i18n 英文版

> Phase 2 目标：UI 文本全翻译，英文 blog 至少发布 1 篇。使用 `next-intl` 的 `[locale]` 前缀路由。

#### 3.3.1 安装

```bash
npm install next-intl@^4
```

#### 3.3.2 路由配置（`defineRouting`）

**概念说明——`defineRouting()` 和 `localePrefix: 'as-needed'`**

next-intl v4 的核心改进之一是 `defineRouting()`：一个**单一共享配置**被 middleware 和 navigation 两端消费。v3 中这两端需要分别声明 `locales` 和 `defaultLocale`，很容易不一致。

`localePrefix` 控制 URL 中 locale 段的显示策略，有三种模式：

| 模式 | 默认 locale URL | 其他 locale URL | 适用场景 |
|--------|-------------------|------------------|------------|
| `'always'` | `/zh/about` | `/en/about` | 所有语言平级，无默认概念 |
| `'as-needed'` | `/about` | `/en/about` | 默认语言不显示前缀（本博客方案） |
| `'never'` | `/about` | `/about` | 仅依赖 cookie/session 检测，URL 不变 |

**选择 `as-needed` 的理由**：中文是本站主语言和默认语言，`iceaxing.com/about` 比 `iceaxing.com/zh/about` 更简洁。英文访客通过 `iceaxing.com/en/about` 访问，URL 结构清晰。

**[文件用途]** `lib/i18n/routing.ts`——next-intl 的路由配置中心，定义支持的语言、默认语言和 URL 前缀策略。

next-intl v4 引入了 `defineRouting()` — 统一的共享路由配置，供 middleware 和 navigation 两端复用：

```ts
// lib/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'as-needed', // 中文不加 /zh 前缀，英文加 /en
});
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `import { defineRouting } from 'next-intl/routing'` | v4 新增的共享配置工厂函数 |
| `locales: ['zh', 'en']` | 声明支持的语言列表。第一个值 `'zh'` 暗示它是默认语言，但由 `defaultLocale` 明确指定 |
| `defaultLocale: 'zh'` | 明确设置默认语言。与 `localePrefix: 'as-needed'` 配合：默认语言 URL 不显示前缀 |
| `localePrefix: 'as-needed'` | 仅当当前语言不是 `defaultLocale` 时才在 URL 中显示语言前缀 |

---

#### 3.3.3 中间件

**概念说明——中间件的工作流程**

next-intl 的 middleware 是 i18n 系统的"路由器"，在每个请求到达页面之前运行，负责三件事：

1. **检测 locale**：从 URL 路径（如 `/en/about`）或浏览器 `Accept-Language` 头或 cookie 中解析用户语言。优先级：cookie > URL 前缀 > Accept-Language > defaultLocale。
2. **自动重定向**：如果 URL 缺少 locale 前缀（如 `/about`），middleware 检测请求头、匹配 `routing.locales`，将默认语言用户重定向到 `/about`，英文用户重定向到 `/en/about`。
3. **URL 改写（Rewrite）**：在 next-intl 内部，`/en/about` 被 rewrite 为 `/about` + `locale: 'en'`，页面组件通过 `params.locale` 获取语言值。

**`matcher` 配置**：定义哪些路径走 middleware，哪些跳过。`api/`、`_next/`、`_vercel/` 和静态文件（`.*\\..*`）被排除——API 路由不需要 i18n 包裹，没有 locale 前缀。

**[文件用途]** `middleware.ts`——项目根目录的 Next.js 中间件，由 next-intl 的 `createMiddleware()` 工厂函数生成。

```ts
// middleware.ts（项目根目录）
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*|feed.xml|sitemap.xml|robots.txt).*)'],
};
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `import createMiddleware from 'next-intl/middleware'` | 工厂函数，接收 routing 配置，返回 Next.js middleware handler |
| `export default createMiddleware(routing)` | 将 `routing` 传入，生成完整的 i18n middleware |
| `matcher` | Next.js 的 middleware 路由匹配器——正则表达式定义哪些路径需要经过 middleware 处理 |
| `/((?!api\|_next\|_vercel\|.*\\..*\|feed.xml\|sitemap.xml\|robots.txt).*)` | 正则反向匹配：排除 `api/`（API 路由）、`_next/`（Next.js 内部资源）、`_vercel/`（Vercel 内部）、带扩展名的文件（`.xml`、`.txt` 也是文件但 feed/sitemap/robots 写死排除了） |

---

#### 3.3.4 i18n Request Config

**概念说明——`getRequestConfig` 和 `requestLocale` 的异步本质**

`getRequestConfig` 是 next-intl 服务端的入口函数，在每个请求周期被调用一次，负责加载对应语言的翻译消息（messages）。它的签名是 `async ({ requestLocale }) => ({ locale, messages })`：

- **`requestLocale`（v4 命名）**：v3 中此参数叫 `locale`，v4 重命名为 `requestLocale` 以区分返回对象中的 `locale` 字段。值来自于 middleware 对 URL 的解析结果。
- **为什么必须 `await`**：`requestLocale` 是一个异步解析的值——middleware 对 locale 的检测（cookie 查询、Accept-Language 头解析）发生在请求生命周期中，不是同步可用的。`await` 确保这些异步操作完成后再加载消息文件。
- **动态 `import()` 消息文件**：`import(`./${requestLocale}.json`)` 按需加载对应语言的 JSON，避免把所有语言全量打包到每个页面的 bundle 中。

> **v4 变化**：文件名建议改为 `request.ts`，`getRequestConfig` 参数中 `locale` 改名为 `requestLocale`。

**[文件用途]** `lib/i18n/request.ts`——next-intl 的请求配置入口，为每个页面的 Server Components 提供当前 locale 的翻译消息。

```ts
// lib/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // 兜底：如果 locale 解析失败或不在支持列表中，回退到默认语言
  if (!locale || !routing.locales.includes(locale as 'zh' | 'en')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `import { getRequestConfig } from 'next-intl/server'` | 注意引入路径是 `next-intl/server`（v3 中在 `next-intl`），v4 明确了 client/server 分界 |
| `import { routing } from './routing'` | 复用同一份路由配置，获取 `locales` 列表和 `defaultLocale` |
| `let locale = await requestLocale` | `requestLocale` 是异步解析的值，必须先 `await` |
| `if (!locale \|\| !routing.locales.includes(...))` | **locale 校验**：防止中间件传递非法 locale 导致动态 import 抛出 `MODULE_NOT_FOUND` |
| `locale = routing.defaultLocale` | 校验失败时回退到默认语言（`'zh'`），确保应用不会因非法 locale 而崩溃 |
| `messages: (await import(...)).default` | 动态导入 `lib/i18n/messages/` 目录下对应语言的 JSON 文件 |

---

在 `next.config.ts` 中引用（注意路径更新为 `request.ts`）：

```ts
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = { /* ... */ };
export default withNextIntl(nextConfig);
```

#### 3.3.5 导航工具

**概念说明——`createNavigation()`（v4 统一 API）**

next-intl v4 将 v3 中分散的三个工厂函数合并为一个 `createNavigation()`：

| v3 API（已废弃） | v4 API | 用途 |
|-------------------|--------|------|
| `createSharedPathnamesNavigation(routing)` | `createNavigation(routing)` | 统一入口 |
| `createLocalizedPathnamesNavigation()` | 已移除 | v4 中通过 `defineRouting({ pathnames: {...} })` 统一配置 |
| 手动创建 `Link`、`useRouter`、`usePathname` | 从 `createNavigation()` 解构 | 一套 API 覆盖所有导航场景 |

`createNavigation()` 基于 `routing` 配置自动生成 locale-aware 的导航工具：
- **`<Link>`**：替代 `next/link`，自动在当前 locale 前缀下生成链接。`<Link href="/about">` 在英文页渲染为 `/en/about`，在中文页渲染为 `/about`。
- **`useRouter()`**：locale-aware 的 `router.push` / `router.replace`。
- **`usePathname()`**：返回当前路径（**不含** locale 前缀），方便路径比较和语言切换。

> **v4 变化**：`createSharedPathnamesNavigation` 合并为统一的 `createNavigation()`。

**[文件用途]** `lib/i18n/navigation.ts`——导出 locale-aware 的 Link、useRouter、usePathname，供所有客户端组件使用。

```ts
// lib/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, usePathname, useRouter } = createNavigation(routing);
```

**逐行解读**：

| 行 | 说明 |
|------|------|
| `import { createNavigation } from 'next-intl/navigation'` | v4 统一工厂函数，注意引入路径是 `next-intl/navigation` |
| `import { routing } from './routing'` | 复用同一个 routing 配置对象，确保 middleware 和 navigation 使用完全一致的 locale 设置 |
| `export const { Link, usePathname, useRouter } = createNavigation(routing)` | 解构导出三个 locale-aware API。**注意**：`Link` 是自定义组件，替代 `next/link` 的默认导入——项目中所有使用 `<Link>` 的地方都需要改为从这个文件导入 |

---

#### 3.3.6 路由改造

将所有路由从 `app/` 移动到 `app/[locale]/`：

```
app/
├── [locale]/              ← 新包裹层
│   ├── layout.tsx         ← 原 app/layout.tsx
│   ├── page.tsx           ← 原 app/page.tsx
│   ├── (site)/
│   │   └── [category]/...
│   └── (pages)/
│       ├── about/page.tsx
│       ├── friends/page.tsx
│       ├── profile/page.tsx
│       └── log/...
├── api/                   ← 保持在 app/ 根，不参与 i18n
├── feed.xml/
├── sitemap.xml/
└── robots.txt/
```

`app/[locale]/layout.tsx` 中引入 `NextIntlClientProvider`：

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 校验 locale 合法性，非法值返回 404
  if (!routing.locales.includes(locale as 'zh' | 'en')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

> **关键顺序**：`setRequestLocale(locale)` 必须在 `getMessages()` 和任何 `getTranslations()` 调用之前执行。它向 next-intl 的异步上下文注册当前请求的 locale，后续的翻译函数才能在不传 `locale` 参数的情况下正确工作。

原有的 `app/layout.tsx` 简化为透传，只返回 `{children}`（因为 API 路由不需要 HTML 包裹）。

#### 3.3.7 翻译文件

翻译消息文件放在 `lib/i18n/messages/` 目录下，按 locale 分别创建 JSON 文件。消息结构按 namespace 组织，每个 namespace 对应一个页面或功能模块。

```json
// lib/i18n/messages/zh.json（12 个命名空间）
{
  "nav": {
    "categories": "分类",
    "log": "日志",
    "about": "关于",
    "friends": "友链",
    "profile": "个人简介",
    "search": "搜索",
    "rss": "RSS",
    "home": "首页",
    "menuAriaLabel": "菜单"
  },
  "home": {
    "title": "庄园正在建设中……",
    "subtitle": "欢迎来到 iceaxing 的数字花园",
    "imageAlt": "庄园建设中",
    "metaTitle": "iceaxing — 数字花园",
    "metaDescription": "欢迎来到 iceaxing 的个人博客，一个记录技术思考与创作的数字花园。"
  },
  "search": {
    "placeholder": "搜索文章...",
    "ariaLabel": "搜索文章",
    "triggerLabel": "搜索 (Ctrl+K)",
    "loading": "搜索中...",
    "noResults": "没有找到相关文章"
  },
  "common": {
    "home": "首页",
    "log": "日志",
    "updatedAt": "最后更新于",
    "posts": "文章",
    "collections": "合集",
    "emptyPosts": "这里还没有文章，敬请期待",
    "emptyCollections": "这个合集中还没有文章"
  },
  "subscribe": {
    "title": "订阅更新通知",
    "submit": "订阅",
    "submitting": "提交中...",
    "close": "关闭",
    "success": "订阅成功！请检查邮箱确认",
    "error": "订阅失败，请稍后重试",
    "networkError": "网络错误，请稍后重试",
    "preferencesLabel": "订阅范围（可选）",
    "preferencesHint": "可选，不选则订阅全部内容",
    "loadingOptions": "加载选项中...",
    "emptyOptions": "暂无可选分类"
  },
  "pdf": {
    "download": "下载 PDF",
    "defaultTitle": "PDF"
  }
}
```

```json
// lib/i18n/messages/en.json（对应翻译）
{
  "nav": {
    "categories": "Categories",
    "log": "Log",
    "about": "About",
    "friends": "Friends",
    "profile": "Profile",
    "search": "Search",
    "rss": "RSS",
    "home": "Home",
    "menuAriaLabel": "Menu"
  },
  "home": {
    "title": "Manor Under Construction...",
    "subtitle": "Welcome to iceaxing's digital garden",
    "imageAlt": "Manor under construction",
    "metaTitle": "iceaxing — Digital Garden",
    "metaDescription": "Welcome to iceaxing's personal blog, a digital garden for tech thoughts and creations."
  },
  "search": {
    "placeholder": "Search articles...",
    "ariaLabel": "Search articles",
    "triggerLabel": "Search (Ctrl+K)",
    "loading": "Searching...",
    "noResults": "No articles found"
  },
  "common": {
    "home": "Home",
    "log": "Log",
    "updatedAt": "Last updated on",
    "posts": "Posts",
    "collections": "Collections",
    "emptyPosts": "No posts yet, stay tuned",
    "emptyCollections": "No posts in this collection"
  },
  "subscribe": {
    "title": "Subscribe for updates",
    "submit": "Subscribe",
    "submitting": "Submitting...",
    "close": "Close",
    "success": "Subscribed! Please check your email to confirm",
    "error": "Subscription failed, please try again later",
    "networkError": "Network error, please try again later",
    "preferencesLabel": "Subscription Scope (optional)",
    "preferencesHint": "Optional. Leave empty to subscribe to all content.",
    "loadingOptions": "Loading options...",
    "emptyOptions": "No categories available"
  },
  "pdf": {
    "download": "Download PDF",
    "defaultTitle": "PDF"
  }
}
```

> **命名空间设计原则**：每个页面/功能模块一个 namespace（如 `nav`、`home`、`search`），避免将 Page Content 放入翻译文件——文章内容通过 Sanity 管理，翻译文件仅负责 UI chrome 文本。

#### 3.3.8 语言切换器

```tsx
// components/ui/language-switcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locale === 'zh' ? 'en' : 'zh';

  return (
    <button
      onClick={() => startTransition(() => router.replace(pathname, { locale: nextLocale }))}
      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      disabled={isPending}
    >
      {nextLocale === 'zh' ? '中文' : 'EN'}
    </button>
  );
}
```

> **关键陷阱——为什么不能用 `pathname.startsWith('/en')`**：
> 
> 本项目使用 `localePrefix: 'as-needed'`（默认语言 zh 不显示前缀）。在此模式下，`usePathname()` 返回的路径**始终不含 locale 前缀**——即使当前语言是 `en`，`usePathname()` 也返回 `/about` 而非 `/en/about`。用 `pathname.startsWith('/en')` 检测当前语言永远是 `false`，切语言按钮完全失效。
> 
> **正确做法**：使用 `useLocale()`（从 `next-intl` 导入）直接读取当前 locale 值（`'zh'` 或 `'en'`）。
> 
> **`useTransition` 的作用**：`router.replace()` 在 next-intl 中涉及服务端重定向，`startTransition` 将该导航标记为 React Transition，避免 UI 阻塞，同时在 `isPending` 期间禁用按钮防止重复点击。

#### 3.3.9 使用翻译

**Server Components** 使用 `getTranslations`（从 `next-intl/server` 导入）：

```tsx
import { getTranslations } from 'next-intl/server';

export default async function SomePage() {
  const t = await getTranslations('nav');
  const th = await getTranslations('home');
  return (
    <>
      <Link href="/log">{t('log')}</Link>
      <h1>{th('title')}</h1>
    </>
  );
}
```

> `getTranslations` 是 async 函数——调用时必须 `await`。不传 `locale` 参数时，自动从当前请求的异步上下文中读取（由 `setRequestLocale()` 设置）。

**Client Components** 使用 `useTranslations`（从 `next-intl` 导入）：

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function SomeClientComponent() {
  const t = useTranslations('subscribe');
  return <button>{t('submit')}</button>;
}
```

> Client Component 的 locale 来自上层的 `<NextIntlClientProvider locale={locale}>`，不需要手动传递。

**关键区分**：

| | Server Component | Client Component |
|---|---|---|
| 导入路径 | `next-intl/server` | `next-intl` |
| API | `await getTranslations('namespace')` | `useTranslations('namespace')` |
| locale 来源 | `setRequestLocale()` 的异步上下文 | `<NextIntlClientProvider locale={locale}>` |

---

#### 3.3.10 Code Review 关键发现

多轮代码审查中共发现并修复了以下问题：

| # | 严重程度 | 文件 | 问题描述 | 修复方案 |
|---|----------|------|---------|---------|
| 1 | **严重** | `components/ui/language-switcher.tsx`（教程 3.3.8） | 用 `pathname.startsWith('/en')` 检测当前语言。`localePrefix: 'as-needed'` 模式下 `usePathname()` 返回的路径**永不包含 locale 前缀**，导致该检测永远为 `false`，英文切中文按钮完全失效 | 改用 `useLocale()` hook（从 `next-intl` 导入），直接读取当前 locale 值 |
| 2 | **严重** | 教程 3.3.9 | Server Component 示例用 `useTranslations`（client hook）获取翻译，这实际上是 async 的 `getTranslations` | Server Component 应 `import { getTranslations } from 'next-intl/server'` 并使用 `await getTranslations('namespace')` |
| 3 | **中等** | `components/layout/site-footer.tsx` | `<Link href="/feed.xml">` 会被 i18n `Link` 添加 locale 前缀，英文用户访问 `/en/feed.xml` → 404 | 改用原生 `<a>` 标签，因为 `/feed.xml` 是 Route Handler 不在 `[locale]` 下 |
| 4 | **中等** | `app/sitemap.xml/route.ts` | 英文首页 `iceaxing.com/en` 的 sitemap priority 是 0.7（应为 1.0）。优先级判断 `url === siteUrl` 无法匹配 `/en` 版本的首页 | 添加 `url === \`${siteUrl}/en\`` 条件 |
| 5 | **中等** | `app/[locale]/layout.tsx` | `description` 用静态 `export const metadata` 硬编码中文，英文页面也输出"个人博客" | 改为 `generateMetadata` 动态生成，通过 `getTranslations` 读取 `home.metaDescription` |
| 6 | **低** | 教程 3.3.4 | request.ts 缺少 locale 校验逻辑——未校验的 `requestLocale` 直接拼入 `import()` 路径，非法值会抛 `MODULE_NOT_FOUND` | 加入 `routing.locales.includes()` 校验和 `defaultLocale` 回退 |
| 7 | **低** | 教程 3.3.6 | layout 示例缺少 `setRequestLocale(locale)` 和 `generateStaticParams()`，读者复制代码后面临翻译函数获取不到 locale 的问题 | 补充完整的 layout 代码，包括 locale 校验 + `setRequestLocale` + `generateStaticParams` |

**代码审查方法论**：
- 第一轮：三线并行审查——基础设施层、组件层、页面层各由一个 agent 独立审查
- 第二轮：对修复后的代码重新审查，验证 bug 修复正确性且未引入新问题
- 共发现 7 个问题（2 严重、3 中等、2 低），全部已修复

### 3.4 数据备份

[文件用途] `.github/workflows/backup-sanity.yml` 定义 GitHub Actions 工作流，每周自动导出 Sanity 数据集并提交到仓库的 `backup/` 目录。另有 `backup/RESTORE.md` 记录数据恢复步骤。

[架构背景] Sanity 托管的内容数据虽然有多版本历史，但定期导出到 Git 仓库提供了一层额外保障——即使 Sanity 项目被误删或订阅过期，博客内容仍然有离线备份。GitHub Actions 的 `schedule` 触发器让这个过程完全自动化，无需人工干预。

```yaml
# .github/workflows/backup-sanity.yml
name: Weekly Sanity Backup

on:
  schedule:
    - cron: '17 7 * * 1'  # 每周一 UTC 7:17（非整点避免请求拥堵）
  workflow_dispatch:       # 允许手动触发

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Export Sanity dataset
        run: |
          npx sanity@3 dataset export production backup/$(date +%Y-%m-%d).tar.gz --overwrite
        env:
          SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}

      - name: Commit backup
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'backup: Sanity dataset export'
          file_pattern: 'backup/*.tar.gz'
```

逐行解读：
1. `on: schedule: cron: '17 7 * * 1'` — 每周一 UTC 7:17 触发。选择 17 分而非 00 分，避免与其他整点定时任务同时涌入 GitHub Actions 队列
2. `workflow_dispatch:` — 允许在 GitHub Actions 页面手动触发，用于紧急备份或测试
3. `runs-on: ubuntu-latest` — 使用 GitHub 托管的 Ubuntu 运行器，免费额度内
4. `actions/checkout@v4` — 检出仓库代码，后续步骤才能在仓库中操作
5. `actions/setup-node@v4` — 安装 Node.js 22（当前 LTS），sanity CLI 依赖 Node 运行
6. `npx sanity@3 dataset export production backup/...tar.gz --overwrite` — 核心命令：用 Sanity CLI v3 导出 `production` 数据集。`--overwrite` 防止同一天重复运行时因文件已存在而失败
7. `SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}` — 从 GitHub Secrets 注入 Sanity API 认证 token，避免密钥明文出现在工作流文件中
8. `stefanzweifel/git-auto-commit-action@v5` — 第三方 Action，自动将导出的备份文件 commit 并 push 回仓库。`file_pattern` 确保只提交 tar.gz 文件，不误提交其他变更

> **为什么用 `npx sanity@3` 而不是 `@latest`**：`@latest` 是浮动的——一旦 Sanity CLI 发布破坏性大版本更新（v4），工作流会在下次调度时悄悄挂掉。锁定 `@3` 确保 CLI 行为可预期。


在 `backup/` 目录创建 `RESTORE.md`：

[文件用途] `backup/RESTORE.md` 记录灾难恢复步骤。关键参数 `--replace` 表示替换（而非追加）目标数据集中的现有文档。

```md
# Sanity Data Restore Guide

## Prerequisites

- Node.js 22+（用于运行 npx 调用的 Sanity CLI）
- 目标 Sanity 项目的写入权限（通过 `SANITY_AUTH_TOKEN` 环境变量或 `npx sanity@3 login`）
- 在项目根目录执行（`sanity.config.ts` 所在目录），否则需传 `--project <projectId>`

## Restore Steps

1. 从 `backup/` 目录下载最新的 `.tar.gz`
2. 在项目根目录执行：
   ```
   npx sanity@3 dataset import <file>.tar.gz production --replace
   ```
3. 在 Studio 中验证所有文档可正常访问
```

---

### 3.5 搜索与日志完善

[架构背景] Phase 2 收尾阶段的增量改进——增强已有功能而非新增独立系统。三项改进均复用 Phase 1b 中已建立的组件模式：

#### 3.5.1 搜索分类过滤

**后端**：`searchBlogs()` 增加可选 `categorySlug` 参数，根据是否传入分类构造不同的 GROQ 查询：

```ts
// lib/sanity/queries.ts
export async function searchBlogs(
  query: string,
  categorySlug?: string,
): Promise<SearchResult[]> {
  const filter = categorySlug
    ? groq`*[_type == "blog" && project->category->slug.current == $categorySlug && (
      title match $q || excerpt match $q || pt::text(body) match $q
    )] | order(publishedAt desc) [0...10]`
    : groq`*[_type == "blog" && (
      title match $q || excerpt match $q || pt::text(body) match $q
    )] | order(publishedAt desc) [0...10]`;

  const params: Record<string, string> = { q: query };
  if (categorySlug) params.categorySlug = categorySlug;

  return client.fetch(groq`${filter} {
    _id, title, "slug": slug.current, excerpt, publishedAt,
    "project": project->{title, "slug": slug.current},
    "category": project->category->{title, "slug": slug.current}
  }`, params);
}
```

API 路由增加 `category` 查询参数：

```ts
// app/api/search/route.ts
const category = request.nextUrl.searchParams.get('category') || undefined;
const results = await searchBlogs(q.trim(), category);
```

**前端**：`SearchDialog` 接收 `categories` prop，渲染分类下拉框。`SiteHeader` 将已获取的 `categories` 传入：

```tsx
// components/layout/site-header.tsx
<SearchDialog categories={categories} />
```

分类筛选状态加入 debounce effect 的依赖数组，切换分类时自动重新搜索。

#### 3.5.2 日志年份筛选

将日志 Grid 页面提取为 `LogGrid` 客户端组件（`'use client'`），接收 `logs` 数据作为 prop：

```tsx
// components/log/log-grid.tsx
const years = [...new Set(logs.map((log) => log.date.slice(0, 4)))]
  .sort((a, b) => b.localeCompare(a));
const [selectedYear, setSelectedYear] = useState(years[0] || '');
```

年份选择后通过 `logs.filter(log => log.date.startsWith(selectedYear))` 过滤，Grid 锚定到选中年份的 12 月 31 日所在周，向前绘制 52 周。年份 tabs 仅在存在多个年份时显示（`years.length > 1`）。

> **关键陷阱——时间戳 vs 日期字符串**：Sanity `date` 类型返回 `"YYYY-MM-DD"` 字符串。用 `new Date(year, month, day)` + `toISOString().split('T')[0]` 构建日期 key 会产生时区偏移——UTC+8 用户看到的 12 月 31 日会被 `toISOString()` 转成 UTC 的 12 月 30 日，导致日志出现在错误的单元格中。**正确做法**：使用本地时间 getter（`getFullYear()` + `getMonth()` + `getDate()`）并手动格式化。

#### 3.5.3 日志评论

在 `log/[slug]/page.tsx` 正文下方添加 `<GiscusComments locale={locale} />`，使用与 Blog 正文页完全相同的 `GiscusComments` 组件和 `locale` 属性。

#### 3.5.4 Code Review 关键发现

多轮代码审查中共发现并修复了以下问题：

| # | 严重程度 | 文件 | 问题描述 | 修复方案 |
|---|----------|------|---------|---------|
| 1 | **严重** | `.github/workflows/backup-sanity.yml` | `node-version: 24` 不存在（Node 24 尚未发布稳定版），workflow 直接失败 | 改为 `node-version: 22`（当前 LTS） |
| 2 | **严重** | `.github/workflows/backup-sanity.yml` | 同一天重复运行时 `sanity dataset export` 因文件已存在而失败（cron + 手动 trigger） | 添加 `--overwrite` 标志 |
| 3 | **严重** | `components/log/log-grid.tsx` | `toISOString()` 按 UTC 输出日期字符串，在 UTC+ 时区下日志会出现在错误的前一天单元格 | 改用本地时间 getter 手动格式化为 `YYYY-MM-DD` |
| 4 | **中等** | `.github/workflows/backup-sanity.yml` | `npx sanity@latest` 是浮动版本——CLI 大版本更新时静默破坏 workflow | 锁定为 `npx sanity@3` |
| 5 | **中等** | `backup/RESTORE.md` | 缺少认证步骤和项目上下文说明——用户按文档操作会在 auth 步骤失败 | 添加 Prerequisites 章节（auth、Node 版本、工作目录） |
| 6 | **低** | `backup/RESTORE.md` | 文档用裸 `sanity` 命令但 workflow 用 `npx sanity@3`——工具链不一致 | 统一为 `npx sanity@3` |
| 7 | **低** | `lib/sanity/queries.ts` | `searchBlogs` 无条件向 Sanity client 传递 `categorySlug: undefined`——虽不会报错但 params 含无用字段 | 仅在有值时才将 `categorySlug` 加入 params 对象 |
| 8 | **低** | `components/log/log-grid.tsx` | `useState(years[0])` 仅在组件挂载时初始化——ISR 刷新后 `logs` 变化但 `selectedYear` 不会自动更新 | 添加 `useEffect` 在 `years` 不再包含 `selectedYear` 时重新同步 |

---

## 附录：Phase 1a-2 依赖清单

```bash
# Phase 1a（核心依赖，版本为 2026-05 最新）
npm install next-sanity@^13 @portabletext/react@^6 @sanity/image-url@^2 katex@^0.17 markmap-lib markmap-view highlight.js
npm install -D @types/katex

# Phase 1b
npm install @giscus/react@^3 feed@^5

# Phase 2
npm install next-intl@^4 resend@^6 @react-email/components@^0
```

---

## 附录：文件清单（Phase 1b 完成时）

```
iceaxing.com/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # 首页（→ StaticHomePage）
│   ├── error.tsx                         # Error Boundary
│   ├── not-found.tsx                     # 404
│   ├── globals.css
│   ├── (site)/
│   │   ├── [category]/
│   │   │   ├── page.tsx                  # Category 页
│   │   │   └── [project]/
│   │   │       ├── page.tsx              # Project 页
│   │   │       └── [...slug]/
│   │   │           └── page.tsx          # Blog 正文页
│   ├── (pages)/
│   │   ├── about/page.tsx
│   │   ├── friends/page.tsx
│   │   ├── profile/page.tsx
│   │   └── log/
│   │       ├── page.tsx                  # 日志入口 Grid
│   │       └── [slug]/page.tsx           # 日志正文
│   ├── api/
│   │   ├── subscribe/route.ts            # Phase 2
│   │   ├── search/route.ts
│   │   ├── revalidate/route.ts
│   │   └── manor/config/route.ts         # Phase 3 空端点
│   ├── feed.xml/route.ts
│   ├── sitemap.xml/route.ts
│   └── public/robots.txt
├── components/
│   ├── blog/
│   │   ├── portable-text-renderer.tsx
│   │   ├── blog-theme-wrapper.tsx
│   │   └── custom-blocks/
│   │       ├── mindmap.tsx
│   │       ├── math-block.tsx
│   │       ├── code-block.tsx
│   │       └── pdf-embed.tsx
│   ├── comments/
│   │   └── giscus.tsx
│   ├── subscribe/
│   │   └── subscribe-form.tsx            # Phase 2
│   ├── layout/
│   │   ├── site-header.tsx
│   │   ├── site-footer.tsx
│   │   └── mobile-nav.tsx
│   ├── manor/
│   │   └── navigation-bar.tsx            # Phase 1b 占位，Phase 3 激活
│   ├── home/
│   │   └── static-homepage.tsx           # Phase 3 替换点
│   └── ui/
│       ├── search-dialog.tsx
│       ├── empty-state.tsx
│       └── language-switcher.tsx            # Phase 2
├── lib/
│   ├── sanity/
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   ├── image.ts
│   │   └── types.ts
│   ├── email/
│   │   └── templates/
│   │       └── new-post-notification.tsx  # Phase 2
│   ├── themes/
│   │   ├── default.tsx
│   │   └── terminal.tsx
│   ├── i18n/
│   │   ├── routing.ts                      # Phase 2
│   │   ├── request.ts                      # Phase 2
│   │   ├── navigation.ts                   # Phase 2
│   │   ├── zh.json                         # Phase 2
│   │   └── en.json                         # Phase 2
│   ├── env.ts
│   └── rate-limit.ts                      # Phase 2
├── middleware.ts                            # Phase 2 i18n
├── sanity/
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   └── schema/
│       ├── index.ts
│       ├── category.ts
│       ├── project.ts
│       ├── collection.ts
│       ├── blog.ts
│       ├── log.ts
│       ├── friend.ts
│       ├── profile.ts
│       └── custom-blocks/
│           ├── mindmap.ts
│           ├── math-block.ts
│           ├── code-block.ts
│           └── pdf-embed.ts
├── public/
│   ├── robots.txt
│   └── assets/
│       └── manor-under-construction.png
├── .github/workflows/
│   └── backup-sanity.yml                 # Phase 2
├── backup/
│   └── RESTORE.md                        # Phase 2
├── .env.local
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```
