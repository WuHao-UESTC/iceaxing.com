const HTML_ENTITY_VALUES: Record<string, string> = {
  amp: '&',
  apos: "'",
  colon: ':',
  gt: '>',
  lt: '<',
  quot: '"',
};

export function decodeHtmlEntities(value: string) {
  return value.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#')) {
      const hexadecimal = code[1]?.toLocaleLowerCase() === 'x';
      const codePoint = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      if (!Number.isFinite(codePoint)) return entity;
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return entity;
      }
    }

    return HTML_ENTITY_VALUES[code.toLocaleLowerCase()] ?? entity;
  });
}

export interface HtmlAnchorReference {
  href: string;
  label: string;
}

/** Parse a raw HTML anchor only when it points to a safe in-page fragment. */
export function extractHtmlAnchorReference(tag: string): HtmlAnchorReference | undefined {
  const tagMatch = tag.match(/^<a\b([^>]*)>([\s\S]*?)<\/a\s*>$/i);
  if (!tagMatch) return undefined;

  const hrefMatch = tagMatch[1].match(
    /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
  );
  const rawHref = decodeHtmlEntities(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '');
  const anchorId = rawHref.startsWith('#') ? normalizeHtmlAnchorId(rawHref) : undefined;
  if (!anchorId) return undefined;

  return {
    href: `#${anchorId}`,
    label: decodeHtmlEntities(tagMatch[2].replace(/<[^>]*>/g, '')),
  };
}

/** Parse exporter-generated `<span id label>[label]</span>` anchor placeholders. */
export function extractHtmlSpanAnchorId(tag: string): string | undefined {
  const tagMatch = tag.match(/^<span\b([^>]*)>([\s\S]*?)<\/span\s*>$/i);
  if (!tagMatch) return undefined;

  const anchorId = extractHtmlAnchorId(tagMatch[1]);
  if (!anchorId) return undefined;

  const content = decodeHtmlEntities(tagMatch[2].replace(/<[^>]*>/g, '')).trim();
  if (!content) return anchorId;

  const labelMatch = tagMatch[1].match(
    /(?:^|\s)label\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
  );
  const labelId = normalizeHtmlAnchorId(
    labelMatch?.[1] ?? labelMatch?.[2] ?? labelMatch?.[3],
  );

  return labelId === anchorId && content === `[${labelId}]` ? anchorId : undefined;
}

export function normalizeHtmlAnchorId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = decodeHtmlEntities(value).trim().replace(/^#/, '');
  return normalized && !/[\s"'<>]/.test(normalized) ? normalized : undefined;
}

export function extractHtmlAnchorId(tag: string): string | undefined {
  const match = tag.match(
    /(?:^|\s)(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\u0060]+))/i,
  );
  return normalizeHtmlAnchorId(match?.[1] ?? match?.[2] ?? match?.[3]);
}
