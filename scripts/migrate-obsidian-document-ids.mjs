import { createHash } from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';
import { createClient } from '@sanity/client';

function loadEnvironmentFile(filename) {
  if (!fs.existsSync(filename)) return;
  for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function deterministicId(source) {
  const normalized = source
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .toLocaleLowerCase();
  const digest = createHash('sha1').update(normalized).digest('hex');
  return `obsidian-${digest}`;
}

function migratedId(document) {
  const baseId = deterministicId(document.obsidianSource);
  return document._id.startsWith('drafts.') ? `drafts.${baseId}` : baseId;
}

function withoutSystemFields(document, targetId) {
  const migrated = { ...document, _id: targetId };
  delete migrated._rev;
  delete migrated._createdAt;
  delete migrated._updatedAt;
  delete migrated._originalId;
  return migrated;
}

async function main() {
  loadEnvironmentFile('.env');
  loadEnvironmentFile('.env.local');

  const write = process.argv.includes('--write');
  const projectSlug = optionValue('--project');
  const projectStatus = optionValue('--project-status');
  if (projectStatus && !['planned', 'ongoing', 'completed'].includes(projectStatus)) {
    throw new Error('--project-status 仅支持 planned、ongoing 或 completed');
  }
  if (projectStatus && !projectSlug) {
    throw new Error('--project-status 必须与 --project 一起使用');
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (write && !token) throw new Error('写入模式缺少 SANITY_API_WRITE_TOKEN');
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    token,
    apiVersion: '2025-02-19',
    useCdn: false,
    perspective: 'raw',
  });

  const summaries = await client.fetch(`
    *[_type == "blog" && defined(obsidianSource)] {
      _id,
      _type,
      obsidianSource,
      title
    }
  `);
  const legacy = summaries.filter((document) => {
    const baseId = document._id.replace(/^drafts\./, '');
    return baseId.startsWith('obsidian.');
  });
  const plans = legacy.map((document) => ({
    ...document,
    targetId: migratedId(document),
  }));

  const duplicateTargets = plans.filter((plan, index) =>
    plans.findIndex((candidate) => candidate.targetId === plan.targetId) !== index
  );
  if (duplicateTargets.length > 0) {
    throw new Error(`迁移目标 ID 重复：${duplicateTargets.map((item) => item.targetId).join(', ')}`);
  }

  const targetIds = plans.map((plan) => plan.targetId);
  const existingTargets = targetIds.length > 0
    ? await client.fetch(
        `*[_id in $ids]{_id, _type, obsidianSource, title}`,
        { ids: targetIds },
        { perspective: 'raw' },
      )
    : [];
  const conflictingTargets = existingTargets.filter((target) => {
    const plan = plans.find((candidate) => candidate.targetId === target._id);
    return !plan || plan.obsidianSource !== target.obsidianSource;
  });
  if (conflictingTargets.length > 0) {
    throw new Error(`目标 ID 已被其他文档占用：${conflictingTargets.map((item) => item._id).join(', ')}`);
  }

  const inboundReferences = [];
  for (const plan of plans) {
    const references = await client.fetch(
      `*[_id != $id && references($id)]{_id, _type}`,
      { id: plan._id },
      { perspective: 'raw' },
    );
    if (references.length > 0) inboundReferences.push({ plan, references });
  }
  if (inboundReferences.length > 0) {
    const details = inboundReferences
      .map(({ plan, references }) => `${plan._id} <- ${references.map((item) => item._id).join(', ')}`)
      .join('; ');
    throw new Error(`检测到指向旧文档的引用，已停止迁移：${details}`);
  }

  let project;
  if (projectSlug) {
    project = await client.fetch(
      `*[_type == "project" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id, title, status, "slug": slug.current}`,
      { slug: projectSlug },
      { perspective: 'raw' },
    );
    if (!project) throw new Error(`找不到已发布 Project：${projectSlug}`);
  }

  console.log(`${write ? '执行迁移' : '迁移预检'}：${plans.length} 篇旧 ID 文档`);
  for (const plan of plans) {
    console.log(`  ${plan._id} -> ${plan.targetId}  ${plan.title || plan.obsidianSource}`);
  }
  if (project && projectStatus) {
    console.log(`  Project ${project.slug}: ${project.status || '(empty)'} -> ${projectStatus}`);
  }

  if (!write) {
    console.log('\n未写入任何数据；确认后追加 --write。');
    return;
  }

  for (const plan of plans) {
    const source = await client.getDocument(plan._id);
    if (!source) throw new Error(`迁移时找不到源文档：${plan._id}`);
    const target = withoutSystemFields(source, plan.targetId);
    await client.transaction()
      .createOrReplace(target)
      .delete(plan._id)
      .commit({ visibility: 'sync' });
    console.log(`  ✓ ${plan.targetId}`);
  }

  if (project && projectStatus && project.status !== projectStatus) {
    await client.patch(project._id).set({ status: projectStatus }).commit({ visibility: 'sync' });
    console.log(`  ✓ Project 状态已更新为 ${projectStatus}`);
  }

  console.log('\n迁移完成。');
}

main().catch((error) => {
  console.error(`\n迁移失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
