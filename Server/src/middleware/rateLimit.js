import crypto from "node:crypto";
import { isIP } from "node:net";

const attempts = new Map();
let requestsSinceCleanup = 0;

function getClientIp(req) {
  if (process.env.NODE_ENV === "production") {
    // Render routes public web-service traffic through Cloudflare.
    // Cloudflare supplies this header at its edge.
    const cloudflareIp = req.get("cf-connecting-ip")?.trim();

    if (cloudflareIp && isIP(cloudflareIp)) {
      return cloudflareIp;
    }
  }

  return req.socket.remoteAddress || "unknown";
}

function incrementBucket(key, windowMs, now) {
  let bucket = attempts.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  attempts.set(key, bucket);
  return bucket;
}

function cleanExpiredBuckets(now) {
  for (const [key, bucket] of attempts) {
    if (bucket.resetAt <= now) attempts.delete(key);
  }

  while (attempts.size > 25000) {
    const oldestKey = attempts.keys().next().value;
    attempts.delete(oldestKey);
  }
}

export function createAuthRateLimiter({ limit, windowMs, message }) {
  return function authRateLimit(req, res, next) {
    const now = Date.now();
    requestsSinceCleanup += 1;

    if (requestsSinceCleanup >= 500) {
      cleanExpiredBuckets(now);
      requestsSinceCleanup = 0;
    }

    const keys = ["ip:" + getClientIp(req)];

    if (typeof req.body?.email === "string") {
      const email = req.body.email.trim().toLowerCase();

      if (email) {
        const emailHash = crypto.createHash("sha256").update(email).digest("hex");
        keys.push("email:" + emailHash);
      }
    }

    const buckets = keys.map((key) => incrementBucket(key, windowMs, now));
    const exceeded = buckets.find((bucket) => bucket.count > limit);

    if (exceeded) {
      const retryAfter = Math.max(1, Math.ceil((exceeded.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ message, retryAfter });
    }

    return next();
  };
}
