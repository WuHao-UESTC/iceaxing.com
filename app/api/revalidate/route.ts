import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { generateUnsubscribeToken } from '@/lib/auth/token';
import { client, writeClient } from '@/lib/sanity/client';

type ContentType = 'category' | 'project' | 'collection';
type ContactSummary = { id: string; email: string };
type ContactProperties =
  | Record<string, { type: string; value: unknown }>
  | undefined;

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.SANITY_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error('[revalidate] SANITY_WEBHOOK_SECRET env var is not set');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  if (!signature) {
    console.warn('[revalidate] Missing Sanity webhook signature header');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error('[revalidate] Failed to read webhook body:', error);
    return NextResponse.json(
      { message: 'Invalid webhook body' },
      { status: 400 }
    );
  }

  try {
    const isValid = await isValidSignature(rawBody, signature, expectedSecret);
    if (!isValid) {
      console.warn('[revalidate] Invalid Sanity webhook signature');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('[revalidate] Webhook signature verification failed:', error);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

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
  const config = getNotificationConfig();
  if (!config) return;

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

  if (
    !post?.title ||
    !post?.category?.slug ||
    !post?.category?.title ||
    !post?.project?.slug ||
    !post?.project?.title ||
    !post?.slug
  ) {
    console.warn('[notification] Post not found or missing refs:', blogId);
    return;
  }

  const postUrl = post.collection?.slug
    ? `${config.siteUrl}/${post.category.slug}/${post.project.slug}/${post.collection.slug}/${post.slug}`
    : `${config.siteUrl}/${post.category.slug}/${post.project.slug}/${post.slug}`;

  const postCatSlug = post.category.slug;
  const postProjSlug = post.project.slug;
  const postColSlug = post.collection?.slug ?? null;
  const postLocale: 'zh' | 'en' = post.language === 'en' ? 'en' : 'zh';

  const { Resend } = await import('resend');
  const { NewPostNotificationEmail } = await import(
    '@/lib/email/templates/new-post-notification'
  );
  const resend = new Resend(config.apiKey);
  const allContacts = await listSegmentContacts(resend, config.segmentId);

  if (allContacts.length === 0) {
    console.log('[notification] No contacts found');
    return;
  }

  const matched: ContactSummary[] = [];
  for (const contact of allContacts) {
    try {
      const subs = await getContactSubscriptions(resend, contact);

      if (subs === undefined || subs === '') {
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
      console.warn('[notification] contacts.get threw for', contact.email, ':', err);
      matched.push(contact);
    }
  }

  if (matched.length === 0) {
    console.log('[notification] No matching subscribers for post:', blogId);
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  for (let i = 0; i < matched.length; i++) {
    const c = matched[i];
    try {
      const unsubscribeUrl = `${config.siteUrl}/api/unsubscribe?c=${c.id}&t=${generateUnsubscribeToken(c.id)}`;

      const result = await resend.emails.send({
        from: 'ICEAXING <notify@iceaxing.com>',
        to: c.email,
        subject:
          postLocale === 'en'
            ? `iceaxing - New Post: ${post.title}`
            : `iceaxing - New Post: ${post.title}`,
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

    if (matched.length > 1 && i < matched.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

async function sendNewContentNotification(
  type: ContentType,
  docId: string
): Promise<void> {
  const config = getNotificationConfig();
  if (!config) return;

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

  let contentUrl: string;
  let parentSlug: string | undefined;
  let parentTitle: string | undefined;

  switch (type) {
    case 'category':
      contentUrl = `${config.siteUrl}/${doc.slug}`;
      break;
    case 'project':
      if (!doc.category?.slug) {
        console.warn('[notification] Project missing category ref:', docId);
        return;
      }
      contentUrl = `${config.siteUrl}/${doc.category.slug}/${doc.slug}`;
      parentSlug = doc.category.slug;
      parentTitle = doc.category.title;
      break;
    case 'collection':
      if (!doc.project?.slug || !doc.category?.slug) {
        console.warn('[notification] Collection missing project/category ref:', docId);
        return;
      }
      contentUrl = `${config.siteUrl}/${doc.category.slug}/${doc.project.slug}/${doc.slug}`;
      parentSlug = doc.project.slug;
      parentTitle = doc.project.title;
      break;
  }

  const { Resend } = await import('resend');
  const { NewContentNotificationEmail } = await import(
    '@/lib/email/templates/new-content-notification'
  );
  const resend = new Resend(config.apiKey);
  const allContacts = await listSegmentContacts(resend, config.segmentId);

  if (allContacts.length === 0) {
    console.log('[notification] No contacts found');
    return;
  }

  const globalRecipients: ContactSummary[] = [];
  const targetedRecipients: ContactSummary[] = [];
  const contentKey =
    type === 'category'
      ? `category:${doc.slug}`
      : type === 'project'
        ? `project:${doc.slug}`
        : `collection:${parentSlug}/${doc.slug}`;

  for (const contact of allContacts) {
    try {
      const subs = await getContactSubscriptions(resend, contact);

      if (subs === undefined || subs === '') {
        globalRecipients.push(contact);
      } else {
        const prefSet = new Set(subs.split(','));
        if (!prefSet.has(contentKey)) {
          targetedRecipients.push(contact);
        }
      }
    } catch (err) {
      console.warn('[notification] contacts.get threw for', contact.email, ':', err);
      globalRecipients.push(contact);
    }
  }

  if (globalRecipients.length === 0 && targetedRecipients.length === 0) {
    console.log('[notification] No relevant subscribers for new', type, docId);
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const allRecipients: (ContactSummary & { isGlobal: boolean })[] = [
    ...globalRecipients.map((c) => ({ ...c, isGlobal: true })),
    ...targetedRecipients.map((c) => ({ ...c, isGlobal: false })),
  ];

  let sentCount = 0;

  for (let i = 0; i < allRecipients.length; i++) {
    const c = allRecipients[i];
    try {
      const unsubscribeUrl = `${config.siteUrl}/api/unsubscribe?c=${c.id}&t=${generateUnsubscribeToken(c.id)}`;

      const result = await resend.emails.send({
        from: 'ICEAXING <notify@iceaxing.com>',
        to: c.email,
        subject: `iceaxing - New Content: ${doc.title}`,
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

    if (i < allRecipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  if (sentCount > 0 && process.env.SANITY_API_WRITE_TOKEN) {
    try {
      await writeClient.patch(docId).set({ notified: true }).commit();
    } catch (err) {
      console.error('[notification] Failed to patch notified for', docId, ':', err);
    }
  } else if (sentCount > 0) {
    console.warn('[notification] SANITY_API_WRITE_TOKEN not set - notified field not patched for', docId);
  }
}

function getNotificationConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[notification] RESEND_API_KEY not set, skipping');
    return null;
  }

  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!segmentId) {
    console.warn('[notification] RESEND_SEGMENT_ID not set, skipping');
    return null;
  }

  return {
    apiKey,
    segmentId,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://iceaxing.com',
  };
}

async function listSegmentContacts(
  resend: {
    contacts: {
      list: (options: {
        segmentId: string;
        limit: number;
        after?: string;
      }) => Promise<{
        data?: {
          data?: Array<{ id: string; email: string }>;
          has_more?: boolean;
        } | null;
        error?: unknown;
      }>;
    };
  },
  segmentId: string
): Promise<ContactSummary[]> {
  const allContacts: ContactSummary[] = [];
  let after: string | undefined;
  let hasMore = true;

  while (hasMore && allContacts.length < 500) {
    const listResponse = await resend.contacts.list(
      after ? { segmentId, after, limit: 100 } : { segmentId, limit: 100 }
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

  return allContacts;
}

async function getContactSubscriptions(
  resend: {
    contacts: {
      get: (id: string) => Promise<{
        data?: { properties?: ContactProperties } | null;
        error?: unknown;
      }>;
    };
  },
  contact: ContactSummary
): Promise<string | undefined> {
  const getResult = await resend.contacts.get(contact.id);
  if (getResult.error) {
    console.warn('[notification] contacts.get error for', contact.email, ':', getResult.error);
    return undefined;
  }

  const subsProp = getResult.data?.properties?.subscriptions;
  return subsProp?.type === 'string' && typeof subsProp.value === 'string'
    ? subsProp.value
    : undefined;
}
