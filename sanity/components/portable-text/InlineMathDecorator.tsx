import { isValidElement, type ReactNode } from 'react';
import katex from 'katex';
import type { BlockDecoratorProps } from 'sanity';
import { normalizeMathFormula } from '../../../lib/math';

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }
  return '';
}

export function InlineMathDecorator({ children, focused, selected }: BlockDecoratorProps) {
  const formula = normalizeMathFormula(getTextContent(children));

  if (!formula) return children;

  const html = katex.renderToString(formula, {
    displayMode: false,
    throwOnError: false,
    strict: false,
  });

  return (
    <span
      style={{
        background: 'var(--card-badge-default-bg-color)',
        border: selected ? '1px solid var(--card-focus-ring-color)' : '1px solid transparent',
        borderRadius: 4,
        display: 'inline-flex',
        gap: 6,
        alignItems: 'baseline',
        padding: '1px 4px',
      }}
    >
      <span
        aria-hidden="true"
        contentEditable={false}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.72em',
          opacity: focused || selected ? 0.72 : 0.38,
        }}
      >
        {children}
      </span>
    </span>
  );
}
