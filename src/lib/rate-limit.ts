type BucketState = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as unknown as {
  __rateLimitStore?: Map<string, BucketState>;
};

const store = globalStore.__rateLimitStore ?? new Map<string, BucketState>();

if (!globalStore.__rateLimitStore) {
  globalStore.__rateLimitStore = store;
}

export function consumeRateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const fullKey = `${bucket}:${key}`;
  const entry = store.get(fullKey);

  if (!entry || now >= entry.resetAt) {
    store.set(fullKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  store.set(fullKey, entry);
  return { allowed: true, retryAfter: 0 };
}
