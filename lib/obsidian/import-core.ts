export const OBSIDIAN_IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
]);

export type ObsidianFrontmatter = Record<string, string | string[]>;

export type MarkdownSegment =
  | { type: 'text'; value: string }
  | {
      type: 'image';
      syntax: string;
      target: string;
      alt?: string;
      caption?: string;
    };

export type PreparedObsidianNote = {
  relativePath: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  authorName?: string;
  tags: string[];
  bodyMarkdown: string;
  sourceMarkdown: string;
};

function isTemplateValue(value: string) {
  return /^\{\{[^}]+\}\}$/.test(value.trim());
}

export function parseObsidianFrontmatter(markdown: string): {
  metadata: ObsidianFrontmatter;
  body: string;
} {
  const normalized = markdown.replace(/^\uFEFF/, '');
  if (!normalized.startsWith('---\n') && !normalized.startsWith('---\r\n')) {
    return { metadata: {}, body: normalized };
  }

  const lines = normalized.split(/\r?\n/);
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (closingIndex < 0) return { metadata: {}, body: normalized };

  const metadata: ObsidianFrontmatter = {};
  let currentListKey: string | null = null;

  for (const line of lines.slice(1, closingIndex)) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentListKey) {
      const current = metadata[currentListKey];
      metadata[currentListKey] = [
        ...(Array.isArray(current) ? current : []),
        listItem[1].trim().replace(/^(['"])(.*)\1$/, '$2'),
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

function metadataString(metadata: ObsidianFrontmatter, name: string) {
  const value = metadata[name];
  if (typeof value !== 'string' || !value.trim() || isTemplateValue(value)) return undefined;
  return value.trim();
}

export function slugifyObsidianPath(value: string) {
  const normalized = value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\\/]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return Array.from(normalized || 'untitled').slice(0, 96).join('');
}

export function stripMarkdown(value: string) {
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

export function prepareObsidianNote(input: {
  relativePath: string;
  markdown: string;
  createdAt: Date;
  updatedAt: Date;
}): PreparedObsidianNote {
  const { metadata, body: rawBody } = parseObsidianFrontmatter(input.markdown);
  const heading = rawBody.match(/^\s*#\s+(.+)\s*$/m);
  const filename = basename(input.relativePath).replace(/\.md$/i, '');
  const title = metadataString(metadata, 'title') || heading?.[1].trim() || filename;
  const body = heading && heading.index !== undefined
    ? `${rawBody.slice(0, heading.index)}${rawBody.slice(heading.index + heading[0].length)}`
    : rawBody;
  const tagsValue = metadata.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue
    : typeof tagsValue === 'string'
      ? tagsValue.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];
  const slugValue = metadataString(metadata, 'slug');

  return {
    relativePath: normalizeVaultPath(input.relativePath),
    title,
    slug: slugifyObsidianPath(slugValue || input.relativePath.replace(/\.md$/i, '')),
    excerpt: stripMarkdown(body).slice(0, 180),
    publishedAt: toIsoDate(
      metadataString(metadata, 'publishedAt') ||
        metadataString(metadata, 'published') ||
        metadataString(metadata, 'date'),
      input.createdAt,
    ),
    updatedAt: input.updatedAt.toISOString(),
    authorName: metadataString(metadata, 'author'),
    tags,
    bodyMarkdown: body.trim(),
    sourceMarkdown: input.markdown,
  };
}

export function splitMarkdownImages(markdown: string): MarkdownSegment[] {
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
          alt: basename(target.trim()).replace(/\.excalidraw$/i, ''),
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
          alt: match[2].trim() || basename(target),
        });
      }
      cursor = match.index + match[0].length;
    }
    appendText(line.slice(cursor));
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: markdown }];
}

export function normalizeWikiLinks(markdown: string) {
  return markdown
    .replace(/\[\[([^\]|]+)\\?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

export function normalizeVaultPath(value: string) {
  const parts: string[] = [];
  for (const part of value.replaceAll('\\', '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

export function normalizeLookupPath(value: string) {
  return normalizeVaultPath(value).toLocaleLowerCase();
}

export function dirname(value: string) {
  const normalized = normalizeVaultPath(value);
  const index = normalized.lastIndexOf('/');
  return index < 0 ? '' : normalized.slice(0, index);
}

export function basename(value: string) {
  const clean = value.replace(/[?#].*$/, '').replaceAll('\\', '/');
  return clean.slice(clean.lastIndexOf('/') + 1);
}

export function extension(value: string) {
  const name = basename(value);
  const index = name.lastIndexOf('.');
  return index <= 0 ? '' : name.slice(index).toLocaleLowerCase();
}

export function stem(value: string) {
  const name = basename(value);
  const ext = extension(name);
  return ext ? name.slice(0, -ext.length) : name;
}

export function resolveVaultTarget(notePath: string, target: string) {
  let decoded = target;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    // Preserve malformed percent-encoded paths so the preflight can report them.
  }
  const clean = decoded.replace(/[?#].*$/, '').replaceAll('\\', '/');
  if (clean.startsWith('/')) return normalizeVaultPath(clean);
  return normalizeVaultPath(`${dirname(notePath)}/${clean}`);
}

async function digest(algorithm: 'SHA-1' | 'SHA-256', value: string) {
  const bytes = new TextEncoder().encode(value);
  const result = await globalThis.crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function deterministicObsidianDocumentId(relativePath: string) {
  const hash = await digest('SHA-1', normalizeLookupPath(relativePath));
  return `obsidian.${hash}`;
}

export function contentFingerprint(
  note: PreparedObsidianNote,
  images: Array<{ source: string; size?: number; lastModified?: number }>,
) {
  return [
    note.sourceMarkdown,
    ...images.map((image) => `${normalizeLookupPath(image.source)}:${image.size ?? ''}:${image.lastModified ?? ''}`),
  ].join('\n--obsidian-asset--\n');
}

export async function hashObsidianContent(value: string) {
  return digest('SHA-256', value);
}
