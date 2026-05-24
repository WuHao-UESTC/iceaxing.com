import { getProfile } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('profile');
  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

export default async function ProfilePage() {
  const t = await getTranslations('profile');
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
          <img
            src={urlFor(profile.avatar).width(96).height(96).format('webp').url()}
            alt={profile.name}
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
