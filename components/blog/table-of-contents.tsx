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
  _key?: string;
  style?: string;
  children?: SpanChild[];
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

function extractTableOfContents(content: PortableTextBlock[]): TocItem[] {
  return content
    .map((block) => {
      const heading = block as HeadingBlock;
      if (heading.style !== 'h1' && heading.style !== 'h2' && heading.style !== 'h3') {
        return null;
      }

      const text = getHeadingText(heading);
      if (!text) return null;

      return {
        id: getHeadingId(heading),
        text,
        level: Number(heading.style.slice(1)) as 1 | 2 | 3,
      };
    })
    .filter((item): item is TocItem => item !== null);
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
