import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limit';
import { ConfirmSubscriptionEmail } from '@/lib/email/templates/confirm-subscription';

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[subscribe] RESEND_API_KEY is not configured');
    return NextResponse.json(
      { success: false, message: '订阅服务暂未配置' },
      { status: 500 }
    );
  }

  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!segmentId) {
    console.error('[subscribe] RESEND_SEGMENT_ID is not configured');
    return NextResponse.json(
      { success: false, message: '订阅服务暂未配置' },
      { status: 500 }
    );
  }

  // Rate limit: 每 IP 每分钟最多 3 次
  const forwarded = request.headers.get('x-forwarded-for') || 'unknown';
  const ip = forwarded.split(',')[0].trim();
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json(
      { success: false, message: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const locale: 'zh' | 'en' = body.locale === 'en' ? 'en' : 'zh';

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create contact in the segment
    const createResult = await resend.contacts.create({
      email,
      segments: [{ id: segmentId }],
    });

    if (createResult.error) {
      const err = createResult.error as { statusCode?: number; message?: string };
      // Duplicate contact — treat as already subscribed
      if (err.statusCode === 422 && err.message?.includes('already')) {
        return NextResponse.json(
          { success: false, message: '该邮箱已订阅' },
          { status: 409 }
        );
      }
      console.error('[subscribe] contacts.create error:', err);
      return NextResponse.json(
        { success: false, message: '订阅失败，请稍后重试' },
        { status: 500 }
      );
    }

    // Send confirmation email (non-fatal: contact already created)
    const sendResult = await resend.emails.send({
      from: 'notify@iceaxing.com',
      to: email,
      subject: locale === 'en'
        ? 'iceaxing — Subscription Confirmed'
        : 'iceaxing — 订阅确认',
      react: ConfirmSubscriptionEmail({ email, locale }),
    });
    if (sendResult.error) {
      console.error('[subscribe] Failed to send confirmation email:', sendResult.error);
    }

    return NextResponse.json({
      success: true,
      message: locale === 'en'
        ? 'Please check your email to confirm your subscription'
        : '请查收确认邮件以完成订阅',
    });
  } catch (error: unknown) {
    console.error('[subscribe] Error:', error);
    return NextResponse.json(
      { success: false, message: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}
