import { getAllLogs } from '@/lib/sanity/queries';
import { getTranslations } from 'next-intl/server';
import { LogGrid } from '@/components/log/log-grid';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'log' });
  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: getStaticAlternates(locale, '/log'),
    openGraph: {
      title: t('title'),
      description: t('metaDescription'),
      url: localizedUrl(locale, '/log'),
    },
  };
}

const categoryColorMap: Record<string, string> = {
  content: 'bg-[var(--color-gold)]',
  site: 'bg-[var(--color-blue-soft)]',
  other: 'bg-[var(--color-copper)]',
};

export default async function LogPage() {
  const t = await getTranslations('log');
  const logs = await getAllLogs();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <LogGrid
        logs={logs}
        categoryColorMap={categoryColorMap}
        legendContent={t('legendContent')}
        legendSite={t('legendSite')}
        legendOther={t('legendOther')}
      />
    </div>
  );
}
