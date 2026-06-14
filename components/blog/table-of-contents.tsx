import type { PortableTextBlock } from '@portabletext/react';

interface TocItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

interface SpanChild {
  _type?: string;
  text?: string;
}

interface HeadingBlock {
  _type?: string;
  _key?: string;
  style?: string;
  children?: SpanChild[];
  body?: PortableTextBlock[];
  columns?: Array<{ _key: string; content?: PortableTextBlock[] }>;
}

function getHeadingText(block: HeadingBlock): string {
  return (block.children ?? [])
    .filter((child) => child._type === 'span' && typeof child.text === 'string')
    .map((child) => child.text)
    .join('')
    .trim();
}

function getHeadingId(block: HeadingBlock): string {
  if (block._key) return `section-${block._key}`;

  const fallback = getHeadingText(block)
    .toLowerCase()
    .replace(/\s+/g, '-');

  return `section-${encodeURIComponent(fallback)}`;
}

function isHeading(style?: string): style is 'h1' | 'h2' | 'h3' {
  return style === 'h1' || style === 'h2' || style === 'h3';
}

/** Recursively collect headings from a Portable Text block array, descending into callout/toggle/columns. */
function collectHeadings(blocks: PortableTextBlock[], maxDepth: number): TocItem[] {
  if (maxDepth <= 0) return [];

  const items: TocItem[] = [];

  for (const raw of blocks) {
    const block = raw as HeadingBlock;

    if (block._type === 'block' && isHeading(block.style)) {
      const text = getHeadingText(block);
      if (text) {
        items.push({
          id: getHeadingId(block),
          text,
          level: Number(block.style.slice(1)) as 1 | 2 | 3,
        });
      }
    } else if (block._type === 'callout' && block.body) {
      items.push(...collectHeadings(block.body, maxDepth - 1));
    } else if (block._type === 'toggle' && block.body) {
      items.push(...collectHeadings(block.body, maxDepth - 1));
    } else if (block._type === 'columns' && block.columns) {
      for (const col of block.columns) {
        if (col.content) {
          items.push(...collectHeadings(col.content, maxDepth - 1));
        }
      }
    }
  }

  return items;
}

function extractTableOfContents(content: PortableTextBlock[]): TocItem[] {
  // Limit recursion depth to avoid infinite loops from self-nesting
  return collectHeadings(content, 5);
}

export function TableOfContents({
  content,
  locale,
}: {
  content: PortableTextBlock[];
  locale: string;
}) {
  const items = extractTableOfContents(content);
  if (items.length === 0) return null;

  return (
    <aside className="blog-toc">
      <h2 className="blog-toc-title">
        {locale === 'de' ? 'Inhalt' : locale === 'en' ? 'Contents' : '目录'}
      </h2>
      <nav aria-label={locale === 'de' ? 'Inhaltsverzeichnis' : locale === 'en' ? 'Table of contents' : '文章目录'}>
        <ol className="blog-toc-list">
          {items.map((item) => (
            <li
              key={item.id}
              className={
                item.level === 1
                  ? 'blog-toc-item'
                  : item.level === 2
                    ? 'blog-toc-item blog-toc-item-h2'
                    : 'blog-toc-item blog-toc-item-h3'
              }
            >
              <a href={`#${item.id}`}>{item.text}</a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
