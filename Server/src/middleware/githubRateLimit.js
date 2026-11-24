const buckets = new Map();
let requestsSinceCleanup = 0;

const WINDOW_MS = 60 * 1000;
const REQUEST_LIMIT = 30;
const MAX_BUCKETS = 10000;

function cleanExpiredBuckets(now) {
  for (const [userId, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(userId);
    }
  }

  while (buckets.size > MAX_BUCKETS) {
    const oldestUserId = buckets.keys().next().value;
    buckets.delete(oldestUserId);
  }
}

export function createUserRateLimiter({
  limit = REQUEST_LIMIT,
  windowMs = WINDOW_MS,
  message = "Too many GitHub requests. Please wait before trying again.",
} = {}) {
  return function userRateLimit(req, res, next) {
    if (typeof req.userId !== "string" || !req.userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const now = Date.now();
    requestsSinceCleanup += 1;

    if (requestsSinceCleanup >= 250) {
      cleanExpiredBuckets(now);
      requestsSinceCleanup = 0;
    }

    let bucket = buckets.get(req.userId);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    bucket.count += 1;
    buckets.set(req.userId, bucket);

    const remaining = Math.max(0, limit - bucket.count);
    const resetAtSeconds = Math.ceil(bucket.resetAt / 1000);

    res.set({
      "RateLimit-Limit": String(limit),
      "RateLimit-Remaining": String(remaining),
      "RateLimit-Reset": String(resetAtSeconds),
    });

    if (bucket.count > limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      );

      res.set("Retry-After", String(retryAfter));

      return res.status(429).json({
        message,
        retryAfter,
      });
    }

    return next();
  };
}

export const githubRateLimit = createUserRateLimiter();
