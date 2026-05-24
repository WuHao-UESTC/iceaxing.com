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

        // Send new-post notification if this is a first publish
        if (body._id && body._createdAt && body._createdAt === body._updatedAt) {
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

  // Resolve the blog post's category, project, collection, and slug via GROQ
  const post = await client.fetch(
    groq`*[_id == $id][0]{
      title,
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

  const { Resend } = await import('resend');
  const { NewPostNotificationEmail } = await import(
    '@/lib/email/templates/new-post-notification'
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Fetch all confirmed subscribers (Resend v6: Response<{ data: Contact[] }>)
  const listResponse = await resend.contacts.list();
  const contacts = listResponse.data?.data;
  if (!contacts || contacts.length === 0) return;

  // Send emails in parallel with allSettled so one failure doesn't block others
  const results = await Promise.allSettled(
    contacts.map((c) =>
      resend.emails.send({
        from: 'notify@iceaxing.com',
        to: c.email,
        subject: `iceaxing 新文章: ${post.title}`,
        react: NewPostNotificationEmail({
          postTitle: post.title,
          postUrl,
          category: post.category.title,
          project: post.project.title,
        }),
      })
    )
  );

  // Count both rejections AND Resend v6 resolved-with-error responses
  const failed = results.filter((r) => {
    if (r.status === 'rejected') return true;
    if (r.status === 'fulfilled' && (r.value as { error?: unknown })?.error) return true;
    return false;
  }).length;
  if (failed > 0) {
    console.warn(`[revalidate] ${failed}/${results.length} notification emails failed`);
  }
}
