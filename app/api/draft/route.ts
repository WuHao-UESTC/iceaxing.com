import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { originClient } from '@/lib/sanity/client';

const clientWithToken = originClient;

export async function GET(request: Request) {
  const { isValid, redirectTo = '/' } = await validatePreviewUrl(
    clientWithToken,
    request.url,
  );

  if (!isValid) {
    return new Response('Invalid secret', { status: 401 });
  }

  const dm = await draftMode();
  dm.enable();

  redirect(redirectTo);
}

export async function DELETE() {
  const dm = await draftMode();
  dm.disable();
  return new Response('Draft mode disabled', { status: 200 });
}
