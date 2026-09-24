import { getFriends } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';
import Image from 'next/image';
import { PageMotionItem } from '@/components/layout/page-transition';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'friends' });
  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: getStaticAlternates(locale, '/friends'),
    openGraph: {
      title: t('title'),
      description: t('metaDescription'),
      url: localizedUrl(locale, '/friends'),
    },
  };
}

export default async function FriendsPage() {
  const t = await getTranslations('friends');
  const tc = await getTranslations('common');
  const friends = await getFriends();

  return (
    <div className="snowline-page">
      <PageMotionItem step={0}>
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      </PageMotionItem>

      <PageMotionItem step={1}>
        {friends.length === 0 ? (
          <EmptyState message={tc('emptyFriends')} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {friends.map((friend) => (
              <a
                key={friend._id}
                href={friend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="snowline-friend flex items-start gap-4 border transition-colors"
              >
                {friend.avatar && (
                  <Image
                    src={urlFor(friend.avatar).width(80).height(80).format('webp').url()}
                    alt={friend.name}
                    width={40}
                    height={40}
                    sizes="40px"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div>
                  <h2 className="font-semibold">{friend.name}</h2>
                  {friend.description && (
                    <p className="text-sm text-zinc-500 line-clamp-2">
                      {friend.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </PageMotionItem>
    </div>
  );
}
