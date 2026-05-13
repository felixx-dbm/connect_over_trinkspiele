// Per-instance sliding-window rate limiter.
// On Vercel Edge each worker handles many requests, so this provides meaningful burst
// protection even though it isn't distributed across all workers.
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Purge stale entries every ~500 requests to keep memory bounded
let purgeCounter = 0;
function maybePurge() {
  if (++purgeCounter < 500) return;
  purgeCounter = 0;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Returns true if the request is allowed, false if it should be rejected.
 * @param ip      — client IP
 * @param bucket  — logical group (e.g. "api", "auth", "map")
 * @param limit   — max requests allowed per window
 * @param windowMs — window size in milliseconds
 */
export function checkRateLimit(ip: string, bucket: string, limit: number, windowMs: number): boolean {
  maybePurge();
  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
