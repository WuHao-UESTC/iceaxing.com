import katex from 'katex';

interface Props {
  formula: string;
}

export function MathBlock({ formula }: Props) {
  const html = katex.renderToString(formula, {
    displayMode: true,
    throwOnError: false,
    strict: false,
  });

  return (
    <div
      className="my-6 overflow-x-auto py-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
