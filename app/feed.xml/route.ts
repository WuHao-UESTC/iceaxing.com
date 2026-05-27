import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { Feed } from 'feed';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  try {
    const posts = await client.fetch(groq`
      *[_type == "blog"] | order(publishedAt desc) [0...20] {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        publishedAt,
        "project": project->{title, "slug": slug.current},
        "category": coalesce(
          category->{"slug": slug.current},
          project->category->{"slug": slug.current}
        ),
        "collection": collection->{"slug": slug.current}
      }
    `);

    const feed = new Feed({
      title: 'iceaxing',
      description: 'iceaxing 的个人博客',
      id: siteUrl,
      link: siteUrl,
      language: 'zh',
      copyright: `All rights reserved ${new Date().getFullYear()}`,
      feedLinks: {
        rss2: `${siteUrl}/feed.xml`,
      },
    });

    for (const post of posts) {
      if (!post.category?.slug || !post.slug) continue;

      const link = post.project?.slug && post.collection?.slug
        ? `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.collection.slug}/${post.slug}`
        : post.project?.slug
          ? `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.slug}`
          : `${siteUrl}/${post.category.slug}/${post.slug}`;

      feed.addItem({
        title: post.title,
        id: post._id,
        link,
        description: post.excerpt || '',
        date: new Date(post.publishedAt),
      });
    }

    return new Response(feed.rss2(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>iceaxing</title><description>Temporarily unavailable</description></channel></rss>',
      {
        status: 503,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
