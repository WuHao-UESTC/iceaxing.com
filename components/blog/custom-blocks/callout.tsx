import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import { type CSSProperties } from 'react';
import { nestedComponents } from './nested-components';

const variantStyles: Record<string, CSSProperties> = {
  info: {
    borderLeftColor: 'var(--color-blue)',
    backgroundColor: 'color-mix(in srgb, var(--color-blue) 12%, transparent)',
    color: 'var(--color-text)',
  },
  warning: {
    borderLeftColor: 'var(--color-gold)',
    backgroundColor: 'color-mix(in srgb, var(--color-gold) 12%, transparent)',
    color: 'var(--color-text)',
  },
  success: {
    borderLeftColor: 'var(--color-success)',
    backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
    color: 'var(--color-text)',
  },
  danger: {
    borderLeftColor: 'var(--color-danger)',
    backgroundColor: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
    color: 'var(--color-text)',
  },
};

const variantIcons: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  danger: '🚫',
};

interface CalloutProps {
  variant?: string;
  title?: string;
  body?: PortableTextBlock[];
}

export function Callout({ variant = 'info', title, body }: CalloutProps) {
  const styles = variantStyles[variant] || variantStyles.info;
  const icon = variantIcons[variant] || variantIcons.info;

  return (
    <div
      className="my-6 rounded-lg border-l-4 p-4"
      style={styles}
    >
      <div className="flex items-center gap-2 font-semibold mb-1">
        <span>{icon}</span>
        {title && <span>{title}</span>}
      </div>
      {body && body.length > 0 && (
        <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          <PortableText value={body} components={nestedComponents} />
        </div>
      )}
    </div>
  );
}
