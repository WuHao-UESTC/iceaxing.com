const DISPLAY_MATH_DELIMITERS = [
  ['$$', '$$'],
  ['\\[', '\\]'],
] as const;

const INLINE_MATH_DELIMITERS = [
  ['$', '$'],
  ['\\(', '\\)'],
] as const;

function findUnescaped(value: string, delimiter: string, fromIndex: number): number {
  let index = value.indexOf(delimiter, fromIndex);

  while (index >= 0) {
    let backslashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor--) {
      backslashCount++;
    }

    if (backslashCount % 2 === 0) return index;
    index = value.indexOf(delimiter, index + delimiter.length);
  }

  return -1;
}

function unwrapDelimiterPair(
  value: string,
  delimiters: readonly (readonly [string, string])[],
): string | null {
  const trimmed = value.trim();

  for (const [opening, closing] of delimiters) {
    if (
      trimmed.length > opening.length + closing.length &&
      trimmed.startsWith(opening) &&
      trimmed.endsWith(closing) &&
      findUnescaped(trimmed, closing, opening.length) === trimmed.length - closing.length
    ) {
      return trimmed.slice(opening.length, -closing.length).trim();
    }
  }

  return null;
}

/** Remove an optional outer TeX delimiter pair before passing a formula to KaTeX. */
export function normalizeMathFormula(value: string): string {
  return (
    unwrapDelimiterPair(value, DISPLAY_MATH_DELIMITERS) ??
    unwrapDelimiterPair(value, INLINE_MATH_DELIMITERS) ??
    value.trim()
  );
}

/** Return the formula only when the complete value is a display-math expression. */
export function extractDisplayMath(value: string): string | null {
  return unwrapDelimiterPair(value, DISPLAY_MATH_DELIMITERS);
}
