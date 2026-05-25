import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: getStaticAlternates(locale, '/about'),
    openGraph: {
      title: t('title'),
      description: t('metaDescription'),
      url: localizedUrl(locale, '/about'),
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations('about');
  const tc = await getTranslations('common');

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      <div className="prose prose-zinc">
        <p>
          这里写关于你的内容。Phase 1 先手写静态 HTML，
          Phase 2 考虑迁入 Sanity profile 或保持静态。
        </p>
      </div>
      <Link href="/" className="text-sm text-blue-600 hover:underline mt-8 inline-block">
        {tc('backToHome')}
      </Link>
    </div>
  );
}
