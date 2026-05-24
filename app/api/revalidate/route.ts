import { timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

const SAFE_COMPARE_LENGTH = 64;

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.alloc(SAFE_COMPARE_LENGTH, 0);
  const bufB = Buffer.alloc(SAFE_COMPARE_LENGTH, 0);
  Buffer.from(a).copy(bufA);
  Buffer.from(b).copy(bufB);
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-sanity-webhook-secret');
  const expectedSecret = process.env.SANITY_WEBHOOK_SECRET;

  if (!secret || !expectedSecret) {
    if (!expectedSecret) {
      console.error('[revalidate] SANITY_WEBHOOK_SECRET env var is not set');
    }
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!safeCompare(secret, expectedSecret)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body._type !== 'string') {
      return NextResponse.json(
        { message: 'Invalid webhook payload: missing _type' },
        { status: 400 }
      );
    }

    const { _type } = body;

    switch (_type) {
      case 'blog':
        revalidatePath('/', 'layout');
        revalidatePath('/en', 'layout');

        // Send new-post notification whenever a blog post is published/re-published.
        // (We guard against stale re-publishes inside sendNewPostNotification.)
        if (body._id) {
          try {
            await sendNewPostNotification(body._id);
          } catch (err) {
            console.error('[revalidate] Notification error:', err);
          }
        }
        break;

      case 'category':
      case 'project':
      case 'collection':
        revalidatePath('/', 'layout');
        revalidatePath('/en', 'layout');
        break;

      case 'log':
        revalidatePath('/log', 'layout');
        revalidatePath('/en/log', 'layout');
        break;

      case 'friend':
        revalidatePath('/friends', 'layout');
        revalidatePath('/en/friends', 'layout');
        break;

      case 'profile':
        revalidatePath('/profile', 'layout');
        revalidatePath('/en/profile', 'layout');
        break;

      default:
        console.warn('[revalidate] Unknown document type:', _type);
        return NextResponse.json(
          { message: `Unknown document type: ${_type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      { message: 'Error revalidating' },
      { status: 500 }
    );
  }
}

async function sendNewPostNotification(blogId: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[revalidate] RESEND_API_KEY not set, skipping notification');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  const post = await client.fetch(
    groq`*[_id == $id][0]{
      title,
      language,
      "slug": slug.current,
      "project": project->{"slug": slug.current, title},
      "category": project->category->{"slug": slug.current, title},
      "collection": collection->{"slug": slug.current}
    }`,
    { id: blogId }
  );

  if (!post?.title || !post?.category?.slug || !post?.category?.title
      || !post?.project?.slug || !post?.project?.title || !post?.slug) {
    console.warn('[revalidate] Post not found or missing refs for notification:', blogId);
    return;
  }

  const postUrl = post.collection?.slug
    ? `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.collection.slug}/${post.slug}`
    : `${siteUrl}/${post.category.slug}/${post.project.slug}/${post.slug}`;

  const postCatSlug = post.category.slug;
  const postProjSlug = post.project.slug;
  const postColSlug = post.collection?.slug ?? null;
  const postLocale: 'zh' | 'en' = post.language === 'en' ? 'en' : 'zh';

  const { Resend } = await import('resend');
  const { NewPostNotificationEmail } = await import(
    '@/lib/email/templates/new-post-notification'
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Fetch all contacts (with pagination)
  const allContacts: { id: string; email: string }[] = [];
  let after: string | undefined;
  let hasMore = true;
  while (hasMore && allContacts.length < 500) {
    const listResponse = await resend.contacts.list(
      after ? { after, limit: 100 } : { limit: 100 }
    );
    if (listResponse.error) {
      console.error('[revalidate] contacts.list error:', listResponse.error);
      break;
    }
    const data = listResponse.data?.data;
    if (data && data.length > 0) {
      allContacts.push(...data.map((c) => ({ id: c.id, email: c.email })));
    }
    hasMore = listResponse.data?.has_more ?? false;
    after = data?.[data.length - 1]?.id;
  }

  if (allContacts.length === 0) return;

  // Filter contacts by subscription preferences
  const matchedContacts: { id: string; email: string }[] = [];
  for (const contact of allContacts) {
    try {
      const getResult = await resend.contacts.get(contact.id);
      if (getResult.error) {
        // If we can't read properties, include the contact (fail-open)
        matchedContacts.push(contact);
        continue;
      }
      const props = getResult.data?.properties as
        | Record<string, { type: string; value: unknown }>
        | undefined;
      const subsProp = props?.subscriptions;
      const subs: string | undefined =
        subsProp?.type === 'string' && typeof subsProp.value === 'string'
          ? subsProp.value
          : undefined;

      if (subs === undefined || subs === '') {
        // Legacy subscriber or "all content" — include
        matchedContacts.push(contact);
      } else {
        const prefSet = new Set(subs.split(','));
        if (
          prefSet.has(`category:${postCatSlug}`) ||
          prefSet.has(`project:${postProjSlug}`) ||
          (postColSlug && prefSet.has(`collection:${postProjSlug}/${postColSlug}`))
        ) {
          matchedContacts.push(contact);
        }
      }
    } catch {
      // Fail-open: include contact if we can't read preferences
      matchedContacts.push(contact);
    }
  }

  if (matchedContacts.length === 0) {
    console.log('[revalidate] No matching subscribers for this post');
    return;
  }

  // Send emails in parallel
  const results = await Promise.allSettled(
    matchedContacts.map((c) =>
      resend.emails.send({
        from: 'notify@iceaxing.com',
        to: c.email,
        subject: postLocale === 'en'
          ? `iceaxing — New Post: ${post.title}`
          : `iceaxing 新文章: ${post.title}`,
        react: NewPostNotificationEmail({
          postTitle: post.title,
          postUrl,
          category: post.category.title,
          project: post.project.title,
          locale: postLocale,
        }),
      })
    )
  );

  const failed = results.filter((r) => {
    if (r.status === 'rejected') return true;
    if (r.status === 'fulfilled' && (r.value as { error?: unknown })?.error) return true;
    return false;
  }).length;
  if (failed > 0) {
    console.warn(`[revalidate] ${failed}/${results.length} notification emails failed`);
  }
}
