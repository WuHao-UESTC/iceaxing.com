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

  for (const o of options) {
    if (o.type === 'category') {
      const node: TreeNode = { type: 'category', slug: o.slug, title: o.title, children: [] };
      catMap.set(o.slug, node);
      result.push(node);
    }
  }
  for (const o of options) {
    if (o.type === 'project') {
      const node: TreeNode = { type: 'project', slug: o.slug, title: o.title, parentSlug: o.parentSlug, children: [] };
      projMap.set(o.slug, node);
      const parent = catMap.get(o.parentSlug ?? '');
      if (parent) parent.children.push(node);
    }
  }
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
