import { Fragment } from 'react';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import katex from 'katex';
import { MindMap } from './custom-blocks/mindmap';
import { MathBlock } from './custom-blocks/math-block';
import { CodeBlock } from './custom-blocks/code-block';
import { PdfEmbed } from './custom-blocks/pdf-embed';
import { Callout } from './custom-blocks/callout';
import { Columns } from './custom-blocks/columns';
import { Toggle } from './custom-blocks/toggle';
import { Divider } from './custom-blocks/divider';
import { TableBlock } from './custom-blocks/table-block';
import { urlFor } from '@/lib/sanity/image';
import type { SanityImage } from '@/lib/sanity/types';
import Image from 'next/image';

/** Internal types matching Portable Text span / mark-def structures. */
interface SpanData {
  _type?: 'span';
  _key?: string;
  text: string;
  marks?: string[];
}

interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

type HeadingLevel = 1 | 2 | 3;

function getHeadingId(value: unknown): string {
  const raw = value as { _key?: string; children?: SpanData[] };
  if (raw._key) return `section-${raw._key}`;

  const text = (raw.children ?? [])
    .filter((child) => child._type === 'span')
    .map((child) => child.text)
    .join(' ')
    .trim();

  return `section-${encodeURIComponent(text.toLowerCase().replace(/\s+/g, '-'))}`;
}

/** Split a text string on $...$ delimiters, returning alternating text/math segments. */
function parseInlineMath(text: string): { type: 'text' | 'math'; content: string }[] {
  const segments: { type: 'text' | 'math'; content: string }[] = [];
  const regex = /(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'math', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/** Render a single Portable Text span, processing inline $...$ math. */
function renderSpan(
  span: SpanData,
  markDefs: MarkDef[],
  childIndex: number,
): React.ReactNode {
  const segments = parseInlineMath(span.text);

  const rendered = segments.map((seg, i) => {
    const key = `s-${childIndex}-${i}`;
    if (seg.type === 'math') {
      const html = katex.renderToString(seg.content, {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
      return (
        <span key={key} className="katex-inline" dangerouslySetInnerHTML={{ __html: html }} />
      );
    }
    return <Fragment key={key}>{seg.content}</Fragment>;
  });

  return applyMarks(span.marks ?? [], markDefs, rendered, childIndex);
}

/** Wrap content with the HTML tags corresponding to Portable Text marks. */
function applyMarks(
  markKeys: string[],
  markDefs: MarkDef[],
  children: React.ReactNode,
  spanIndex: number,
): React.ReactNode {
  let wrapped = children;

  for (const key of markKeys) {
    if (key === 'strong') {
      wrapped = <strong key={`m-${spanIndex}-${key}`}>{wrapped}</strong>;
    } else if (key === 'em') {
      wrapped = <em key={`m-${spanIndex}-${key}`}>{wrapped}</em>;
    } else if (key === 'code') {
      wrapped = <code key={`m-${spanIndex}-${key}`}>{wrapped}</code>;
    } else if (key === 'underline') {
      wrapped = <u key={`m-${spanIndex}-${key}`}>{wrapped}</u>;
    } else if (key === 'strike-through') {
      wrapped = <s key={`m-${spanIndex}-${key}`}>{wrapped}</s>;
    } else {
      const def = markDefs.find((d) => d._key === key);
      if (def?._type === 'link') {
        wrapped = (
          <a key={`m-${spanIndex}-${key}`} href={def.href ?? '#'}>
            {wrapped}
          </a>
        );
      }
    }
  }

  return wrapped;
}

function renderTextBlock(value: unknown, tag: 'p' | `h${HeadingLevel}` | 'blockquote') {
  const raw = value as { children?: SpanData[]; markDefs?: MarkDef[] };
  const spans: SpanData[] = (raw.children ?? []).filter(
    (c: SpanData) => c._type === 'span',
  );
  const defs: MarkDef[] = raw.markDefs ?? [];

  if (spans.length === 0) return <br />;

  const children = spans.map((span, i) => renderSpan(span, defs, i));

  if (tag === 'h1') return <h1 id={getHeadingId(value)} className="scroll-mt-24">{children}</h1>;
  if (tag === 'h2') return <h2 id={getHeadingId(value)} className="scroll-mt-24">{children}</h2>;
  if (tag === 'h3') return <h3 id={getHeadingId(value)} className="scroll-mt-24">{children}</h3>;
  if (tag === 'blockquote') return <blockquote className="border-l-4 border-zinc-300 pl-4 my-4 italic text-zinc-600 dark:text-zinc-400">{children}</blockquote>;
  return <p>{children}</p>;
}

const components: PortableTextComponents = {
  types: {
    mindmap: ({ value }) => (
      <MindMap data={value.data} caption={value.caption} />
    ),
    mathBlock: ({ value }) => (
      <MathBlock formula={value.formula} />
    ),
    codeBlock: ({ value }) => (
      <CodeBlock
        code={value.code}
        language={value.language}
        filename={value.filename}
      />
    ),
    pdfEmbed: ({ value }) => (
      <PdfEmbed file={value.file} caption={value.caption} />
    ),
    callout: ({ value }) => (
      <Callout variant={value.variant} title={value.title} body={value.body} />
    ),
    columns: ({ value }) => (
      <Columns columns={value.columns} />
    ),
    toggle: ({ value }) => (
      <Toggle title={value.title} open={value.open} body={value.body} />
    ),
    divider: ({ value }) => (
      <Divider style={value.style} />
    ),
    table: ({ value }) => (
      <TableBlock caption={value.caption} headers={value.headers} rows={value.rows} />
    ),
    image: ({ value }: { value: SanityImage }) => {
      const src = urlFor(value).width(1200).format('webp').auto('format').url();
      return (
        <figure className="my-6">
          <Image
            src={src}
            alt={value.alt || ''}
            width={1200}
            height={675}
            className="rounded-lg"
          />
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-zinc-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },

  block: {
    normal: ({ value }) => {
      return renderTextBlock(value, 'p');
    },
    h1: ({ value }) => renderTextBlock(value, 'h1'),
    h2: ({ value }) => renderTextBlock(value, 'h2'),
    h3: ({ value }) => renderTextBlock(value, 'h3'),
    blockquote: ({ value }) => renderTextBlock(value, 'blockquote'),
  },

  list: {
    task: ({ children }) => <ul className="list-none pl-0 my-2">{children}</ul>,
  },

  listItem: {
    task: ({ children, value }) => {
      const checked = (value as { checked?: boolean }).checked || false;
      return (
        <li className="flex items-start gap-2 my-1">
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mt-1 accent-zinc-600"
          />
          <span>{children}</span>
        </li>
      );
    },
  },
};

export function BlogBody({ content }: { content: PortableTextBlock[] }) {
  return <PortableText value={content} components={components} />;
}
