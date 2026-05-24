const rateMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 10_000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    // New window — prune dead entries if the map grows too large
    if (rateMap.size > MAX_ENTRIES) {
      for (const [k, v] of rateMap) {
        if (now > v.resetAt) rateMap.delete(k);
      }
    }
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
