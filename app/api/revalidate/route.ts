import { timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { generateUnsubscribeToken } from '@/lib/auth/token';
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

        if (body._id && body.notified !== true) {
          try {
            await sendNewContentNotification(_type, body._id);
          } catch (err) {
            console.error('[revalidate] New-content notification error:', err);
          }
        }
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

async function sendNewPostNotification(blogId: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notification] RESEND_API_KEY not set, skipping');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  const post = await client.fetch(
    groq`*[_id == $id][0]{
      title,
      language,
      excerpt,
      "slug": slug.current,
      "project": project->{"slug": slug.current, title},
      "category": project->category->{"slug": slug.current, title},
      "collection": collection->{"slug": slug.current}
    }`,
    { id: blogId }
  );

  if (!post?.title || !post?.category?.slug || !post?.category?.title
      || !post?.project?.slug || !post?.project?.title || !post?.slug) {
    console.warn('[notification] Post not found or missing refs:', blogId);
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

  // Fetch all contacts (with pagination, max 500)
  const allContacts: { id: string; email: string }[] = [];
  let after: string | undefined;
  let hasMore = true;
  while (hasMore && allContacts.length < 500) {
    const listResponse = await resend.contacts.list(
      after ? { after, limit: 100 } : { limit: 100 }
    );
    if (listResponse.error) {
      console.error('[notification] contacts.list error:', listResponse.error);
      break;
    }
    const data = listResponse.data?.data;
    if (data && data.length > 0) {
      allContacts.push(...data.map((c) => ({ id: c.id, email: c.email })));
    }
    hasMore = listResponse.data?.has_more ?? false;
    after = data?.[data.length - 1]?.id;
  }

  if (allContacts.length === 0) {
    console.log('[notification] No contacts found');
    return;
  }

  // Filter contacts by subscription preferences (N+1 — contacts.list() doesn't return properties)
  const matched: { id: string; email: string }[] = [];
  for (const contact of allContacts) {
    try {
      const getResult = await resend.contacts.get(contact.id);
      if (getResult.error) {
        // Fail-open: include contact if we can't read their preferences
        console.warn('[notification] contacts.get error for', contact.email, ':', getResult.error);
        matched.push(contact);
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
        // Legacy subscriber — no preferences set, send all
        matched.push(contact);
      } else {
        const prefSet = new Set(subs.split(','));
        if (
          prefSet.has(`category:${postCatSlug}`) ||
          prefSet.has(`project:${postProjSlug}`) ||
          (postColSlug && prefSet.has(`collection:${postProjSlug}/${postColSlug}`))
        ) {
          matched.push(contact);
        }
      }
    } catch (err) {
      // Fail-open: include contact on unexpected error
      console.warn('[notification] contacts.get threw for', contact.email, ':', err);
      matched.push(contact);
    }
  }

  if (matched.length === 0) {
    console.log('[notification] No matching subscribers for post:', blogId);
    return;
  }

  // Wait 1s for rate-limit window to clear from contacts.get() calls above
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Send emails sequentially to avoid Resend rate limit (5 req/s on free tier)
  for (let i = 0; i < matched.length; i++) {
    const c = matched[i];
    try {
      const unsubscribeUrl = `${siteUrl}/api/unsubscribe?c=${c.id}&t=${generateUnsubscribeToken(c.id)}`;

      const result = await resend.emails.send({
        from: 'ICEAXING <notify@iceaxing.com>',
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
          postExcerpt: post.excerpt ?? undefined,
          unsubscribeUrl,
        }),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      if (result.error) {
        console.error('[notification] Send error for', c.email, ':', result.error);
      }
    } catch (err) {
      console.error('[notification] Send threw for', c.email, ':', err);
    }

    // 250ms delay between sends to stay under rate limit
    if (matched.length > 1 && i < matched.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

type ContentType = 'category' | 'project' | 'collection';

async function sendNewContentNotification(
  type: ContentType,
  docId: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notification] RESEND_API_KEY not set, skipping');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com';

  // Fetch new content with resolved parent references
  const contentQueries: Record<ContentType, string> = {
    category: groq`*[_id == $id][0]{
      title,
      "slug": slug.current,
      description
    }`,
    project: groq`*[_id == $id][0]{
      title,
      "slug": slug.current,
      description,
      "category": category->{"slug": slug.current, title}
    }`,
    collection: groq`*[_id == $id][0]{
      title,
      "slug": slug.current,
      description,
      "project": project->{"slug": slug.current, title},
      "category": project->category->{"slug": slug.current, title}
    }`,
  };

  const doc = await client.fetch(contentQueries[type], { id: docId });

  if (!doc?.title || !doc?.slug) {
    console.warn('[notification] New content not found:', docId);
    return;
  }

  // Build content URL
  let contentUrl: string;
  let parentSlug: string | undefined;
  let parentTitle: string | undefined;

  switch (type) {
    case 'category':
      contentUrl = `${siteUrl}/${doc.slug}`;
      break;
    case 'project':
      if (!doc.category?.slug) {
        console.warn('[notification] Project missing category ref:', docId);
        return;
      }
      contentUrl = `${siteUrl}/${doc.category.slug}/${doc.slug}`;
      parentSlug = doc.category.slug;
      parentTitle = doc.category.title;
      break;
    case 'collection':
      if (!doc.project?.slug || !doc.category?.slug) {
        console.warn('[notification] Collection missing project/category ref:', docId);
        return;
      }
      contentUrl = `${siteUrl}/${doc.category.slug}/${doc.project.slug}/${doc.slug}`;
      parentSlug = doc.project.slug;
      parentTitle = doc.project.title;
      break;
  }

  const { Resend } = await import('resend');
  const { NewContentNotificationEmail } = await import(
    '@/lib/email/templates/new-content-notification'
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Fetch all contacts (with pagination, max 500)
  const allContacts: { id: string; email: string }[] = [];
  let after: string | undefined;
  let hasMore = true;
  while (hasMore && allContacts.length < 500) {
    const listResponse = await resend.contacts.list(
      after ? { after, limit: 100 } : { limit: 100 }
    );
    if (listResponse.error) {
      console.error('[notification] contacts.list error:', listResponse.error);
      break;
    }
    const data = listResponse.data?.data;
    if (data && data.length > 0) {
      allContacts.push(...data.map((c) => ({ id: c.id, email: c.email })));
    }
    hasMore = listResponse.data?.has_more ?? false;
    after = data?.[data.length - 1]?.id;
  }

  if (allContacts.length === 0) {
    console.log('[notification] No contacts found');
    return;
  }

  // Separate global and targeted recipients
  const globalRecipients: { id: string; email: string }[] = [];
  const targetedRecipients: { id: string; email: string }[] = [];

  // Build the preference key for the new content itself (to skip already-subscribed)
  const contentKey =
    type === 'category' ? `category:${doc.slug}` :
    type === 'project' ? `project:${doc.slug}` :
    `collection:${parentSlug}/${doc.slug}`;

  for (const contact of allContacts) {
    try {
      const getResult = await resend.contacts.get(contact.id);
      if (getResult.error) {
        // Fail-open: include as global (safe default)
        console.warn('[notification] contacts.get error for', contact.email, ':', getResult.error);
        globalRecipients.push(contact);
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
        // Global subscriber — notify without asking
        globalRecipients.push(contact);
      } else {
        const prefSet = new Set(subs.split(','));

        // Already subscribed to this content — skip
        if (prefSet.has(contentKey)) {
          continue;
        }

        // All targeted subscribers get notified about new content structure
        targetedRecipients.push(contact);
      }
    } catch (err) {
      // Fail-open: include as global
      console.warn('[notification] contacts.get threw for', contact.email, ':', err);
      globalRecipients.push(contact);
    }
  }

  if (globalRecipients.length === 0 && targetedRecipients.length === 0) {
    console.log('[notification] No relevant subscribers for new', type, docId);
    return;
  }

  // Wait 1s for rate-limit window to clear
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Combine into single ordered list: global first, then targeted
  const allRecipients: { id: string; email: string; isGlobal: boolean }[] = [
    ...globalRecipients.map((c) => ({ ...c, isGlobal: true })),
    ...targetedRecipients.map((c) => ({ ...c, isGlobal: false })),
  ];

  let sentCount = 0;

  // Send emails sequentially to avoid Resend rate limit (5 req/s on free tier)
  for (let i = 0; i < allRecipients.length; i++) {
    const c = allRecipients[i];
    try {
      const unsubscribeUrl = `${siteUrl}/api/unsubscribe?c=${c.id}&t=${generateUnsubscribeToken(c.id)}`;

      const result = await resend.emails.send({
        from: 'ICEAXING <notify@iceaxing.com>',
        to: c.email,
        subject: `iceaxing 新增内容 / New Content: ${doc.title}`,
        react: NewContentNotificationEmail({
          contentType: type,
          contentName: doc.title,
          contentDescription: doc.description ?? undefined,
          parentName: parentTitle,
          contentUrl,
          isGlobal: c.isGlobal,
          unsubscribeUrl,
        }),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      if (result.error) {
        console.error('[notification] Send error for', c.email, ':', result.error);
      } else {
        sentCount++;
      }
    } catch (err) {
      console.error('[notification] Send threw for', c.email, ':', err);
    }

    // 250ms delay between sends to stay under rate limit
    if (i < allRecipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  // Patch document to mark as notified (best-effort)
  if (sentCount > 0 && process.env.SANITY_API_WRITE_TOKEN) {
    try {
      await writeClient.patch(docId).set({ notified: true }).commit();
    } catch (err) {
      console.error('[notification] Failed to patch notified for', docId, ':', err);
    }
  } else if (sentCount > 0) {
    console.warn('[notification] SANITY_API_WRITE_TOKEN not set — notified field not patched for', docId);
  }
}
