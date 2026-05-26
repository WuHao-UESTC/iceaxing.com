import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/auth/token';

export async function GET(request: NextRequest) {
  return handleUnsubscribe(request);
}

export async function POST(request: NextRequest) {
  return handleUnsubscribe(request);
}

async function handleUnsubscribe(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('c');
  const token = searchParams.get('t');

  if (!contactId || !token) {
    return new NextResponse(htmlPage('zh', false, '缺少参数'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!verifyUnsubscribeToken(contactId, token)) {
    return new NextResponse(htmlPage('zh', false, '链接无效或已过期'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!process.env.RESEND_API_KEY) {
    return new NextResponse(htmlPage('zh', false, '服务暂未配置'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.contacts.remove(contactId);

    if (result.error) {
      console.error('[unsubscribe] contacts.remove error:', result.error);
      return new NextResponse(htmlPage('zh', false, '退订失败，请稍后重试'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new NextResponse(htmlPage('zh', true), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return new NextResponse(htmlPage('zh', false, '退订失败，请稍后重试'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function htmlPage(locale: 'zh' | 'en', success: boolean, message?: string): string {
  const t = locale === 'zh'
    ? {
        title: success ? '退订成功' : '退订失败',
        heading: success ? '你已成功退订' : '退订失败',
        body: success
          ? '你已从 iceaxing 的订阅列表中移除，不会再收到任何通知邮件。'
          : message ?? '退订请求处理失败，请稍后重试。',
        back: '返回首页',
      }
    : {
        title: success ? 'Unsubscribed' : 'Unsubscribe Failed',
        heading: success ? 'Successfully Unsubscribed' : 'Unsubscribe Failed',
        body: success
          ? "You've been removed from iceaxing's mailing list."
          : message ?? 'Failed to process your unsubscribe request.',
        back: 'Back to Home',
      };

  const pageTitle = escapeHtml(`${t.title} - iceaxing`);

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
<link rel="stylesheet" href="/styles/unsubscribe.css">
</head>
<body>
<div class="card">
  <h1>${escapeHtml(t.heading)}</h1>
  <p>${escapeHtml(t.body)}</p>
  <a href="/">${escapeHtml(t.back)}</a>
</div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
