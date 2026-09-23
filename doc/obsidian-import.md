# 从 Obsidian 导入文章

项目内置的导入工具会读取 Markdown、解析 Obsidian 图片引用、上传本地图片到 Sanity，并创建包含 Portable Text 正文的博客草稿。

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
