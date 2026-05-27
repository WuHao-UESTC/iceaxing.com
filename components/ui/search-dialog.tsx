'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { SearchResult } from '@/lib/sanity/queries';

interface CategoryOption {
  _id: string;
  title: string;
  slug: string;
}

function resultUrl(r: SearchResult) {
  return `/${r.category.slug}/${r.project.slug}/${r.slug}`;
}

interface Props {
  categories?: CategoryOption[];
}

export function SearchDialog({ categories = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('search');
  const router = useRouter();

  const resultsRef = useRef(results);
  const selectedIndexRef = useRef(selectedIndex);
  const openRef = useRef(open);

  const closeAndClear = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    setCategoryFilter('');
    setLoading(false);
  }, []);

  useEffect(() => {
    resultsRef.current = results;
    selectedIndexRef.current = selectedIndex;
    openRef.current = open;
  }, [results, selectedIndex, open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openRef.current) {
          closeAndClear();
          return;
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (!openRef.current) return;

      const r = resultsRef.current;
      const idx = selectedIndexRef.current;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, r.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && idx >= 0 && r[idx]) {
        e.preventDefault();
        router.push(resultUrl(r[idx]));
        closeAndClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAndClear, router]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSelectedIndex(-1);
      try {
        const params = new URLSearchParams({ q: query });
        if (categoryFilter) params.set('category', categoryFilter);
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          console.error('[search-dialog] API error:', res.status);
          setResults([]);
          return;
        }
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, categoryFilter]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hover:text-[var(--color-text)] transition-colors text-sm text-[var(--color-text-muted)]"
        aria-label={t('triggerLabel')}
      >
        🔍
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/54 backdrop-blur-sm" />
          <div
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-lg border border-[color:var(--line)] bg-[var(--color-panel)] shadow-xl shadow-black/45"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                const nextQuery = e.target.value;
                setQuery(nextQuery);
                if (!nextQuery.trim()) {
                  setResults([]);
                  setSelectedIndex(-1);
                  setLoading(false);
                }
              }}
              placeholder={t('placeholder')}
              className="w-full px-4 py-3 text-lg border-b border-[color:var(--line)] outline-none"
              role="search"
              aria-label={t('ariaLabel')}
            />

            {categories.length > 0 && (
              <div className="px-4 py-2 border-b border-[color:var(--line)] bg-[var(--color-panel-soft)]/80">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1 outline-none"
                >
                  <option value="">{t('allCategories')}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loading && (
              <div className="px-4 py-8 text-center text-[var(--color-text-faint)] text-sm">
                {t('loading')}
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-[var(--color-text-faint)] text-sm">
                {t('noResults')}
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-2">
                {results.map((result, i) => (
                  <button
                    key={result._id}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      i === selectedIndex ? 'bg-[var(--color-panel-soft)]' : 'hover:bg-[var(--color-panel-soft)]'
                    }`}
                    onClick={() => {
                      router.push(resultUrl(result));
                      closeAndClear();
                    }}
                  >
                    <div className="font-medium text-sm text-[var(--color-text)]">{result.title}</div>
                    <div className="text-xs text-[var(--color-text-faint)] mt-0.5">
                      {result.category.title} &gt; {result.project.title}
                    </div>
                    {result.excerpt && (
                      <div className="text-xs text-[var(--color-text-faint)] mt-1 line-clamp-1">
                        {result.excerpt}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
