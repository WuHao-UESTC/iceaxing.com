'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { CategoryDoc } from '@/lib/sanity/types';

interface Props {
  categories: CategoryDoc[];
}

export function MobileNav({ categories }: Props) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="sm:hidden text-lg"
        aria-label={t('menuAriaLabel')}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div
          ref={menuRef}
          className="sm:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg py-4 px-4"
        >
          <nav className="flex flex-col gap-3">
            {categories.length > 0 && (
              <>
                <div className="text-sm font-semibold text-zinc-400">{t('categories')}</div>
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/${cat.slug}`}
                    onClick={close}
                    className="text-sm hover:text-zinc-900 transition-colors"
                  >
                    {cat.title}
                  </Link>
                ))}
                <hr />
              </>
            )}
            <Link href="/log" onClick={close} className="text-sm">{t('log')}</Link>
            <Link href="/about" onClick={close} className="text-sm">{t('about')}</Link>
            <Link href="/friends" onClick={close} className="text-sm">{t('friends')}</Link>
          </nav>
        </div>
      )}
    </>
  );
}
