import MarkdownIt from 'markdown-it';
import markdownItKatexExport from '@vscode/markdown-it-katex';

type MarkDef = { _key: string; _type: string; href?: string };

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
  markDefs?: MarkDef[];
  level?: number;
  listItem?: string;
  [key: string]: unknown;
};

type ParsedSpan = { text: string; marks: string[] };

const markdownItKatex = (
  markdownItKatexExport as typeof markdownItKatexExport & {
    default?: typeof markdownItKatexExport;
  }
).default ?? markdownItKatexExport;

const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
}).use(markdownItKatex, { throwOnError: false });

function generateKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseInline(text: string): { spans: ParsedSpan[]; markDefs: MarkDef[] } {
  const spans: ParsedSpan[] = [];
  const markDefs: MarkDef[] = [];
  const activeMarks: string[] = [];
  const linkMarks: string[] = [];
  const tokens = markdown.parseInline(text, {})[0]?.children ?? [];

  const pushSpan = (content: string, extraMarks: string[] = []) => {
    if (!content) return;
    spans.push({ text: content, marks: [...activeMarks, ...extraMarks] });
  };

  const closeMark = (mark: string) => {
    const index = activeMarks.lastIndexOf(mark);
    if (index >= 0) activeMarks.splice(index, 1);
  };

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        pushSpan(token.content);
        break;
      case 'strong_open':
        activeMarks.push('strong');
        break;
      case 'strong_close':
        closeMark('strong');
        break;
      case 'em_open':
        activeMarks.push('em');
        break;
      case 'em_close':
        closeMark('em');
        break;
      case 's_open':
        activeMarks.push('strike-through');
        break;
      case 's_close':
        closeMark('strike-through');
        break;
      case 'code_inline':
        pushSpan(token.content, ['code']);
        break;
      case 'math_inline':
      case 'math_inline_block':
        pushSpan(token.content.trim(), ['inlineMath']);
        break;
      case 'link_open': {
        const key = generateKey();
        markDefs.push({
          _key: key,
          _type: 'link',
          href: token.attrGet('href') ?? '',
        });
        activeMarks.push(key);
        linkMarks.push(key);
        break;
      }
      case 'link_close': {
        const key = linkMarks.pop();
        if (key) closeMark(key);
        break;
      }
      case 'softbreak':
      case 'hardbreak':
        pushSpan('\n');
        break;
      case 'image':
        pushSpan(token.content);
        break;
    }
  }

  if (spans.length === 0) spans.push({ text, marks: [] });
  return { spans, markDefs };
}

function textBlock(text: string, style?: string): PtBlock {
  const parsed = parseInline(text);
  const children = parsed.spans.map((span) => {
    return {
      text: span.text,
      _key: generateKey(),
      _type: 'span' as const,
      marks: span.marks.length > 0 ? span.marks : undefined,
    };
  });

  const block: PtBlock = {
    _key: generateKey(),
    _type: 'block',
    style: style || 'normal',
    children: children.length > 0 ? children : [{ text: '', _key: generateKey(), _type: 'span' }],
  };

  if (parsed.markDefs.length > 0) {
    block.markDefs = parsed.markDefs;
  }

  return block;
}

export function hasMarkdownSyntax(text: string): boolean {
  const blockSyntax = new Set([
    'blockquote_open',
    'bullet_list_open',
    'fence',
    'heading_open',
    'hr',
    'math_block',
    'ordered_list_open',
    'table_open',
  ]);
  const inlineSyntax = new Set([
    'code_inline',
    'em_open',
    'image',
    'link_open',
    'math_inline',
    'math_inline_block',
    's_open',
    'strong_open',
  ]);

  return markdown.parse(text, {}).some(
    (token) =>
      blockSyntax.has(token.type) ||
      token.children?.some((child) => inlineSyntax.has(child.type)),
  );
}

function readDisplayMath(lines: string[], start: number) {
  const firstToken = markdown.parse(lines.slice(start).join('\n'), {})[0];
  if (
    firstToken?.type !== 'math_block' ||
    !firstToken.map ||
    firstToken.map[0] !== 0 ||
    !firstToken.content.trim()
  ) {
    return null;
  }

  return {
    formula: firstToken.content.trim(),
    nextIndex: start + firstToken.map[1],
  };
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

    const displayMath = readDisplayMath(lines, i);
    if (displayMath) {
      blocks.push({
        _key: generateKey(),
        _type: 'mathBlock',
        formula: displayMath.formula,
      });
      i = displayMath.nextIndex;
      continue;
    }

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
