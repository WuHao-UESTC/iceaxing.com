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
        className="sm:hidden text-lg text-[var(--color-text)] hover:text-[var(--color-sand)]"
        aria-label={t('menuAriaLabel')}
      >
        {open ? 'x' : '='}
      </button>

      {open && (
        <div
          ref={menuRef}
          className="sm:hidden absolute top-full right-0 mt-3 w-64 rounded-lg border border-[color:var(--line)] bg-[var(--color-panel)] px-4 py-4 shadow-xl shadow-black/40"
        >
          <nav className="flex flex-col gap-3 text-[var(--color-text)]">
            {categories.length > 0 && (
              <>
                <div className="text-sm font-semibold text-[var(--color-text-faint)]">{t('categories')}</div>
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/${cat.slug}`}
                    onClick={close}
                    className="text-sm hover:text-[var(--color-sand)] transition-colors"
                  >
                    {cat.title}
                  </Link>
                ))}
                <hr className="border-[color:var(--line)]" />
              </>
            )}
            <Link href="/log" onClick={close} className="text-sm hover:text-[var(--color-sand)]">{t('log')}</Link>
            <Link href="/about" onClick={close} className="text-sm hover:text-[var(--color-sand)]">{t('about')}</Link>
            <Link href="/friends" onClick={close} className="text-sm hover:text-[var(--color-sand)]">{t('friends')}</Link>
          </nav>
        </div>
      )}
    </>
  );
}
