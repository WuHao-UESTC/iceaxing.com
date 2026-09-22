import { getProfile } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';
import Image from 'next/image';
import { PageMotionItem } from '@/components/layout/page-transition';

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'profile' });
  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: getStaticAlternates(locale, '/profile'),
    openGraph: {
      title: t('title'),
      description: t('metaDescription'),
      url: localizedUrl(locale, '/profile'),
    },
  };
}

export default async function ProfilePage() {
  const tc = await getTranslations('common');
  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="snowline-page">
        <EmptyState message={tc('emptyProfile')} />
      </div>
    );
  }

  return (
    <div className="snowline-page">
      <PageMotionItem step={0}>
        <div className="flex items-center gap-4 mb-8">
          {profile.avatar && (
            <Image
              src={urlFor(profile.avatar).width(96).height(96).format('webp').url()}
              alt={profile.name}
              width={64}
              height={64}
              unoptimized
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <h1 className="text-3xl font-bold">{profile.name}</h1>
        </div>
      </PageMotionItem>

      <PageMotionItem step={1}>
        <div className="prose prose-zinc mb-8">
          <BlogBody content={profile.bio} />
        </div>
      </PageMotionItem>

      {profile.socialLinks && profile.socialLinks.length > 0 && (
        <PageMotionItem step={2}>
          <div className="flex gap-4">
            {profile.socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-blue-soft)] hover:text-[var(--color-sand)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </PageMotionItem>
      )}
    </div>
  );
}
