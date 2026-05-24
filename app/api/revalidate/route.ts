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
        let notificationResult: object | undefined;
        if (body._id) {
          try {
            notificationResult = await sendNewPostNotification(body._id);
          } catch (err) {
            console.error('[revalidate] Notification error:', err);
            notificationResult = { error: String(err) };
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

    return NextResponse.json({ revalidated: true, now: Date.now(), ...(notificationResult ? { notification: notificationResult } : {}) });
  } catch (error) {
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      { message: 'Error revalidating' },
      { status: 500 }
    );
  }
}

type DebugInfo = {
  stage: string;
  contactsFound?: number;
  recipients?: string[];
  matched?: string[];
  skipped?: string[];
  errors?: string[];
  emailIds?: string[];
};

async function sendNewPostNotification(blogId: string): Promise<DebugInfo> {
  const debug: DebugInfo = { stage: 'start', errors: [], matched: [], skipped: [], emailIds: [], recipients: [] };

  if (!process.env.RESEND_API_KEY) {
    return { stage: 'no_api_key' };
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
    return { stage: 'post_not_found_or_missing_refs' };
  }

  debug.stage = 'post_fetched';

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
      debug.errors!.push(`contacts.list: ${JSON.stringify(listResponse.error)}`);
      break;
    }
    const data = listResponse.data?.data;
    if (data && data.length > 0) {
      allContacts.push(...data.map((c) => ({ id: c.id, email: c.email })));
    }
    hasMore = listResponse.data?.has_more ?? false;
    after = data?.[data.length - 1]?.id;
  }

  debug.contactsFound = allContacts.length;
  debug.stage = 'contacts_fetched';

  if (allContacts.length === 0) return debug;

  // Filter contacts by subscription preferences
  const matchedContacts: { id: string; email: string }[] = [];
  for (const contact of allContacts) {
    try {
      const getResult = await resend.contacts.get(contact.id);
      if (getResult.error) {
        debug.errors!.push(`contacts.get(${contact.email}): ${JSON.stringify(getResult.error)}`);
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
        matchedContacts.push(contact);
        debug.matched!.push(`${contact.email} (legacy)`);
      } else {
        const prefSet = new Set(subs.split(','));
        if (
          prefSet.has(`category:${postCatSlug}`) ||
          prefSet.has(`project:${postProjSlug}`) ||
          (postColSlug && prefSet.has(`collection:${postProjSlug}/${postColSlug}`))
        ) {
          matchedContacts.push(contact);
          debug.matched!.push(`${contact.email} (pref:${subs})`);
        } else {
          debug.skipped!.push(`${contact.email} subs=${subs} vs cat=${postCatSlug} proj=${postProjSlug} col=${postColSlug}`);
        }
      }
    } catch (err) {
      debug.errors!.push(`contacts.get throw ${contact.email}: ${String(err)}`);
      matchedContacts.push(contact);
    }
  }

  debug.stage = matchedContacts.length > 0 ? 'sending' : 'no_matches';

  if (matchedContacts.length === 0) return debug;
  debug.recipients = matchedContacts.map((c) => c.email);

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

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const v = r.value as Record<string, unknown>;
      const data = v?.data as Record<string, unknown> | undefined;
      if (data?.id) {
        debug.emailIds!.push(data.id as string);
      }
      if (v?.error) {
        debug.errors!.push(`email send error: ${JSON.stringify(v.error)}`);
      }
    } else {
      debug.errors!.push(`email send rejected: ${String(r.reason)}`);
    }
  }

  debug.stage = 'done';
  return debug;
}
