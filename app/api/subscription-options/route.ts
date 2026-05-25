import { NextResponse } from 'next/server';
import { getSubscriptionOptions } from '@/lib/sanity/queries';

export const dynamic = 'force-static';
export const revalidate = 60;

export async function GET() {
  try {
    const options = await getSubscriptionOptions();
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
