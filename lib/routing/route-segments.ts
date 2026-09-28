/**
 * Next.js route params can still be percent-encoded after locale rewrites.
 * Decode them before comparing them with Sanity slug values.
 */
export function decodeRouteSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function decodeRouteSegments(segments: string[]): string[] {
  return segments.map(decodeRouteSegment);
}
