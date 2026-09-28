'use client';

import { Children, useId, useMemo, useState, type ReactNode } from 'react';

type SortMode = 'published-desc' | 'published-asc' | 'title-asc' | 'title-desc';

export type FilterablePostItem = {
  id: string;
  title: string;
  publishedAt: string;
  searchText: string;
};

const pinyinCollator = new Intl.Collator('zh-CN-u-co-pinyin', {
  numeric: true,
  sensitivity: 'base',
  usage: 'sort',
});

function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase();
}

function labelsFor(locale: string) {
  if (locale === 'de') {
    return {
      search: 'Artikel suchen',
      searchPlaceholder: 'Titel, Zusammenfassung oder Tag suchen…',
      sort: 'Sortierung',
      latest: 'Neueste zuerst',
      oldest: 'Älteste zuerst',
      titleAsc: 'Titel A–Z / Pinyin',
      titleDesc: 'Titel Z–A / Pinyin',
      noResults: 'Keine passenden Artikel gefunden.',
      results: 'Treffer',
    };
  }
  if (locale === 'en') {
    return {
      search: 'Search articles',
      searchPlaceholder: 'Search title, summary, or tag…',
      sort: 'Sort by',
      latest: 'Newest first',
      oldest: 'Oldest first',
      titleAsc: 'Title A–Z / Pinyin',
      titleDesc: 'Title Z–A / Pinyin',
      noResults: 'No matching articles.',
      results: 'results',
    };
  }
  return {
    search: '搜索文章',
    searchPlaceholder: '搜索标题、摘要或标签…',
    sort: '排序方式',
    latest: '发布时间：最新优先',
    oldest: '发布时间：最早优先',
    titleAsc: '标题：A–Z / 拼音',
    titleDesc: '标题：Z–A / 拼音倒序',
    noResults: '没有找到符合条件的文章。',
    results: '篇结果',
  };
}

export function FilterablePostList({
  items,
  children,
  className,
  locale,
}: {
  items: FilterablePostItem[];
  children: ReactNode;
  className: string;
  locale: string;
}) {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('published-desc');
  const searchId = useId();
  const sortId = useId();
  const labels = labelsFor(locale);
  const nodes = Children.toArray(children);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    const entries = items
      .map((item, index) => ({ item, node: nodes[index] }))
      .filter(({ item }) => (
        !normalizedQuery || normalizeSearchText(item.searchText).includes(normalizedQuery)
      ));

    entries.sort((left, right) => {
      if (sortMode === 'title-asc' || sortMode === 'title-desc') {
        const result = pinyinCollator.compare(left.item.title, right.item.title);
        return sortMode === 'title-asc' ? result : -result;
      }

      const leftTime = Date.parse(left.item.publishedAt) || 0;
      const rightTime = Date.parse(right.item.publishedAt) || 0;
      const result = leftTime - rightTime;
      if (result !== 0) return sortMode === 'published-asc' ? result : -result;
      return pinyinCollator.compare(left.item.title, right.item.title);
    });

    return entries;
  }, [items, nodes, query, sortMode]);

  return (
    <div className="listing-post-browser">
      <div className="listing-post-controls">
        <label className="listing-post-control" htmlFor={searchId}>
          <span>{labels.search}</span>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
        <label className="listing-post-control" htmlFor={sortId}>
          <span>{labels.sort}</span>
          <select
            id={sortId}
            value={sortMode}
            onChange={(event) => setSortMode(event.currentTarget.value as SortMode)}
          >
            <option value="published-desc">{labels.latest}</option>
            <option value="published-asc">{labels.oldest}</option>
            <option value="title-asc">{labels.titleAsc}</option>
            <option value="title-desc">{labels.titleDesc}</option>
          </select>
        </label>
      </div>

      <div className="listing-post-result-count" aria-live="polite">
        {visibleEntries.length} / {items.length} {labels.results}
      </div>

      {visibleEntries.length > 0 ? (
        <div className={className}>
          {visibleEntries.map(({ node }) => node)}
        </div>
      ) : (
        <p className="listing-post-empty">{labels.noResults}</p>
      )}
    </div>
  );
}
