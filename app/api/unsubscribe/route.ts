import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/auth/token';
import { htmlLocale, normalizeLocale, type AppLocale } from '@/lib/i18n/locales';

export async function GET(request: NextRequest) {
  return handleUnsubscribe(request);
}

export async function POST(request: NextRequest) {
  return handleUnsubscribe(request);
}

async function handleUnsubscribe(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get('locale') || undefined);
  const contactId = searchParams.get('c');
  const token = searchParams.get('t');

  if (!contactId || !token) {
    return htmlResponse(locale, false, 'Missing parameters', 400);
  }

  if (!verifyUnsubscribeToken(contactId, token)) {
    return htmlResponse(locale, false, 'Invalid or expired link', 400);
  }

  if (!process.env.RESEND_API_KEY) {
    return htmlResponse(locale, false, 'Service is not configured', 500);
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.contacts.remove(contactId);

    if (result.error) {
      console.error('[unsubscribe] contacts.remove error:', result.error);
      return htmlResponse(locale, false, undefined, 500);
    }

    return htmlResponse(locale, true, undefined, 200);
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return htmlResponse(locale, false, undefined, 500);
  }
}

function htmlResponse(locale: AppLocale, success: boolean, message: string | undefined, status: number) {
  return new NextResponse(htmlPage(locale, success, message), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function htmlPage(locale: AppLocale, success: boolean, message?: string): string {
  const t = {
    zh: {
      title: success ? '退订成功' : '退订失败',
      heading: success ? '你已成功退订' : '退订失败',
      body: success
        ? '你已从 iceaxing 的订阅列表中移除，不会再收到通知邮件。'
        : message ?? '退订请求处理失败，请稍后重试。',
      back: '返回首页',
    },
    en: {
      title: success ? 'Unsubscribed' : 'Unsubscribe Failed',
      heading: success ? 'Successfully Unsubscribed' : 'Unsubscribe Failed',
      body: success
        ? "You've been removed from iceaxing's mailing list."
        : message ?? 'Failed to process your unsubscribe request.',
      back: 'Back to Home',
    },
    de: {
      title: success ? 'Abgemeldet' : 'Abmeldung fehlgeschlagen',
      heading: success ? 'Erfolgreich abgemeldet' : 'Abmeldung fehlgeschlagen',
      body: success
        ? 'Du wurdest aus der Mailingliste von iceaxing entfernt.'
        : message ?? 'Deine Abmeldung konnte nicht verarbeitet werden.',
      back: 'Zur Startseite',
    },
  }[locale];

  const pageTitle = escapeHtml(`${t.title} - iceaxing`);

  return `<!DOCTYPE html>
<html lang="${htmlLocale(locale)}">
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
