type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitState = {
  buckets: Map<string, Bucket>;
};

const globalState = globalThis as typeof globalThis & {
  __aybRateLimit?: RateLimitState;
};

const state: RateLimitState = (globalState.__aybRateLimit ??= { buckets: new Map() });

/**
 * A small in-process guard for auth endpoints. Production deployments behind
 * multiple instances should also add a shared rate limiter at the proxy layer.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = state.buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    state.buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "local";
}
