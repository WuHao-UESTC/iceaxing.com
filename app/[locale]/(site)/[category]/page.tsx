import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import { getCategoryBySlug, getProjectsByCategory } from '@/lib/sanity/queries';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';

interface Props {
  params: Promise<{ locale: string; category: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const cat = await getCategoryBySlug(category);
  if (!cat) return { title: t('notFound') };
  return {
    title: cat.title,
    description: cat.description || `${cat.title}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const projects = await getProjectsByCategory(category);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{cat.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{cat.title}</h1>
      {cat.description && (
        <p className="text-zinc-500 mb-8">{cat.description}</p>
      )}

      {projects.length === 0 ? (
        <EmptyState message={t('emptyProjects')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/${category}/${project.slug}`}
              className="block p-6 border rounded-lg hover:border-zinc-400 transition-colors"
            >
              <h2 className="font-semibold text-lg mb-1">{project.title}</h2>
              {project.description && (
                <p className="text-sm text-zinc-500 line-clamp-2">
                  {project.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
