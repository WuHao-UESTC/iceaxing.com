'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
interface Props {
  sectionLinks: {
    href: string;
    label: string;
    categories: { _id: string; slug: string; title: string }[];
  }[];
}

export function MobileNav({ sectionLinks }: Props) {
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
            {sectionLinks.map((link) => (
              link.categories.length > 0 ? (
                <div key={link.href} className="grid gap-2">
                  <Link href={link.href} onClick={close} className="text-sm font-semibold hover:text-[var(--color-sand)]">
                    {link.label}
                  </Link>
                  <div className="grid gap-2 border-l border-[color:var(--line)] pl-3">
                    {link.categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/${cat.slug}`}
                        onClick={close}
                        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-sand)]"
                      >
                        {cat.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={link.href} href={link.href} onClick={close} className="text-sm hover:text-[var(--color-sand)]">
                  {link.label}
                </Link>
              )
            ))}
            <hr className="border-[color:var(--line)]" />
            <Link href="/log" onClick={close} className="text-sm hover:text-[var(--color-sand)]">{t('log')}</Link>
            <Link href="/about" onClick={close} className="text-sm hover:text-[var(--color-sand)]">{t('about')}</Link>
            <Link href="/friends" onClick={close} className="text-sm hover:text-[var(--color-sand)]">{t('friends')}</Link>
            <Link href="/profile" onClick={close} className="text-sm hover:text-[var(--color-sand)]">{t('profile')}</Link>
          </nav>
        </div>
      )}
    </>
  );
}
