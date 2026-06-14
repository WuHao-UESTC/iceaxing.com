import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import { nestedComponents } from './nested-components';

interface Column {
  _key: string;
  content?: PortableTextBlock[];
}

interface ColumnsProps {
  columns?: Column[];
}

export function Columns({ columns }: ColumnsProps) {
  if (!columns || columns.length < 2) return null;

  const gridCols = columns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  return (
    <div className={`my-6 grid grid-cols-1 ${gridCols} gap-4`}>
      {columns.map((col) => (
        <div key={col._key} className="min-w-0">
          <PortableText value={col.content || []} components={nestedComponents} />
        </div>
      ))}
    </div>
  );
}
