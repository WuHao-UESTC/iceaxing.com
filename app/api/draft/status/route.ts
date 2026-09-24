import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const { isEnabled } = await draftMode();

  return NextResponse.json(
    { isEnabled },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
