import { getFriends } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('friends');
  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

export default async function FriendsPage() {
  const t = await getTranslations('friends');
  const tc = await getTranslations('common');
  const friends = await getFriends();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

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
              className="flex items-start gap-4 p-4 border rounded-lg hover:border-zinc-400 transition-colors"
            >
              {friend.avatar && (
                <img
                  src={urlFor(friend.avatar).width(80).height(80).format('webp').url()}
                  alt={friend.name}
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
    </div>
  );
}
