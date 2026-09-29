import MarkdownIt from 'markdown-it';
import markdownItKatexExport from '@vscode/markdown-it-katex';
import { extractDisplayMath } from '../../../lib/math';
import { extractHtmlAnchorId } from '../../../lib/html-anchor';

type MarkDef = { _key: string; _type: string; href?: string };

export type PtBlock = {
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

const ESCAPED_DOLLAR_PLACEHOLDER = '\uE000escaped-dollar\uE001';
const INLINE_MATH_OPEN_PLACEHOLDER = '\uE002inline-math-open\uE003';
const INLINE_MATH_CLOSE_PLACEHOLDER = '\uE004inline-math-close\uE005';
const FALLBACK_INLINE_MATH_PATTERN =
  /(?<!\\)(?<!\$)\$(?![\s$])([^$\n]*?[^$\s\\])\$(?![\d$])|\uE002inline-math-open\uE003(?!\s)([^\n]*?\S)\uE004inline-math-close\uE005/g;

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
  const protectedText = text
    .replace(/(?<!\\)\\\$/g, ESCAPED_DOLLAR_PLACEHOLDER)
    .replace(/(?<!\\)\\\(/g, INLINE_MATH_OPEN_PLACEHOLDER)
    .replace(/(?<!\\)\\\)/g, INLINE_MATH_CLOSE_PLACEHOLDER);
  const tokens = markdown.parseInline(protectedText, {})[0]?.children ?? [];

  const pushSpan = (content: string, extraMarks: string[] = []) => {
    if (!content) return;
    spans.push({ text: content, marks: [...activeMarks, ...extraMarks] });
  };

  const restoreProtectedSyntax = (content: string, preserveEscape = false) =>
    content
      .replaceAll(ESCAPED_DOLLAR_PLACEHOLDER, preserveEscape ? '\\$' : '$')
      .replaceAll(INLINE_MATH_OPEN_PLACEHOLDER, preserveEscape ? '\\(' : '(')
      .replaceAll(INLINE_MATH_CLOSE_PLACEHOLDER, preserveEscape ? '\\)' : ')');

  // The upstream plugin rejects some Obsidian-valid delimiter placements,
  // notably a closing `$` immediately followed by an ASCII word character.
  const pushTextWithFallbackMath = (content: string) => {
    let cursor = 0;
    let match: RegExpExecArray | null;
    FALLBACK_INLINE_MATH_PATTERN.lastIndex = 0;

    while ((match = FALLBACK_INLINE_MATH_PATTERN.exec(content)) !== null) {
      pushSpan(restoreProtectedSyntax(content.slice(cursor, match.index)));
      // Keep the exact delimiters in Sanity. Rendering normalizes them before
      // passing the formula to KaTeX, while the stored source stays lossless.
      pushSpan(restoreProtectedSyntax(match[0], true), ['inlineMath']);
      cursor = match.index + match[0].length;
    }

    pushSpan(restoreProtectedSyntax(content.slice(cursor)));
  };

  const closeMark = (mark: string) => {
    const index = activeMarks.lastIndexOf(mark);
    if (index >= 0) activeMarks.splice(index, 1);
  };

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        pushTextWithFallbackMath(token.content);
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
        pushSpan(restoreProtectedSyntax(token.content, true), ['code']);
        break;
      case 'math_inline':
      case 'math_inline_block': {
        const delimiter = token.markup || (token.type === 'math_inline_block' ? '$$' : '$');
        pushSpan(
          `${delimiter}${restoreProtectedSyntax(token.content, true)}${delimiter}`,
          ['inlineMath'],
        );
        break;
      }
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
        pushSpan(restoreProtectedSyntax(token.content));
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

type MarkdownSourceSegment =
  | { type: 'text'; value: string }
  | { type: 'math'; source: string }
  | { type: 'anchor'; id: string };

function splitSpecialBlocks(markdownSource: string): MarkdownSourceSegment[] {
  const segments: MarkdownSourceSegment[] = [];
  const pattern = /(?<!\\)\$\$[\s\S]+?(?<!\\)\$\$|(?<!\\)\\\[[\s\S]+?(?<!\\)\\\]|<a\b[^>]*>\s*<\/a\s*>/gi;
  let fence: { marker: '`' | '~'; length: number } | null = null;
  let textBuffer = '';

  const appendText = (value: string) => {
    if (!value) return;
    const previous = segments.at(-1);
    if (previous?.type === 'text') previous.value += value;
    else segments.push({ type: 'text', value });
  };

  const splitTextBuffer = () => {
    if (!textBuffer) return;
    let cursor = 0;
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(textBuffer)) !== null) {
      const lineStart = textBuffer.lastIndexOf('\n', match.index - 1) + 1;
      const precedingBackticks = textBuffer.slice(lineStart, match.index).match(/(?<!\\)`/g)?.length ?? 0;
      if (precedingBackticks % 2 === 1) continue;

      const syntax = match[0];

      // A display delimiter inside a Markdown table cell belongs to the cell.
      // Pulling it into a standalone block would split and corrupt the table.
      const currentLine = textBuffer.slice(
        textBuffer.lastIndexOf('\n', match.index - 1) + 1,
        textBuffer.indexOf('\n', match.index) < 0
          ? textBuffer.length
          : textBuffer.indexOf('\n', match.index),
      );
      const isMath = syntax.startsWith('$$') || syntax.startsWith('\\[');
      const isTableRow = /(?<!\\)\|/.test(currentLine);
      if (isMath && isTableRow) continue;

      appendText(textBuffer.slice(cursor, match.index));

      if (isMath) {
        segments.push({ type: 'math', source: syntax });
      } else {
        const id = extractHtmlAnchorId(syntax);
        if (id) segments.push({ type: 'anchor', id });
        else appendText(syntax);
      }

      cursor = match.index + syntax.length;
    }

    appendText(textBuffer.slice(cursor));
    textBuffer = '';
  };

  for (const line of markdownSource.match(/[^\r\n]*(?:\r?\n|$)/g) ?? []) {
    if (!line) continue;
    const fenceRun = line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/);
    if (fence) {
      appendText(line);
      if (
        fenceRun &&
        fenceRun[1][0] === fence.marker &&
        fenceRun[1].length >= fence.length &&
        !fenceRun[2].trim()
      ) {
        fence = null;
      }
      continue;
    }
    if (fenceRun) {
      splitTextBuffer();
      fence = {
        marker: fenceRun[1][0] as '`' | '~',
        length: fenceRun[1].length,
      };
      appendText(line);
      continue;
    }
    textBuffer += line;
  }
  splitTextBuffer();

  return segments.length > 0 ? segments : [{ type: 'text', value: markdownSource }];
}

function readDisplayMath(lines: string[], start: number) {
  const openingLine = lines[start].trimStart();

  if (openingLine.startsWith('$$')) {
    for (let end = start; end < lines.length; end++) {
      const candidate = lines.slice(start, end + 1).join('\n');
      const formula = extractDisplayMath(candidate);

      if (formula !== null) {
        return { source: candidate, nextIndex: end + 1 };
      }
    }
  }

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
    source: lines.slice(start, start + firstToken.map[1]).join('\n'),
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

function markdownTextToPortableText(md: string): PtBlock[] {
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
        formula: displayMath.source,
      });
      i = displayMath.nextIndex;
      continue;
    }

    // Code fence. Respect the opening marker and its length so code containing
    // shorter backtick runs is never truncated during import.
    const fenceOpening = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fenceOpening) {
      const marker = fenceOpening[1][0];
      const markerLength = fenceOpening[1].length;
      const info = fenceOpening[2].trim();
      const lang = info.split(/\s+/, 1)[0];
      const fenceClosing = new RegExp(
        `^ {0,3}${marker === '`' ? '`' : '~'}{${markerLength},}\\s*$`,
      );
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !fenceClosing.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        _key: generateKey(),
        _type: 'codeBlock',
        language: lang || 'plain',
        code: codeLines.join('\n'),
      } as PtBlock);
      if (i < lines.length) i++;
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

export function markdownToPortableText(md: string): PtBlock[] {
  return splitSpecialBlocks(md).flatMap((segment): PtBlock[] => {
    if (segment.type === 'math') {
      return [{
        _key: generateKey(),
        _type: 'mathBlock',
        formula: segment.source,
      }];
    }
    if (segment.type === 'anchor') {
      return [{
        _key: generateKey(),
        _type: 'anchor',
        id: segment.id,
      }];
    }
    return markdownTextToPortableText(segment.value);
  });
}
