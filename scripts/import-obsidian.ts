import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient, type SanityClient } from '@sanity/client';
import {
  markdownToPortableText,
  type PtBlock,
} from '../sanity/components/markdown-paste/markdownHandler';

const DEFAULT_VAULT = String.raw`E:\base_Obsidian\iceaxing's knowledge base`;
const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
]);

type ImportOptions = {
  source?: string;
  vault: string;
  project?: string;
  category?: string;
  collection?: string;
  write: boolean;
  publish: boolean;
  help: boolean;
};

type Frontmatter = Record<string, string | string[]>;

type MarkdownSegment =
  | { type: 'text'; value: string }
  | {
      type: 'image';
      syntax: string;
      target: string;
      alt?: string;
      caption?: string;
    };

type ImageIndex = {
  byRelativePath: Map<string, string>;
  byBasename: Map<string, string[]>;
  byStem: Map<string, string[]>;
};

type PreparedNote = {
  absolutePath: string;
  relativePath: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  authorName?: string;
  tags: string[];
  bodyMarkdown: string;
};

type ImportStats = {
  notes: number;
  images: number;
  uploadedImages: number;
  unresolvedImages: number;
  warnings: string[];
};

function printHelp() {
  console.log(`
Obsidian → Sanity 导入工具

用法：
  npm run import:obsidian -- --source <笔记或目录> [选项]

选项：
  --vault <目录>       Obsidian 仓库目录
  --source <路径>      仓库内的 Markdown 文件或目录
  --project <slug/id>  导入到指定项目
  --category <slug/id> 导入为指定分类下的独立文章
  --collection <slug/id> 导入到指定合集（需要同时提供 --project）
  --write              实际上传图片并写入 Sanity；省略时只做预检
  --publish            直接写入已发布文档；默认创建草稿
  --help               显示帮助

示例：
  npm run import:obsidian -- --source "AI/周志华-机器学习/绪论.md" --project machine-learning
  npm run import:obsidian -- --source "AI/周志华-机器学习" --project machine-learning --write

实际写入需要 SANITY_API_WRITE_TOKEN。项目和数据集默认读取
NEXT_PUBLIC_SANITY_PROJECT_ID 与 NEXT_PUBLIC_SANITY_DATASET。
`);
}

function parseArguments(args: string[]): ImportOptions {
  const options: ImportOptions = {
    vault: process.env.OBSIDIAN_VAULT_PATH || DEFAULT_VAULT,
    write: false,
    publish: false,
    help: false,
  };

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    const next = () => {
      const value = args[++index];
      if (!value) throw new Error(`${argument} 缺少参数`);
      return value;
    };

    switch (argument) {
      case '--source':
        options.source = next();
        break;
      case '--vault':
        options.vault = next();
        break;
      case '--project':
        options.project = next();
        break;
      case '--category':
        options.category = next();
        break;
      case '--collection':
        options.collection = next();
        break;
      case '--write':
        options.write = true;
        break;
      case '--publish':
        options.publish = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`未知参数：${argument}`);
    }
  }

  return options;
}

async function loadEnvironmentFile(filename: string) {
  try {
    const content = await readFile(filename, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      const rawValue = match[2].trim();
      process.env[match[1]] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch {
    // Environment files are optional.
  }
}

function normalizeLookupPath(value: string) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '').toLocaleLowerCase();
}

function key() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseFrontmatter(markdown: string): {
  metadata: Frontmatter;
  body: string;
} {
  if (!markdown.startsWith('---\n') && !markdown.startsWith('---\r\n')) {
    return { metadata: {}, body: markdown };
  }

  const lines = markdown.split(/\r?\n/);
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (closingIndex < 0) return { metadata: {}, body: markdown };

  const metadata: Frontmatter = {};
  let currentListKey: string | null = null;

  for (const line of lines.slice(1, closingIndex)) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentListKey) {
      const current = metadata[currentListKey];
      metadata[currentListKey] = [
        ...(Array.isArray(current) ? current : []),
        listItem[1].trim(),
      ];
      continue;
    }

    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    const [, name, rawValue] = field;
    const value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');

    if (!value) {
      currentListKey = name;
      metadata[name] = [];
    } else if (value.startsWith('[') && value.endsWith(']')) {
      currentListKey = null;
      metadata[name] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^(['"])(.*)\1$/, '$2'))
        .filter(Boolean);
    } else {
      currentListKey = null;
      metadata[name] = value;
    }
  }

  return {
    metadata,
    body: lines.slice(closingIndex + 1).join('\n'),
  };
}

function metadataString(metadata: Frontmatter, name: string) {
  const value = metadata[name];
  return typeof value === 'string' ? value : undefined;
}

function slugify(value: string) {
  const normalized = value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\\/]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return Array.from(normalized || 'untitled').slice(0, 96).join('');
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[\[[^\]]+\]\]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[#>*_`~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(value: string | undefined, fallback: Date) {
  const expanded = value && /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
  const parsed = expanded ? new Date(expanded) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

async function prepareNote(absolutePath: string, vault: string): Promise<PreparedNote> {
  const markdown = await readFile(absolutePath, 'utf8');
  const fileStats = await stat(absolutePath);
  const relativePath = path.relative(vault, absolutePath).replaceAll('\\', '/');
  const { metadata, body: rawBody } = parseFrontmatter(markdown);
  const heading = rawBody.match(/^\s*#\s+(.+)\s*$/m);
  const title = metadataString(metadata, 'title') || heading?.[1].trim() || path.parse(absolutePath).name;
  const body = heading && heading.index !== undefined
    ? `${rawBody.slice(0, heading.index)}${rawBody.slice(heading.index + heading[0].length)}`
    : rawBody;
  const tagsValue = metadata.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue
    : typeof tagsValue === 'string'
      ? tagsValue.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

  return {
    absolutePath,
    relativePath,
    title,
    slug: slugify(metadataString(metadata, 'slug') || relativePath.replace(/\.md$/i, '')),
    excerpt: stripMarkdown(body).slice(0, 180),
    publishedAt: toIsoDate(
      metadataString(metadata, 'publishedAt') ||
        metadataString(metadata, 'published') ||
        metadataString(metadata, 'date'),
      fileStats.birthtime,
    ),
    updatedAt: fileStats.mtime.toISOString(),
    authorName: metadataString(metadata, 'author'),
    tags,
    bodyMarkdown: body.trim(),
  };
}

function splitImages(markdown: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const pattern = /!\[\[([^\]]+)\]\]|!\[([^\]]*)\]\(([^)\n]+)\)/g;
  let inFence: '`' | '~' | null = null;

  const appendText = (value: string) => {
    if (!value) return;
    const previous = segments.at(-1);
    if (previous?.type === 'text') previous.value += value;
    else segments.push({ type: 'text', value });
  };

  for (const line of markdown.match(/[^\r\n]*(?:\r?\n|$)/g) ?? []) {
    if (!line) continue;
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[1][0] as '`' | '~';
      if (inFence === marker) inFence = null;
      else if (!inFence) inFence = marker;
      appendText(line);
      continue;
    }
    if (inFence) {
      appendText(line);
      continue;
    }

    let cursor = 0;
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(line)) !== null) {
      const precedingBackticks = line.slice(0, match.index).match(/(?<!\\)`/g)?.length ?? 0;
      if (precedingBackticks % 2 === 1) continue;

      appendText(line.slice(cursor, match.index));

      if (match[1] !== undefined) {
        const [target, ...aliases] = match[1].split('|');
        const alias = aliases.join('|').trim();
        segments.push({
          type: 'image',
          syntax: match[0],
          target: target.trim(),
          alt: path.parse(target.trim()).name.replace(/\.excalidraw$/i, ''),
          caption: alias && !/^\d+(?:x\d+)?$/i.test(alias) ? alias : undefined,
        });
      } else {
        let target = match[3].trim();
        if (target.startsWith('<') && target.includes('>')) {
          target = target.slice(1, target.indexOf('>'));
        } else {
          target = target.split(/\s+["']/)[0];
        }
        segments.push({
          type: 'image',
          syntax: match[0],
          target,
          alt: match[2].trim() || path.parse(target).name,
        });
      }

      cursor = match.index + match[0].length;
    }
    appendText(line.slice(cursor));
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: markdown }];
}

function normalizeWikiLinks(markdown: string) {
  return markdown
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

async function walkFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === '.obsidian' || entry.name === '.claude') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(entryPath));
    else files.push(entryPath);
  }

  return files;
}

async function collectNotes(source: string) {
  const sourceStats = await stat(source);
  if (sourceStats.isFile()) {
    if (path.extname(source).toLocaleLowerCase() !== '.md') {
      throw new Error('仅支持 Markdown 文件');
    }
    return [source];
  }

  const files = await walkFiles(source);
  return files
    .filter((file) => path.extname(file).toLocaleLowerCase() === '.md')
    .filter((file) => path.basename(file).toLocaleLowerCase() !== 'claude.md')
    .filter((file) => !normalizeLookupPath(file).includes('/system/attachments/'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

async function buildImageIndex(vault: string): Promise<ImageIndex> {
  const byRelativePath = new Map<string, string>();
  const byBasename = new Map<string, string[]>();
  const byStem = new Map<string, string[]>();
  const files = await walkFiles(vault);

  for (const file of files) {
    const extension = path.extname(file).toLocaleLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) continue;

    const relative = normalizeLookupPath(path.relative(vault, file));
    const basename = path.basename(file).toLocaleLowerCase();
    const stem = path.parse(file).name.toLocaleLowerCase();
    byRelativePath.set(relative, file);
    byBasename.set(basename, [...(byBasename.get(basename) ?? []), file]);
    byStem.set(stem, [...(byStem.get(stem) ?? []), file]);
  }

  return { byRelativePath, byBasename, byStem };
}

function resolveLocalImage(
  target: string,
  notePath: string,
  vault: string,
  index: ImageIndex,
): string | null {
  let decoded = target;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    // Keep the original path when percent decoding fails.
  }

  const cleanTarget = decoded.replace(/[?#].*$/, '').replaceAll('\\', '/');
  const noteDirectory = path.dirname(notePath);
  const exactCandidates = [
    path.resolve(noteDirectory, cleanTarget),
    path.resolve(vault, cleanTarget.replace(/^\//, '')),
    path.resolve(vault, 'System', 'Attachments', path.basename(cleanTarget)),
  ];

  if (/\.excalidraw$/i.test(cleanTarget)) {
    exactCandidates.unshift(
      path.resolve(vault, 'System', 'Attachments', `${path.basename(cleanTarget)}.png`),
      path.resolve(vault, 'System', 'Attachments', cleanTarget.replace(/\.excalidraw$/i, '.png')),
    );
  }

  for (const candidate of exactCandidates) {
    const match = index.byRelativePath.get(normalizeLookupPath(path.relative(vault, candidate)));
    if (match) return match;
  }

  const basename = path.basename(cleanTarget).toLocaleLowerCase();
  const basenameMatches = index.byBasename.get(basename) ?? [];
  if (basenameMatches.length === 1) return basenameMatches[0];

  if (!path.extname(cleanTarget)) {
    const stemMatches = index.byStem.get(basename) ?? [];
    if (stemMatches.length === 1) return stemMatches[0];
  }

  return null;
}

async function uploadImage(
  client: SanityClient,
  source: string,
  cache: Map<string, string>,
) {
  const cached = cache.get(source);
  if (cached) return cached;

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`下载失败 (${response.status})`);
    const pathname = new URL(source).pathname;
    const asset = await client.assets.upload('image', Buffer.from(await response.arrayBuffer()), {
      filename: path.basename(pathname) || 'remote-image',
      contentType: response.headers.get('content-type') || undefined,
    });
    cache.set(source, asset._id);
    return asset._id;
  }

  const asset = await client.assets.upload('image', createReadStream(source), {
    filename: path.basename(source),
  });
  cache.set(source, asset._id);
  return asset._id;
}

async function buildPortableText(
  note: PreparedNote,
  vault: string,
  imageIndex: ImageIndex,
  client: SanityClient | null,
  imageCache: Map<string, string>,
  stats: ImportStats,
) {
  const body: PtBlock[] = [];

  for (const segment of splitImages(note.bodyMarkdown)) {
    if (segment.type === 'text') {
      body.push(...markdownToPortableText(normalizeWikiLinks(segment.value)));
      continue;
    }

    stats.images++;
    const isRemote = /^https?:\/\//i.test(segment.target);
    const imageSource = isRemote
      ? segment.target
      : resolveLocalImage(segment.target, note.absolutePath, vault, imageIndex);

    if (!imageSource) {
      stats.unresolvedImages++;
      const excalidrawHint = /\.excalidraw(?:\.md)?$/i.test(segment.target)
        ? '（Excalidraw 源文件需先导出为 PNG 或 SVG）'
        : '';
      stats.warnings.push(
        `${note.relativePath}: 无法解析图片 ${segment.target}${excalidrawHint}`,
      );
      body.push(...markdownToPortableText(segment.syntax));
      continue;
    }

    const assetId = client
      ? await uploadImage(client, imageSource, imageCache)
      : `image-dry-run-${createHash('sha1').update(imageSource).digest('hex')}-1x1-png`;
    if (client) stats.uploadedImages++;

    body.push({
      _key: key(),
      _type: 'image',
      asset: { _type: 'reference', _ref: assetId },
      alt: segment.alt,
      caption: segment.caption,
    });
  }

  return body;
}

async function resolveReference(client: SanityClient, type: string, value: string) {
  const id = await client.fetch<string | null>(
    `*[_type == $type && (_id == $value || slug.current == $value)][0]._id`,
    { type, value },
  );
  if (!id) throw new Error(`找不到 ${type}：${value}`);
  return id.replace(/^drafts\./, '');
}

function deterministicDocumentId(relativePath: string) {
  const digest = createHash('sha1')
    .update(normalizeLookupPath(relativePath))
    .digest('hex');
  return `obsidian.${digest}`;
}

async function main() {
  await loadEnvironmentFile(path.resolve('.env'));
  await loadEnvironmentFile(path.resolve('.env.local'));

  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.source) throw new Error('请通过 --source 指定笔记或目录');
  if (options.project && options.category) {
    throw new Error('--project 与 --category 只能选择一个');
  }
  if (options.collection && !options.project) {
    throw new Error('--collection 必须与 --project 一起使用');
  }
  if (options.write && !options.project && !options.category) {
    throw new Error('实际写入时必须指定 --project 或 --category');
  }
  if (options.publish && !options.write) {
    throw new Error('--publish 需要与 --write 一起使用');
  }

  const vault = path.resolve(options.vault);
  await access(vault);
  const source = path.isAbsolute(options.source)
    ? path.resolve(options.source)
    : path.resolve(vault, options.source);
  const relativeSource = path.relative(vault, source);
  if (relativeSource.startsWith('..') || path.isAbsolute(relativeSource)) {
    throw new Error('--source 必须位于指定的 Obsidian 仓库中');
  }

  const notePaths = await collectNotes(source);
  if (notePaths.length === 0) throw new Error('没有找到可导入的 Markdown 文件');

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'fa79h3qq';
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (options.write && !token) throw new Error('缺少 SANITY_API_WRITE_TOKEN');

  const client = options.write
    ? createClient({
        projectId,
        dataset,
        token,
        apiVersion: '2024-01-01',
        useCdn: false,
      })
    : null;
  const projectRef = client && options.project
    ? await resolveReference(client, 'project', options.project)
    : undefined;
  const categoryRef = client && options.category
    ? await resolveReference(client, 'category', options.category)
    : undefined;
  const collectionRef = client && options.collection
    ? await resolveReference(client, 'collection', options.collection)
    : undefined;

  const imageIndex = await buildImageIndex(vault);
  const imageCache = new Map<string, string>();
  const stats: ImportStats = {
    notes: 0,
    images: 0,
    uploadedImages: 0,
    unresolvedImages: 0,
    warnings: [],
  };

  console.log(`${options.write ? '开始导入' : '开始预检'}：${notePaths.length} 篇笔记`);

  for (const notePath of notePaths) {
    const note = await prepareNote(notePath, vault);
    const body = await buildPortableText(
      note,
      vault,
      imageIndex,
      client,
      imageCache,
      stats,
    );
    const baseId = deterministicDocumentId(note.relativePath);
    const documentId = options.publish ? baseId : `drafts.${baseId}`;
    const document = {
      _id: documentId,
      _type: 'blog',
      title: note.title,
      slug: { _type: 'slug', current: note.slug },
      body,
      excerpt: note.excerpt,
      language: 'zh',
      theme: 'default',
      publishedAt: note.publishedAt,
      updatedAt: note.updatedAt,
      authorName: note.authorName,
      tags: note.tags,
      obsidianSource: note.relativePath,
      ...(projectRef
        ? { project: { _type: 'reference', _ref: projectRef } }
        : categoryRef
          ? { category: { _type: 'reference', _ref: categoryRef } }
          : {}),
      ...(collectionRef
        ? { collection: { _type: 'reference', _ref: collectionRef } }
        : {}),
    };

    if (client) {
      await client.createOrReplace(document);
    }
    stats.notes++;
    console.log(`  ${client ? '✓' : '·'} ${note.relativePath} → ${note.title}`);
  }

  console.log(`\n${options.write ? '导入完成' : '预检完成'}`);
  console.log(`  笔记：${stats.notes}`);
  console.log(`  图片引用：${stats.images}`);
  console.log(`  已上传：${stats.uploadedImages}`);
  console.log(`  未解析：${stats.unresolvedImages}`);

  if (stats.warnings.length > 0) {
    console.log('\n需要处理：');
    for (const warning of stats.warnings) console.log(`  - ${warning}`);
  }

  if (!options.write) {
    console.log('\n当前为预检模式；确认结果后追加 --write 即可创建 Sanity 草稿。');
  }
}

main().catch((error: unknown) => {
  console.error(`\n导入失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
