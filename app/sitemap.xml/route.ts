import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { SITE_URL, absoluteUrl, localizedUrl } from '@/lib/seo';

interface SitemapEntry {
  url: string;
  priority: string;
  lastmod?: string;
}

interface BlogSitemapDoc {
  slug?: string;
  language?: 'zh' | 'en';
  publishedAt?: string;
  updatedAt?: string;
  _updatedAt?: string;
  project?: string;
  category?: string;
  collection?: string;
}

interface LogSitemapDoc {
  slug?: string;
  date?: string;
  _updatedAt?: string;
}

interface CategorySitemapDoc {
  slug?: string;
}

interface ProjectSitemapDoc {
  slug?: string;
  category?: string;
}

interface CollectionSitemapDoc {
  slug?: string;
  project?: string;
  category?: string;
}

function sitemapEntry({ url, priority, lastmod }: SitemapEntry) {
  return `  <url>
    <loc>${url}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const siteUrl = SITE_URL;

  try {
    const staticPages = ['', '/about', '/friends', '/profile', '/log'];

    const [blogs, logs, categories, projects, collections] = await Promise.all([
      client.fetch<BlogSitemapDoc[]>(groq`
        *[_type == "blog" && defined(slug.current)] {
          "slug": slug.current,
          language,
          publishedAt,
          updatedAt,
          _updatedAt,
          "project": project->slug.current,
          "category": project->category->slug.current,
          "collection": collection->slug.current
        }
      `),
      client.fetch<LogSitemapDoc[]>(groq`
        *[_type == "log" && defined(slug.current)] {
          "slug": slug.current,
          date,
          _updatedAt
        }
      `),
      client.fetch<CategorySitemapDoc[]>(groq`
        *[_type == "category" && defined(slug.current)] {
          "slug": slug.current
        }
      `),
      client.fetch<ProjectSitemapDoc[]>(groq`
        *[_type == "project" && defined(slug.current)] {
          "slug": slug.current,
          "category": category->slug.current
        }
      `),
      client.fetch<CollectionSitemapDoc[]>(groq`
        *[_type == "collection" && defined(slug.current)] {
          "slug": slug.current,
          "project": project->slug.current,
          "category": project->category->slug.current
        }
      `),
    ]);

    const staticUrls: SitemapEntry[] = staticPages.flatMap((path) => [
      { url: localizedUrl('zh', path), priority: path === '' ? '1.0' : '0.7' },
      { url: localizedUrl('en', path), priority: path === '' ? '1.0' : '0.7' },
    ]);

    const zhSectionUrls: SitemapEntry[] = [
      ...categories.map((c) => ({
        url: absoluteUrl(`/${c.slug}`),
        priority: '0.7',
      })),
      ...projects
        .filter((p) => p.category)
        .map((p) => ({
          url: absoluteUrl(`/${p.category}/${p.slug}`),
          priority: '0.7',
        })),
      ...collections
        .filter((c) => c.category && c.project)
        .map((c) => ({
          url: absoluteUrl(`/${c.category}/${c.project}/${c.slug}`),
          priority: '0.7',
        })),
      ...logs.map((l) => ({
        url: absoluteUrl(`/log/${l.slug}`),
        priority: '0.7',
        lastmod: l.date || l._updatedAt,
      })),
    ];

    const enSectionUrls = zhSectionUrls.map((entry) => ({
      ...entry,
      url: entry.url.replace(siteUrl, `${siteUrl}/en`),
    }));

    const blogUrls: SitemapEntry[] = blogs
      .filter((b) => b.category && b.project && b.slug)
      .map((b) => {
        const path = b.collection
          ? `/${b.category}/${b.project}/${b.collection}/${b.slug}`
          : `/${b.category}/${b.project}/${b.slug}`;

        return {
          url: b.language === 'en' ? localizedUrl('en', path) : localizedUrl('zh', path),
          priority: '0.8',
          lastmod: b.updatedAt || b.publishedAt || b._updatedAt,
        };
      });

    const urls = [...staticUrls, ...zhSectionUrls, ...enSectionUrls, ...blogUrls];
    const uniqueUrls = Array.from(new Map(urls.map((entry) => [entry.url, entry])).values());

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map(sitemapEntry).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 503,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
