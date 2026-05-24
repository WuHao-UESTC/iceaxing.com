import { StaticHomePage } from '@/components/home/static-homepage';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('home');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function HomePage() {
  return <StaticHomePage />;
}
