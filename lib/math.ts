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

function escapeTextCommandUnderscores(value: string): string {
  const commandPattern = /\\(?:text|texttt|textrm|textsf|textnormal|textbf|textit)\{/g;
  let output = '';
  let cursor = 0;

  while (commandPattern.exec(value) !== null) {
    let depth = 1;
    let end = commandPattern.lastIndex;

    for (; end < value.length && depth > 0; end++) {
      if (value[end] === '\\') {
        end++;
      } else if (value[end] === '{') {
        depth++;
      } else if (value[end] === '}') {
        depth--;
      }
    }

    if (depth !== 0) break;

    const contentStart = commandPattern.lastIndex;
    const contentEnd = end - 1;
    output += value.slice(cursor, contentStart);
    output += value.slice(contentStart, contentEnd).replace(/(?<!\\)_/g, '\\_');
    output += '}';
    cursor = end;
    commandPattern.lastIndex = end;
  }

  return output + value.slice(cursor);
}

function repairCasesRowSeparators(value: string): string {
  return value.replace(
    /\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g,
    (environment, content: string) => {
      const alignmentIndexes = [...content.matchAll(/(?<!\\)&/g)]
        .map((match) => match.index)
        .filter((index): index is number => index !== undefined);
      if (alignmentIndexes.length < 2) return environment;

      const betweenStart = alignmentIndexes[0] + 1;
      const betweenEnd = alignmentIndexes[1];
      const betweenRows = content.slice(betweenStart, betweenEnd);
      if (/\\\\/.test(betweenRows)) return environment;

      const repairedRows = betweenRows.replace(
        /,\\\s+/,
        () => ',' + '\\'.repeat(2) + ' ',
      );
      if (repairedRows === betweenRows) return environment;

      const repairedContent =
        content.slice(0, betweenStart) +
        repairedRows +
        content.slice(betweenEnd);
      return environment.replace(content, repairedContent);
    },
  );
}

/** Remove an optional outer TeX delimiter pair before passing a formula to KaTeX. */
export function normalizeMathFormula(value: string): string {
  const formula = (
    unwrapDelimiterPair(value, DISPLAY_MATH_DELIMITERS) ??
    unwrapDelimiterPair(value, INLINE_MATH_DELIMITERS) ??
    value.trim()
  );

  // Some exporters lose escaping in cases rows and text-mode commands.
  return escapeTextCommandUnderscores(repairCasesRowSeparators(formula));
}

/** Return the formula only when the complete value is a display-math expression. */
export function extractDisplayMath(value: string): string | null {
  return unwrapDelimiterPair(value, DISPLAY_MATH_DELIMITERS);
}
