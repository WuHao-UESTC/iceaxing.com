# SEO 索引与搜索结果展示修复报告

日期：2026-05-25

## 目标

在保留当前网站可见页面布局的前提下，修复搜索引擎发现不到文章、搜索结果标题/描述展示不稳定、文章 URL 可能重复收录的问题。

## 本次改动

### 1. 集中管理 SEO URL 工具

新增 `lib/seo.ts`，集中处理以下逻辑：

- 站点根地址 `SITE_URL`
- 多语言 URL 生成
- canonical URL 生成
- description fallback
- JSON-LD 输出转义

这样可以避免 `robots.txt`、`sitemap.xml`、页面 metadata 各自拼接 URL，导致生产域名、语言前缀或 canonical 不一致。

### 2. 补强全站 metadata 信号

更新 `app/[locale]/layout.tsx`：

- 增加 `metadataBase`
- 增加 canonical 与 alternate language metadata
- 增加站点级 Open Graph metadata
- 增加 Twitter card metadata
- 增加明确的 `index, follow` robots metadata
- 将原先可能出现乱码的标题模板替换为稳定格式：`%s - iceaxing`

这部分影响搜索引擎读取到的 `<head>` 信息，不改变页面布局。

### 3. 修复首页搜索结果展示信号

更新 `app/[locale]/page.tsx`：

- 增加 canonical 和 `hreflang` alternate
- 增加 Open Graph 和 Twitter metadata
- 增加 `WebSite` JSON-LD 结构化数据

首页可见布局保持不变。

### 4. 补齐静态页与列表页 metadata

以下页面已补充 canonical URL、alternate language URL 和 Open Graph URL：

- `app/[locale]/(pages)/about/page.tsx`
- `app/[locale]/(pages)/friends/page.tsx`
- `app/[locale]/(pages)/profile/page.tsx`
- `app/[locale]/(pages)/log/page.tsx`
- `app/[locale]/(site)/[category]/page.tsx`
- `app/[locale]/(site)/[category]/[project]/page.tsx`
- `app/[locale]/(site)/[category]/[project]/[...slug]/page.tsx` 中的合集列表分支

这些改动只影响 SEO metadata，不改变页面可见结构。

### 5. 修复博客正文页 canonical 与重复语言 URL 问题

更新 `app/[locale]/(site)/[category]/[project]/[...slug]/page.tsx`：

- 根据 Sanity 中的 `language` 字段为每篇文章生成唯一 canonical URL
- 增加 Article Open Graph metadata
- 增加 Twitter metadata
- 增加 `Article` JSON-LD 结构化数据
- 当文章没有 `excerpt` 时，使用 Portable Text 纯文本作为 description fallback
- 当文章通过不匹配内容语言的 locale 前缀访问时，输出 `noindex, follow`

这主要解决同一篇文章可能同时以以下两个地址被搜索引擎看到的问题：

- `https://iceaxing.com/...`
- `https://iceaxing.com/en/...`

修复后，文章只应由与内容语言匹配的规范 URL 参与索引。

### 6. 增强 Sanity 查询以支持更稳定的描述

更新 `lib/sanity/queries.ts` 和 `lib/sanity/types.ts`：

- 在博客全文查询中增加 `bodyText: pt::text(body)`
- 当文章缺少 `excerpt` 时，用正文纯文本生成 metadata description fallback

这样可以减少文章页 description 为空导致搜索引擎随意截取片段的问题。

### 7. 清理 Sitemap 输出

重建 `app/sitemap.xml/route.ts`：

- 静态页和分类/项目/合集/日志列表页继续输出中英文版本
- 博客文章只输出与内容语言匹配的 canonical URL
- 为博客和日志增加 `<lastmod>`
- 使用明确类型替代 `any`
- 按 URL 去重 sitemap 条目

这能减少重复文章 URL，并给搜索引擎更清晰的抓取和更新时间信号。

### 8. 统一 Robots 站点 URL

更新 `app/robots.txt/route.ts`，改为使用集中定义的 `SITE_URL`。

输出仍保持允许抓取：

```txt
User-agent: *
Allow: /

Sitemap: https://iceaxing.com/sitemap.xml
```

### 9. 修复 ESLint 扫描构建产物的问题

更新 `eslint.config.mjs`，增加忽略：

```txt
dist/**
```

修复前，`npm run lint` 会扫描 `dist/static/` 下的构建产物，导致 Node 堆内存溢出。

## 验证结果

已通过：

- `npx tsc --noEmit`
- `npm run build`
- 针对本次 SEO 修复涉及文件的 ESLint 检查

针对本次改动文件的 ESLint 结果：

- 0 个 error
- 3 个 warning

这 3 个 warning 是既有非阻塞问题：

- `app/[locale]/(pages)/friends/page.tsx`：`<img>` 使用警告
- `app/[locale]/(pages)/profile/page.tsx`：`t` 变量未使用
- `app/[locale]/(pages)/profile/page.tsx`：`<img>` 使用警告

完整 `npm run lint` 仍会报告项目中已有的 React lint errors，位置包括：

- `components/log/log-grid.tsx`
- `components/subscribe/subscribe-dialog.tsx`
- `components/ui/search-dialog.tsx`

这些问题不属于本次 SEO 修复范围，也没有阻塞生产构建。

## 部署后的搜索引擎操作

部署到生产环境后，建议按以下步骤处理：

1. 打开 `https://iceaxing.com/robots.txt`，确认返回 `200`。
2. 打开 `https://iceaxing.com/sitemap.xml`，确认返回 `200`。
3. 在 Google Search Console 中重新提交：
   - `https://iceaxing.com/sitemap.xml`
4. 使用 URL Inspection 请求重新索引：
   - 首页
   - 一个分类页
   - 一个项目页
   - 3 篇代表性文章页
5. 在 Bing Webmaster Tools 中重新提交 sitemap。

搜索引擎仍可能根据查询词和页面正文改写摘要。本次改动提供了更明确的 canonical、语言版本、sitemap、metadata 和结构化数据，但不能强制搜索引擎立即重新收录，也不能保证搜索结果摘要逐字使用 metadata description。

## 注意事项

本次任务开始前，工作区中已经存在一些与本次 SEO 修复无关的改动，包括订阅、邮件、API、Sanity schema 等文件。处理过程中保留了这些既有改动，没有回退。
