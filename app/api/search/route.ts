import { NextRequest, NextResponse } from 'next/server';
import { searchBlogs } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const category = request.nextUrl.searchParams.get('category') || undefined;
  const locale = request.nextUrl.searchParams.get('locale') || 'zh';

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    const results = await searchBlogs(q.trim(), category, locale);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[search] Error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 503 }
    );
  }
}
