import type { BlockDecoratorProps } from 'sanity';

export function InlineMathDecorator({ children }: BlockDecoratorProps) {
  return (
    <span
      style={{
        background: 'var(--card-badge-default-bg-color)',
        borderRadius: 3,
        fontFamily: 'monospace',
        padding: '1px 3px',
      }}
    >
      {children}
    </span>
  );
}
