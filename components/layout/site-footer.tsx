import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const t = await getTranslations('nav');

  return (
    <footer className="border-t border-[color:var(--line)] py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[var(--color-text-faint)]">
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/profile" className="hover:text-[var(--color-text)] transition-colors">
            {t('profile')}
          </Link>
          <a href="/feed.xml" className="hover:text-[var(--color-text)] transition-colors">
            {t('rss')}
          </a>
        </div>
        <p>&copy; {currentYear} iceaxing @ 1.0.0</p>
      </div>
    </footer>
  );
}
