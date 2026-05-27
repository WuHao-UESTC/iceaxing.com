import { NextResponse } from 'next/server';
import { getSubscriptionOptions } from '@/lib/sanity/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'zh';
    const options = await getSubscriptionOptions(locale);
    return NextResponse.json(
      { success: true, data: options },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('[subscription-options] Error:', error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500 }
    );
  }
}
