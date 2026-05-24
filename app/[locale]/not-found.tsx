import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export async function generateMetadata() {
  const t = await getTranslations('notFound');
  return { title: t('metaTitle') };
}

export default async function NotFoundPage() {
  const t = await getTranslations('notFound');

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🧭</div>
      <h1 className="text-2xl font-bold mb-2">{t('heading')}</h1>
      <p className="text-zinc-500 mb-6">{t('description')}</p>
      <Link
        href="/"
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800 transition-colors"
      >
        {t('backToHome')}
      </Link>
    </div>
  );
}
