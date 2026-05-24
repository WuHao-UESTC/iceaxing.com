import { Fragment } from 'react';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import katex from 'katex';
import { MindMap } from './custom-blocks/mindmap';
import { MathBlock } from './custom-blocks/math-block';
import { CodeBlock } from './custom-blocks/code-block';
import { PdfEmbed } from './custom-blocks/pdf-embed';
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

/** Split a text string on $...$ delimiters, returning alternating text/math segments. */
function parseInlineMath(text: string): { type: 'text' | 'math'; content: string }[] {
  const segments: { type: 'text' | 'math'; content: string }[] = [];
  // Match $...$ where $ is not preceded by a backslash
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

  // Apply marks to the rendered content (wrapping order: innermost marks first)
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
    // Check if this key is a known decorator (strong, em, code, etc.)
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
      // Check markDefs for link annotations
      const def = markDefs.find((d) => d._key === key);
      if (def?._type === 'link') {
        wrapped = (
          <a key={`m-${spanIndex}-${key}`} href={def.href ?? '#'}>
            {wrapped}
          </a>
        );
      }
      // Unknown marks are silently ignored
    }
  }

  return wrapped;
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
        </figure>
      );
    },
  },

  block: {
    normal: ({ value }) => {
      // Portable Text block runtime shape — children is always an array of span objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = value as any;
      const spans: SpanData[] = (raw.children ?? []).filter(
        (c: SpanData) => c._type === 'span',
      );
      const defs: MarkDef[] = raw.markDefs ?? [];

      if (spans.length === 0) return <br />;

      return (
        <p>
          {spans.map((span, i) =>
            renderSpan(span, defs, i),
          )}
        </p>
      );
    },
  },
};

export function BlogBody({ content }: { content: PortableTextBlock[] }) {
  return <PortableText value={content} components={components} />;
}
