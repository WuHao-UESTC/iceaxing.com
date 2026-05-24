import type { ReactNode } from 'react';

interface Props {
  message: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ message, children, className }: Props) {
  return (
    <div className={`text-center py-20 text-zinc-400 ${className ?? ''}`}>
      <p>{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
