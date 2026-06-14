'use client';

import { useState } from 'react';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import { MindMap } from './mindmap';
import { MathBlock } from './math-block';
import { CodeBlock } from './code-block';
import { PdfEmbed } from './pdf-embed';
import { Divider } from './divider';
import { TableBlock } from './table-block';
import { urlFor } from '@/lib/sanity/image';
import type { SanityImage } from '@/lib/sanity/types';
import Image from 'next/image';
import { type CSSProperties } from 'react';

const variantStyles: Record<string, CSSProperties> = {
  info:    { borderLeftColor: 'var(--color-blue)',    backgroundColor: 'color-mix(in srgb, var(--color-blue) 12%, transparent)' },
  warning: { borderLeftColor: 'var(--color-gold)',    backgroundColor: 'color-mix(in srgb, var(--color-gold) 12%, transparent)' },
  success: { borderLeftColor: 'var(--color-success)', backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)' },
  danger:  { borderLeftColor: 'var(--color-danger)',  backgroundColor: 'color-mix(in srgb, var(--color-danger) 12%, transparent)' },
};
const variantIcons: Record<string, string> = { info: 'ℹ️', warning: '⚠️', success: '✅', danger: '🚫' };

function NestedCallout({ variant, title, body }: { variant?: string; title?: string; body?: PortableTextBlock[] }) {
  const styles = variantStyles[variant || 'info'] || variantStyles.info;
  const icon = variantIcons[variant || 'info'] || variantIcons.info;
  return (
    <div className="my-3 rounded-lg border-l-4 p-3" style={{ ...styles, color: 'var(--color-text)' }}>
      <div className="flex items-center gap-1 font-semibold mb-1 text-sm">
        <span>{icon}</span>
        {title && <span>{title}</span>}
      </div>
      {body && body.length > 0 && (
        <div className="text-sm leading-relaxed">
          <PortableText value={body} components={nestedComponents} />
        </div>
      )}
    </div>
  );
}

function NestedColumns({ columns }: { columns?: Array<{ _key: string; content?: PortableTextBlock[] }> }) {
  if (!columns || columns.length < 2) return null;
  const gridCols = columns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';
  return (
    <div className={`my-3 grid grid-cols-1 ${gridCols} gap-3`}>
      {columns.map((col) => (
        <div key={col._key} className="min-w-0">
          <PortableText value={col.content || []} components={nestedComponents} />
        </div>
      ))}
    </div>
  );
}

function NestedToggle({ title, open, body }: { title?: string; open?: boolean; body?: PortableTextBlock[] }) {
  const [isOpen, setIsOpen] = useState(open || false);
  return (
    <div className="my-2 rounded-lg border border-zinc-200 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm font-medium bg-zinc-50 hover:bg-zinc-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs transition-transform" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        <span>{title || '折叠块'}</span>
      </button>
      {isOpen && body && body.length > 0 && (
        <div className="px-3 py-1.5 text-sm leading-relaxed">
          <PortableText value={body} components={nestedComponents} />
        </div>
      )}
    </div>
  );
}

export const nestedComponents: PortableTextComponents = {
  types: {
    mindmap: ({ value }) => (
      <MindMap data={value.data} caption={value.caption} />
    ),
    mathBlock: ({ value }) => (
      <MathBlock formula={value.formula} />
    ),
    codeBlock: ({ value }) => (
      <CodeBlock code={value.code} language={value.language} filename={value.filename} />
    ),
    pdfEmbed: ({ value }) => (
      <PdfEmbed file={value.file} caption={value.caption} />
    ),
    callout: ({ value }) => (
      <NestedCallout variant={value.variant} title={value.title} body={value.body} />
    ),
    columns: ({ value }) => (
      <NestedColumns columns={value.columns} />
    ),
    toggle: ({ value }) => (
      <NestedToggle title={value.title} open={value.open} body={value.body} />
    ),
    divider: ({ value }) => (
      <Divider style={value.style} />
    ),
    table: ({ value }) => (
      <TableBlock caption={value.caption} headers={value.headers} rows={value.rows} />
    ),
    image: ({ value }: { value: SanityImage }) => {
      const src = urlFor(value).width(800).format('webp').auto('format').url();
      return (
        <figure className="my-4">
          <Image src={src} alt={value.alt || ''} width={800} height={450} className="rounded-lg" />
          {value.caption && (
            <figcaption className="mt-1 text-center text-xs text-zinc-500">{value.caption}</figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    normal: ({ children }) => <p className="my-1">{children}</p>,
    h1: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
    h2: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
    h3: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-zinc-300 pl-3 my-2 text-sm italic text-zinc-500">
        {children}
      </blockquote>
    ),
  },
};
