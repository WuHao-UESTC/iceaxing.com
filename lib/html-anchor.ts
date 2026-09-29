const HTML_ENTITY_VALUES: Record<string, string> = {
  amp: '&',
  apos: "'",
  colon: ':',
  gt: '>',
  lt: '<',
  quot: '"',
};

function decodeHtmlEntities(value: string) {
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
