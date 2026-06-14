type PtBlock = {
  _key: string;
  _type: string;
  style?: string;
  children?: Array<{
    text: string;
    _key: string;
    _type: string;
    marks?: string[];
  }>;
  markDefs?: Array<{ _key: string; _type: string; href?: string }>;
  level?: number;
  listItem?: string;
  [key: string]: unknown;
};

type ParsedSpan = { text: string; marks: string[]; markDef?: { _key: string; _type: string; href: string } };

function generateKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseInline(text: string): ParsedSpan[] {
  const spans: ParsedSpan[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const strikeMatch = text.slice(cursor).match(/^~~(.+?)~~/);
    const boldStarMatch = text.slice(cursor).match(/^\*\*(.+?)\*\*/);
    const boldUndMatch = text.slice(cursor).match(/^__(.+?)__/);
    const italicStarMatch = text.slice(cursor).match(/^\*(.+?)\*/);
    const italicUndMatch = text.slice(cursor).match(/^_(.+?)_/);
    const codeMatch = text.slice(cursor).match(/^`(.+?)`/);
    const linkMatch = text.slice(cursor).match(/^\[([^\]]+)\]\(([^)]+)\)/);

    type MatchEntry = {
      type: 'strong' | 'em' | 'code' | 'strike-through' | 'link';
      match: RegExpMatchArray;
      len: number;
      url?: string;
      markKey?: string;
    };

    const candidates: MatchEntry[] = [
      { type: 'strike-through', match: strikeMatch!, len: strikeMatch?.[0]?.length || 0 },
      { type: 'strong', match: boldStarMatch!, len: boldStarMatch?.[0]?.length || 0 },
      { type: 'strong', match: boldUndMatch!, len: boldUndMatch?.[0]?.length || 0 },
      { type: 'em', match: italicStarMatch!, len: italicStarMatch?.[0]?.length || 0 },
      { type: 'em', match: italicUndMatch!, len: italicUndMatch?.[0]?.length || 0 },
      { type: 'code', match: codeMatch!, len: codeMatch?.[0]?.length || 0 },
    ];

    if (linkMatch) {
      const linkKey = generateKey();
      candidates.push({ type: 'link', match: linkMatch, len: linkMatch[0].length, markKey: linkKey });
    }

    const earliest = candidates
      .filter((x) => x.match)
      .sort((a, b) => (a.match.index || 999999) - (b.match.index || 999999))[0];

    if (earliest) {
      const idx = earliest.match.index || 0;
      if (idx > 0) {
        spans.push({ text: text.slice(cursor, cursor + idx), marks: [] });
      }
      if (earliest.type === 'link') {
        spans.push({
          text: earliest.match[1],
          marks: [earliest.markKey!],
          markDef: { _key: earliest.markKey!, _type: 'link', href: earliest.match[2] },
        });
      } else {
        spans.push({ text: earliest.match[1], marks: [earliest.type] });
      }
      cursor += idx + earliest.len;
    } else {
      spans.push({ text: text.slice(cursor), marks: [] });
      break;
    }
  }

  if (spans.length === 0) spans.push({ text, marks: [] });
  return spans.filter((s) => s.text !== '');
}

function textBlock(text: string, style?: string): PtBlock {
  const parsed = parseInline(text);
  const markDefs: PtBlock['markDefs'] = [];

  const children = parsed.map((s) => {
    if (s.markDef) {
      markDefs.push(s.markDef);
    }
    return {
      text: s.text,
      _key: generateKey(),
      _type: 'span' as const,
      marks: s.marks.length > 0 ? s.marks : undefined,
    };
  });

  const block: PtBlock = {
    _key: generateKey(),
    _type: 'block',
    style: style || 'normal',
    children: children.length > 0 ? children : [{ text: '', _key: generateKey(), _type: 'span' }],
  };

  if (markDefs.length > 0) {
    block.markDefs = markDefs;
  }

  return block;
}

/** Count leading whitespace to determine nesting level (1 tab = 2 spaces). */
function getNestingLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match || !match[1]) return 0;
  const ws = match[1];
  // Count tabs as 2 spaces
  const effective = ws.replace(/\t/g, '  ').length;
  // Every 2 spaces = one level of nesting (level 1 = top level)
  return Math.floor(effective / 2);
}

export function markdownToPortableText(md: string): PtBlock[] {
  const lines = md.split('\n');
  const blocks: PtBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        _key: generateKey(),
        _type: 'codeBlock',
        language: lang || 'plain',
        code: codeLines.join('\n'),
      } as PtBlock);
      i++;
      continue;
    }

    // Divider
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      blocks.push({
        _key: generateKey(),
        _type: 'divider',
        style: 'solid',
      } as PtBlock);
      i++;
      continue;
    }

    // Heading (do not nest inside lists — must be at zero indent)
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const style = `h${level}`;
      blocks.push(textBlock(hMatch[2].trim(), style));
      i++;
      continue;
    }

    // Table (pipe-delimited rows with separator line)
    if (line.includes('|') && i + 2 < lines.length) {
      const headerMatch = line.match(/^\|?\s*([^|]+)\s*\|(.*)\|?\s*$/);
      const separatorMatch = lines[i + 1]?.match(/^\|?\s*[-:]{3,}\s*\|(.*)\|?\s*$/);
      if (headerMatch && separatorMatch) {
        const headers = [headerMatch[1].trim()];
        const rest = headerMatch[2];
        if (rest) {
          headers.push(...rest.split('|').map((c) => c.trim()));
        }

        const dataRows: Array<{ _key: string; cells: string[] }> = [];
        let ri = i + 2;
        while (ri < lines.length && lines[ri].includes('|')) {
          const cellMatch = lines[ri].match(/^\|?\s*([^|]*)\s*\|(.*)\|?\s*$/);
          if (cellMatch) {
            const cells: string[] = [cellMatch[1].trim()];
            const cellRest = cellMatch[2];
            if (cellRest) {
              cells.push(...cellRest.split('|').map((c) => c.trim()));
            }
            // Pad or trim cells to match header count
            while (cells.length < headers.length) cells.push('');
            dataRows.push({ _key: generateKey(), cells: cells.slice(0, headers.length) });
          }
          ri++;
        }
        i = ri;

        blocks.push({
          _key: generateKey(),
          _type: 'table',
          headers,
          rows: dataRows,
        } as PtBlock);
        continue;
      }
    }

    // Blockquote (collect consecutive > lines into one blockquote block)
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push(textBlock(quoteLines.join('\n'), 'blockquote'));
      continue;
    }

    // Task list (must be checked before unordered list — `- [ ]` also matches `- `)
    const taskMatch = line.match(/^(\s*)[\-\*]\s+\[([ xX])\]\s+(.*)/);
    if (taskMatch) {
      const items: { text: string; level: number; checked: boolean }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[\-\*]\s+\[([ xX])\]\s+(.*)/);
        if (!m) break;
        const level = getNestingLevel(lines[i]);
        items.push({ text: m[3], level, checked: m[2].toLowerCase() === 'x' });
        i++;
      }
      items.forEach((item) => {
        const b = textBlock(item.text);
        b.listItem = 'task';
        b.checked = item.checked;
        if (item.level > 0) b.level = item.level + 1;
        blocks.push(b);
      });
      continue;
    }

    // Unordered list (with optional leading whitespace for nesting)
    const ulMatch = line.match(/^(\s*)[\-\*]\s+(.*)/);
    if (ulMatch) {
      const items: { text: string; level: number }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[\-\*]\s+(.*)/);
        if (!m) break;
        const level = getNestingLevel(lines[i]);
        items.push({ text: m[2], level });
        i++;
      }
      items.forEach((item) => {
        const b = textBlock(item.text);
        b.listItem = 'bullet';
        if (item.level > 0) b.level = item.level + 1; // Portable Text level is 1-based
        blocks.push(b);
      });
      continue;
    }

    // Ordered list (with optional leading whitespace for nesting)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      const items: { text: string; level: number }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)/);
        if (!m) break;
        const level = getNestingLevel(lines[i]);
        items.push({ text: m[2], level });
        i++;
      }
      items.forEach((item) => {
        const b = textBlock(item.text);
        b.listItem = 'number';
        if (item.level > 0) b.level = item.level + 1;
        blocks.push(b);
      });
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push(textBlock(line.trim()));
    i++;
  }

  return blocks;
}
