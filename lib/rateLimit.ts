import type { NextApiRequest } from "next";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const maxBuckets = 10_000;

function pruneExpired(now: number) {
  if (buckets.size < maxBuckets) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (firstForwarded?.split(",")[0] || req.socket.remoteAddress || "unknown").trim();
}

export function rateLimit(req: NextApiRequest, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  pruneExpired(now);

  const key = `${scope}:${clientIp(req)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  current.count += 1;

  if (current.count > limit) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  return { limited: false, retryAfter: 0 };
}
