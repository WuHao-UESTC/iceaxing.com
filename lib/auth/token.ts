import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string {
  return process.env.SANITY_WEBHOOK_SECRET
    || process.env.RESEND_API_KEY
    || 'iceaxing-fallback-secret';
}

function hmac(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function generateUnsubscribeToken(contactId: string): string {
  const payload = `${contactId}:${Date.now()}`;
  const sig = hmac(payload);
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyUnsubscribeToken(contactId: string, token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const payload = Buffer.from(parts[0], 'base64url').toString('utf-8');
    const [id] = payload.split(':');

    if (id !== contactId) return false;

    const expectedSig = hmac(payload);
    return timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}
