import { getAllLogs } from '@/lib/sanity/queries';
import { getTranslations } from 'next-intl/server';
import { LogGrid } from '@/components/log/log-grid';

export async function generateMetadata() {
  const t = await getTranslations('log');
  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

const categoryColorMap: Record<string, string> = {
  content: 'bg-amber-400 hover:bg-amber-500',
  site: 'bg-yellow-500 hover:bg-yellow-600',
  other: 'bg-orange-400 hover:bg-orange-500',
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
