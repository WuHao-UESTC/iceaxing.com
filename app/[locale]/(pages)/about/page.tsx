import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';
import { getAbout } from '@/lib/sanity/queries';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { EmptyState } from '@/components/ui/empty-state';

export const revalidate = 60;

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

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const about = await getAbout(locale);
  const t = await getTranslations('about');
  const tc = await getTranslations('common');

  if (!about) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <EmptyState message="About content has not been created in Sanity yet." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{about.title || t('title')}</h1>
      <div className="prose prose-zinc">
        {about.body && about.body.length > 0 ? (
          <BlogBody content={about.body} />
        ) : (
          <p>{about.intro}</p>
        )}
      </div>
      <Link href="/" className="text-sm text-[var(--color-blue-soft)] hover:text-[var(--color-sand)] mt-8 inline-block">
        {tc('backToHome')}
      </Link>
    </div>
  );
}
