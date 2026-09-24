import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@sanity/client';

const PORTABLE_TEXT_FIELDS = ['body', 'bodyEn', 'bodyDe', 'bio'] as const;

type PortableTextItem = {
  _key?: string;
  _type?: string;
  style?: string;
  children?: unknown[];
  [key: string]: unknown;
};

type ContentDocument = {
  _id: string;
  _type: string;
  title?: string;
  name?: string;
  body?: PortableTextItem[];
  bodyEn?: PortableTextItem[];
  bodyDe?: PortableTextItem[];
  bio?: PortableTextItem[];
};

async function loadEnvironmentFile(filename: string) {
  try {
    const content = await readFile(filename, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch {
    // Environment files are optional.
  }
}

function repairArray(items: PortableTextItem[]) {
  let repairs = 0;
  const value = items.map((item) => {
    if (item._type || !Array.isArray(item.children) || typeof item.style !== 'string') {
      return item;
    }

    repairs++;
    return { ...item, _type: 'block' };
  });

  return { value, repairs };
}

async function main() {
  await loadEnvironmentFile(path.resolve('.env'));
  await loadEnvironmentFile(path.resolve('.env.local'));

  const write = process.argv.includes('--write');
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'fa79h3qq';
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN;
  if (!token) throw new Error('缺少 SANITY_API_READ_TOKEN 或 SANITY_API_WRITE_TOKEN');
  if (write && !process.env.SANITY_API_WRITE_TOKEN) {
    throw new Error('写入修复需要 SANITY_API_WRITE_TOKEN');
  }

  const client = createClient({
    projectId,
    dataset,
    token: write ? process.env.SANITY_API_WRITE_TOKEN : token,
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'raw',
  });
  const documents = await client.fetch<ContentDocument[]>(
    `*[_type in ["blog", "about", "log", "profile"]]{
      _id, _type, title, name, body, bodyEn, bodyDe, bio
    }`,
  );

  let repairedDocuments = 0;
  let repairedBlocks = 0;

  for (const document of documents) {
    const fields: Partial<Record<(typeof PORTABLE_TEXT_FIELDS)[number], PortableTextItem[]>> = {};
    let documentRepairs = 0;

    for (const field of PORTABLE_TEXT_FIELDS) {
      const current = document[field];
      if (!Array.isArray(current)) continue;
      const result = repairArray(current);
      if (result.repairs > 0) {
        fields[field] = result.value;
        documentRepairs += result.repairs;
      }
    }

    if (documentRepairs === 0) continue;
    repairedDocuments++;
    repairedBlocks += documentRepairs;
    console.log(
      `${write ? '修复' : '发现'} ${document._id} · ${document.title || document.name || '未命名'}：${documentRepairs} 个正文块`,
    );

    if (write) await client.patch(document._id).set(fields).commit();
  }

  console.log(`\n${write ? '修复完成' : '检查完成'}：${repairedDocuments} 篇文档，${repairedBlocks} 个正文块。`);
  if (!write && repairedBlocks > 0) {
    console.log('追加 --write 可写入修复。');
  }
}

main().catch((error: unknown) => {
  console.error(`修复失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
