import { getAllCategories } from '@/lib/sanity/queries';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export async function StaticHomePage() {
  const categories = await getAllCategories();
  const t = await getTranslations('home');
  const tn = await getTranslations('nav');

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Image
        src="/assets/manor-under-construction.png"
        alt={t('imageAlt')}
        width={256}
        height={256}
        className="pixelated-image mx-auto mb-8 w-64 h-64"
      />
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      <p className="text-zinc-500 mb-8">{t('subtitle')}</p>
      <nav className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/${cat.slug}`}
            className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
          >
            {cat.title}
          </Link>
        ))}
        <Link
          href="/log"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          {tn('log')}
        </Link>
        <Link
          href="/about"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          {tn('about')}
        </Link>
        <Link
          href="/friends"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          {tn('friends')}
        </Link>
        <Link
          href="/profile"
          className="px-4 py-2 border rounded-full text-sm hover:bg-zinc-50 transition-colors"
        >
          {tn('profile')}
        </Link>
      </nav>
    </div>
  );
}
