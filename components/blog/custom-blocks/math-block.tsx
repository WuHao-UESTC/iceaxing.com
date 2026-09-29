import katex from 'katex';
import { normalizeMathFormula } from '@/lib/math';

interface Props {
  formula?: string;
}

export function MathBlock({ formula }: Props) {
  const normalizedFormula = normalizeMathFormula(formula ?? '');

  if (!normalizedFormula) return null;

  const html = katex.renderToString(normalizedFormula, {
    displayMode: true,
    throwOnError: false,
    strict: false,
  });

  return (
    <div
      className="math-block my-6 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
