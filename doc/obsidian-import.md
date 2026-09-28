# 从 Obsidian 导入文章

项目内置的导入工具会读取 Markdown、解析 Obsidian 图片引用、上传本地图片到 Sanity，并创建包含 Portable Text 正文的博客草稿。

## Studio 图形界面（推荐）

运行 Sanity Studio：

```powershell
npm run studio
```

打开顶部的“Obsidian 导入”工具，第一次点击“选择 Obsidian 仓库”，选择仓库根目录：

```text
E:\base_Obsidian\iceaxing's knowledge base
```

之后可以搜索、按目录筛选并勾选单篇或多篇文章。执行“预检”后，工具会显示文章是新增、有更新还是无变化，并列出无法解析的图片。选择 Category、Project 和可选的 Collection 后即可导入。

- 独立文章直接选择 Category。
- 项目文章先用 Category 筛选 Project，再选择 Project；文章会从 Project 继承 Category。
- Collection 必须属于所选 Project。
- 默认只写入草稿；直接发布需要额外确认。
- 更新现有文章时保留翻译、封面、主题等 Sanity 手工字段。
- 无法解析的图片默认阻止导入，也可以明确选择保留原始 Markdown 语法后继续。
- 浏览器需要支持 File System Access API，推荐使用最新版 Chrome 或 Edge。

工具会记住最近选择的仓库句柄。浏览器撤销权限后，需要点击“恢复仓库”重新授权。

### 一键同步已导入文章

修改 Obsidian 中的文章后，点击工具顶部的“一键同步已导入文章”即可：

- 自动重新扫描最近使用的仓库，不需要再次勾选文章。
- 只检查已经带有 `obsidianSource` 的网页文章，并通过内容指纹跳过没有变化的文章。
- 同步标题、slug、正文、摘要、日期、作者、标签和图片。
- 保留文章原有的草稿/发布状态，以及 Category、Project、Collection、封面、主题和翻译等 Sanity 手工字段。
- 本地找不到源文件时只报告问题，不会删除网页文章。
- 图片无法解析时默认停止整批同步；可以在发布设置中启用“允许缺失图片”后重试。

## 本地只读验证

下面的命令会扫描真实仓库、解析所有文章和图片引用，但不会连接或修改 Sanity：

```powershell
npm run validate:obsidian
```

追加 `-- --strict` 后，存在未解析图片也会返回失败状态，适合在发布前检查。

## 旧文档 ID 迁移

早期导入器使用了包含句点的 `obsidian.<hash>` 文档 ID。Sanity 的公开查询不会返回 ID 中含句点的文档，因此这些文章需要迁移到 `obsidian-<hash>`。先预检：

```powershell
npm run migrate:obsidian-ids -- --project razavi-analog-ic-design-note --project-status ongoing
```

确认没有 ID 冲突和入站引用后执行：

```powershell
npm run migrate:obsidian-ids -- --project razavi-analog-ic-design-note --project-status ongoing --write
```

脚本会逐篇在同一事务中创建新 ID 并删除旧 ID，正文中的 Sanity 图片资产引用不会改变。

## 预检

先运行预检。预检不会连接或修改 Sanity：

```powershell
npm run import:obsidian -- --source "AI/周志华-机器学习/绪论.md" --project machine-learning
```

`--source` 可以是单篇笔记，也可以是目录。目录会递归导入 Markdown，同时自动忽略 `CLAUDE.md`、隐藏配置目录和 `System/Attachments` 中的 Excalidraw 源文档。

工具支持：

- Obsidian 嵌入：`![[图片.png]]`、`![[图片.png|宽度]]`
- 标准 Markdown：`![说明](images/example.jpg)`
- 相对路径、仓库绝对路径以及 Obsidian 配置的 `System/Attachments` 目录
- YAML Frontmatter 中的 `title`、`date`、`publishedAt`、`author`、`tags` 和 `slug`
- 普通 Wikilink：`[[文章]]`、`[[文章|显示文本]]`

## 写入草稿

创建一个具有 Editor 权限的 Sanity Token，并在当前 PowerShell 会话中设置：

```powershell
$env:SANITY_API_WRITE_TOKEN = "你的 token"
```

确认预检结果后追加 `--write`：

```powershell
npm run import:obsidian -- --source "AI/周志华-机器学习" --project machine-learning --write
```

也可以把文章导入为分类下的独立文章：

```powershell
npm run import:obsidian -- --source "Reading Note" --category reading --write
```

合集文章同时指定项目和合集：

```powershell
npm run import:obsidian -- --source "IC/某本教材" --project analog-ic --collection textbook-notes --write
```

默认写入草稿。只有明确追加 `--publish` 时才直接创建已发布文档。

每篇文档的 ID 根据笔记相对路径稳定生成，因此再次运行同一命令会更新对应草稿，不会重复创建文章。再次导入也会覆盖该草稿中已手工修改的字段，发布前应先决定由 Obsidian 还是 Sanity 作为该文章的主编辑源。

## Excalidraw

`.excalidraw.md` 是绘图源数据，浏览器不能直接显示。预检会列出这类未解析引用。将对应绘图从 Obsidian 导出为同名 PNG 或 SVG 并放入 `System/Attachments` 后，再次运行导入即可自动识别，无需在 Sanity 中逐张插入。
