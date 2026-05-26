import { getProfile } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';
import Image from 'next/image';

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
      <div className="max-w-2xl mx-auto px-4 py-12">
        <EmptyState message={tc('emptyProfile')} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        {profile.avatar && (
          <Image
            src={urlFor(profile.avatar).width(96).height(96).format('webp').url()}
            alt={profile.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <h1 className="text-3xl font-bold">{profile.name}</h1>
      </div>

      <div className="prose prose-zinc mb-8">
        <BlogBody content={profile.bio} />
      </div>

      {profile.socialLinks && profile.socialLinks.length > 0 && (
        <div className="flex gap-4">
          {profile.socialLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
