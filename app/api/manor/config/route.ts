import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    buildings: [],
    npcs: [],
    farmField: null,
  });
}
