import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  basename,
  extension,
  normalizeLookupPath,
  normalizeVaultPath,
  OBSIDIAN_IMAGE_EXTENSIONS,
  prepareObsidianNote,
  resolveVaultTarget,
  splitMarkdownImages,
  stem,
} from '../lib/obsidian/import-core.ts';

const DEFAULT_VAULT = String.raw`E:\base_Obsidian\iceaxing's knowledge base`;
const vault = path.resolve(process.env.OBSIDIAN_VAULT_PATH || DEFAULT_VAULT);
const strict = process.argv.includes('--strict');
const skippedDirectories = new Set(['.git', '.obsidian', '.claude', '.claudian']);

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name.toLocaleLowerCase())) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolutePath));
    else output.push(absolutePath);
  }
  return output;
}

function addToIndex(map, key, value) {
  map.set(key, [...(map.get(key) ?? []), value]);
}

function resolveImage(target, notePath, index) {
  if (/^https?:\/\//i.test(target)) return target;
  let decoded = target;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    // The importer will report malformed paths as unresolved.
  }
  const clean = normalizeVaultPath(decoded.replace(/[?#].*$/, ''));
  const targetBasename = basename(clean);
  const candidates = [
    resolveVaultTarget(notePath, decoded),
    clean,
    `System/Attachments/${targetBasename}`,
  ];
  if (/\.excalidraw$/i.test(clean)) {
    candidates.unshift(
      `System/Attachments/${targetBasename}.png`,
      `System/Attachments/${clean.replace(/\.excalidraw$/i, '.png')}`,
    );
  }
  for (const candidate of candidates) {
    const result = index.byPath.get(normalizeLookupPath(candidate));
    if (result) return result;
  }
  const basenameMatches = index.byBasename.get(targetBasename.toLocaleLowerCase()) ?? [];
  if (basenameMatches.length === 1) return basenameMatches[0];
  if (!extension(clean)) {
    const stemMatches = index.byStem.get(targetBasename.toLocaleLowerCase()) ?? [];
    if (stemMatches.length === 1) return stemMatches[0];
  }
  return null;
}

async function main() {
  const files = await walk(vault);
  const notes = files
    .filter((file) => extension(file) === '.md')
    .filter((file) => basename(file).toLocaleLowerCase() !== 'claude.md')
    .filter((file) => !normalizeLookupPath(path.relative(vault, file)).startsWith('system/attachments/'));
  const images = files.filter((file) => OBSIDIAN_IMAGE_EXTENSIONS.has(extension(file)));
  const index = {
    byPath: new Map(),
    byBasename: new Map(),
    byStem: new Map(),
  };
  for (const image of images) {
    const relativePath = normalizeVaultPath(path.relative(vault, image));
    index.byPath.set(normalizeLookupPath(relativePath), relativePath);
    addToIndex(index.byBasename, basename(relativePath).toLocaleLowerCase(), relativePath);
    addToIndex(index.byStem, stem(relativePath).toLocaleLowerCase(), relativePath);
  }

  let imageReferences = 0;
  let resolvedImages = 0;
  let remoteImages = 0;
  const unresolved = [];
  const failures = [];
  for (const absolutePath of notes) {
    const relativePath = normalizeVaultPath(path.relative(vault, absolutePath));
    try {
      const [markdown, fileStats] = await Promise.all([readFile(absolutePath, 'utf8'), stat(absolutePath)]);
      const note = prepareObsidianNote({
        relativePath,
        markdown,
        createdAt: fileStats.birthtime,
        updatedAt: fileStats.mtime,
      });
      if (!note.title || !note.slug) throw new Error('缺少标题或 slug');
      for (const segment of splitMarkdownImages(note.bodyMarkdown)) {
        if (segment.type !== 'image') continue;
        imageReferences++;
        if (/^https?:\/\//i.test(segment.target)) remoteImages++;
        const resolved = resolveImage(segment.target, relativePath, index);
        if (resolved) resolvedImages++;
        else unresolved.push(`${relativePath}: ${segment.target}`);
      }
    } catch (error) {
      failures.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('Obsidian 导入预检');
  console.log(`  仓库：${vault}`);
  console.log(`  文章：${notes.length}`);
  console.log(`  可用图片：${images.length}`);
  console.log(`  图片引用：${imageReferences}`);
  console.log(`  已解析：${resolvedImages}`);
  console.log(`  远程图片：${remoteImages}`);
  console.log(`  未解析：${unresolved.length}`);
  console.log(`  解析失败：${failures.length}`);

  if (unresolved.length > 0) {
    console.log('\n未解析图片（最多显示 30 项）：');
    for (const warning of unresolved.slice(0, 30)) console.log(`  - ${warning}`);
  }
  if (failures.length > 0) {
    console.log('\n解析失败：');
    for (const failure of failures) console.log(`  - ${failure}`);
  }
  if (failures.length > 0 || (strict && unresolved.length > 0)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
