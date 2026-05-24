import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  try {
    const staticPages = ['', '/about', '/friends', '/profile', '/log'];

    const [blogs, logs, categories, projects, collections] = await Promise.all([
      client.fetch(groq`
        *[_type == "blog"] {
          "slug": slug.current,
          "project": project->slug.current,
          "category": project->category->slug.current,
          "collection": collection->slug.current
        }
      `),
      client.fetch(groq`
        *[_type == "log"] { "slug": slug.current }
      `),
      client.fetch(groq`
        *[_type == "category"] { "slug": slug.current }
      `),
      client.fetch(groq`
        *[_type == "project"] {
          "slug": slug.current,
          "category": category->slug.current
        }
      `),
      client.fetch(groq`
        *[_type == "collection"] {
          "slug": slug.current,
          "project": project->slug.current,
          "category": project->category->slug.current
        }
      `),
    ]);

    const zhUrls = [
      ...staticPages.map((path) => `${siteUrl}${path}`),
      ...categories.map(
        (c: any) => `${siteUrl}/${c.slug}`
      ),
      ...projects
        .filter((p: any) => p.category)
        .map(
          (p: any) => `${siteUrl}/${p.category}/${p.slug}`
        ),
      ...collections
        .filter((c: any) => c.category && c.project)
        .map(
          (c: any) => `${siteUrl}/${c.category}/${c.project}/${c.slug}`
        ),
      ...blogs
        .filter((b: any) => b.category && b.project)
        .map((b: any) => {
          if (b.collection) {
            return `${siteUrl}/${b.category}/${b.project}/${b.collection}/${b.slug}`;
          }
          return `${siteUrl}/${b.category}/${b.project}/${b.slug}`;
        }),
      ...logs.map(
        (l: any) => `${siteUrl}/log/${l.slug}`
      ),
    ];

    const enUrls = zhUrls.map((url: string) => {
      // static pages: '' → '/en', '/about' → '/en/about', etc.
      return url.replace(siteUrl, `${siteUrl}/en`);
    });

    const urls = [...zhUrls, ...enUrls];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(urls)]
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${
      url === siteUrl || url === `${siteUrl}/en` ? '1.0' : '0.7'
    }</priority>
  </url>`
  )
  .join('\n')}
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
