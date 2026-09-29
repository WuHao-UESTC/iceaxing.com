import { Fragment } from 'react';
import katex from 'katex';
import {
  extractHtmlAnchorId,
  extractHtmlAnchorReference,
} from '@/lib/html-anchor';
import { normalizeMathFormula } from '@/lib/math';
import { AnchorBlock } from './custom-blocks/anchor';

interface MathTextProps {
  children: string;
}

type MathTextSegment =
  | { type: 'text'; content: string }
  | { type: 'math'; content: string; displayMode: boolean }
  | { type: 'anchor'; id: string }
  | { type: 'reference'; href: string; label: string };

const MATH_DELIMITER_PATTERN =
  /(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$|(?<!\\)\\\[([\s\S]+?)(?<!\\)\\\]|(?<!\\)\$([^$\n]+?)(?<!\\)\$|(?<!\\)\\\(([^\n]+?)(?<!\\)\\\)/g;
const HTML_ANCHOR_PATTERN = /<a\b[^>]*>[\s\S]*?<\/a\s*>/gi;
const TEX_ENVIRONMENT_PATTERN = /\\begin\{([A-Za-z]+\*?)\}[\s\S]*?\\end\{\1\}/g;

type SegmentMatch = {
  index: number;
  end: number;
  segment: MathTextSegment;
};

function findDelimitedMath(value: string, fromIndex: number): SegmentMatch | null {
  MATH_DELIMITER_PATTERN.lastIndex = fromIndex;
  const match = MATH_DELIMITER_PATTERN.exec(value);
  if (!match) return null;

  const displayFormula = match[1] ?? match[2];
  return {
    index: match.index,
    end: MATH_DELIMITER_PATTERN.lastIndex,
    segment: {
      type: 'math',
      content: displayFormula ?? match[3] ?? match[4],
      displayMode: displayFormula !== undefined,
    },
  };
}

function findHtmlAnchor(value: string, fromIndex: number): SegmentMatch | null {
  HTML_ANCHOR_PATTERN.lastIndex = fromIndex;
  const match = HTML_ANCHOR_PATTERN.exec(value);
  if (!match) return null;

  const reference = extractHtmlAnchorReference(match[0]);
  const anchorId = reference ? undefined : extractHtmlAnchorId(match[0]);
  const segment: MathTextSegment = reference
    ? { type: 'reference', ...reference }
    : anchorId
      ? { type: 'anchor', id: anchorId }
      : { type: 'text', content: match[0] };

  return {
    index: match.index,
    end: HTML_ANCHOR_PATTERN.lastIndex,
    segment,
  };
}

function findBareEnvironment(value: string, fromIndex: number): SegmentMatch | null {
  TEX_ENVIRONMENT_PATTERN.lastIndex = fromIndex;
  const match = TEX_ENVIRONMENT_PATTERN.exec(value);
  if (!match) return null;

  let formulaStart = match.index;
  const boundary = Math.max(
    fromIndex,
    value.lastIndexOf('\n', match.index - 1) + 1,
    ...['，', '。', '；', '：', '！', '？', ';'].map((character) =>
      value.lastIndexOf(character, match.index - 1) + 1,
    ),
  );
  const prefix = value.slice(boundary, match.index);
  const assignment = prefix.match(
    /(?:\\?[A-Za-z][A-Za-z0-9]*(?:\s*[_^]\s*(?:\{(?:[^{}]|\{[^{}]*\})+\}|[A-Za-z0-9]))*(?:\s*\([^)]*\))?\s*(?:=|:=|\\(?:equiv|approx|sim|le|ge|leq|geq))\s*)$/,
  );
  if (assignment?.index !== undefined) {
    formulaStart = boundary + assignment.index;
  }

  return {
    index: formulaStart,
    end: TEX_ENVIRONMENT_PATTERN.lastIndex,
    segment: {
      type: 'math',
      content: value.slice(formulaStart, TEX_ENVIRONMENT_PATTERN.lastIndex),
      displayMode: true,
    },
  };
}

function firstMatch(matches: Array<SegmentMatch | null>): SegmentMatch | null {
  return matches.reduce<SegmentMatch | null>((first, candidate) => {
    if (!candidate) return first;
    if (!first || candidate.index < first.index) return candidate;
    // Callers order matches by precedence when two syntaxes start together.
    return first;
  }, null);
}

function splitMathText(value: string): MathTextSegment[] {
  const segments: MathTextSegment[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const match = firstMatch([
      findDelimitedMath(value, cursor),
      findHtmlAnchor(value, cursor),
      findBareEnvironment(value, cursor),
    ]);
    if (!match) break;

    if (match.index > cursor) {
      segments.push({ type: 'text', content: value.slice(cursor, match.index) });
    }
    segments.push(match.segment);
    cursor = match.end;
  }

  if (cursor < value.length) {
    segments.push({ type: 'text', content: value.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: value }];
}

/** Render TeX delimiters embedded in plain string fields such as table cells. */
export function MathText({ children }: MathTextProps) {
  return splitMathText(children).map((segment, index) => {
    if (segment.type === 'text') {
      return <Fragment key={index}>{segment.content}</Fragment>;
    }
    if (segment.type === 'anchor') {
      return <AnchorBlock key={index} id={segment.id} />;
    }
    if (segment.type === 'reference') {
      return (
        <a key={index} href={segment.href}>
          {segment.label}
        </a>
      );
    }

    const html = katex.renderToString(normalizeMathFormula(segment.content), {
      displayMode: segment.displayMode,
      throwOnError: false,
      strict: false,
    });

    return (
      <span
        key={index}
        className={segment.displayMode ? 'katex-display-fallback' : 'katex-inline'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}
