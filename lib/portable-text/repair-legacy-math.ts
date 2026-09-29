import type { PortableTextBlock } from '@portabletext/react';

type LegacySpan = {
  _type?: 'span';
  _key?: string;
  text: string;
  marks?: string[];
};

type LegacyTextBlock = {
  _key?: string;
  _type: 'block';
  children?: LegacySpan[];
  [key: string]: unknown;
};

function isLegacyTextBlock(value: unknown): value is LegacyTextBlock {
  return Boolean(value && typeof value === 'object' && (value as { _type?: string })._type === 'block');
}

function legacyBlockText(block: LegacyTextBlock) {
  return (block.children ?? [])
    .filter((child) => child._type === 'span')
    .map((child) => child.text)
    .join('');
}

function sliceLegacyTextBlock(
  block: LegacyTextBlock,
  start: number,
  end: number,
  keySuffix: string,
): PortableTextBlock | null {
  let offset = 0;
  const children = (block.children ?? []).flatMap((child) => {
    const childStart = offset;
    const childEnd = childStart + child.text.length;
    offset = childEnd;
    const sliceStart = Math.max(start, childStart) - childStart;
    const sliceEnd = Math.min(end, childEnd) - childStart;
    if (sliceEnd <= sliceStart) return [];
    return [{ ...child, _key: `${child._key ?? 'span'}-${keySuffix}`, text: child.text.slice(sliceStart, sliceEnd) }];
  });

  if (!children.some((child) => child.text.trim())) return null;
  return {
    ...block,
    _key: `${block._key ?? 'block'}-${keySuffix}`,
    children,
  } as PortableTextBlock;
}

function findUnescapedDelimiter(value: string, delimiter: string, fromIndex = 0) {
  let index = value.indexOf(delimiter, fromIndex);
  while (index >= 0) {
    let backslashes = 0;
    for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor--) backslashes++;
    if (backslashes % 2 === 0) return index;
    index = value.indexOf(delimiter, index + delimiter.length);
  }
  return -1;
}

function findLegacyDisplayOpening(value: string) {
  const dollar = findUnescapedDelimiter(value, '$$');
  const bracket = findUnescapedDelimiter(value, '\\[');
  if (dollar < 0 && bracket < 0) return null;
  if (bracket >= 0 && (dollar < 0 || bracket < dollar)) {
    return { index: bracket, opening: '\\[', closing: '\\]' };
  }
  return { index: dollar, opening: '$$', closing: '$$' };
}

function normalizeLegacyFormula(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/(?<!\\)%/g, '\\%')
    .trim();
}

export function repairLegacyDisplayMath(content: PortableTextBlock[]): PortableTextBlock[] {
  const output: PortableTextBlock[] = [];

  for (let index = 0; index < content.length; index++) {
    const block = content[index];
    if (!isLegacyTextBlock(block)) {
      output.push(block);
      continue;
    }

    const text = legacyBlockText(block);
    const opening = findLegacyDisplayOpening(text);
    if (!opening) {
      output.push(block);
      continue;
    }

    const prefix = sliceLegacyTextBlock(block, 0, opening.index, 'before-math');
    const firstFormulaStart = opening.index + opening.opening.length;
    const sameBlockClosing = findUnescapedDelimiter(text, opening.closing, firstFormulaStart);
    if (sameBlockClosing >= 0) {
      if (prefix) output.push(prefix);
      output.push({
        _key: `${block._key ?? 'block'}-math`,
        _type: 'mathBlock',
        formula: normalizeLegacyFormula(text.slice(firstFormulaStart, sameBlockClosing)),
      } as unknown as PortableTextBlock);
      const suffix = sliceLegacyTextBlock(
        block,
        sameBlockClosing + opening.closing.length,
        text.length,
        'after-math',
      );
      if (suffix) output.push(suffix);
      continue;
    }

    const formulaLines = [text.slice(firstFormulaStart)];
    let closingBlockIndex = -1;
    let closingOffset = -1;
    for (let cursor = index + 1; cursor < content.length; cursor++) {
      const candidate = content[cursor];
      if (!isLegacyTextBlock(candidate)) break;
      const candidateText = legacyBlockText(candidate);
      const closing = findUnescapedDelimiter(candidateText, opening.closing);
      if (closing >= 0) {
        formulaLines.push(candidateText.slice(0, closing));
        closingBlockIndex = cursor;
        closingOffset = closing;
        break;
      }
      formulaLines.push(candidateText);
    }

    if (closingBlockIndex < 0) {
      output.push(block);
      continue;
    }

    if (prefix) output.push(prefix);
    output.push({
      _key: `${block._key ?? 'block'}-math`,
      _type: 'mathBlock',
      formula: normalizeLegacyFormula(formulaLines.join('\n')),
    } as unknown as PortableTextBlock);
    const closingBlock = content[closingBlockIndex] as unknown as LegacyTextBlock;
    const closingText = legacyBlockText(closingBlock);
    const suffix = sliceLegacyTextBlock(
      closingBlock,
      closingOffset + opening.closing.length,
      closingText.length,
      'after-math',
    );
    if (suffix) output.push(suffix);
    index = closingBlockIndex;
  }

  return output;
}
