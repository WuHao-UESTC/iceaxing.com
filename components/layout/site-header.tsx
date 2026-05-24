import { Link } from '@/lib/i18n/navigation';
import { getAllCategories } from '@/lib/sanity/queries';
import { SearchDialog } from '@/components/ui/search-dialog';
import { SubscribeDialog } from '@/components/subscribe/subscribe-dialog';
import { MobileNav } from './mobile-nav';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { getTranslations } from 'next-intl/server';

export async function SiteHeader() {
  const categories = await getAllCategories();
  const t = await getTranslations('nav');

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="font-bold text-lg tracking-tight">
          iceaxing
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-600">
          <div className="relative group">
            <button className="hover:text-zinc-900 transition-colors">
              {t('categories')}
            </button>
            <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px] py-1">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/${cat.slug}`}
                  className="block px-4 py-2 hover:bg-zinc-50 text-sm"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/log" className="hover:text-zinc-900 transition-colors">
            {t('log')}
          </Link>
          <Link href="/about" className="hover:text-zinc-900 transition-colors">
            {t('about')}
          </Link>
          <Link href="/friends" className="hover:text-zinc-900 transition-colors">
            {t('friends')}
          </Link>

          <SearchDialog categories={categories} />
          <SubscribeDialog />
          <LanguageSwitcher />
        </nav>

        {/* Mobile nav — hamburger */}
        <div className="relative flex items-center gap-2 sm:hidden">
          <SearchDialog categories={categories} />
          <SubscribeDialog />
          <LanguageSwitcher />
          <MobileNav categories={categories} />
        </div>
      </div>
    </header>
  );
}
