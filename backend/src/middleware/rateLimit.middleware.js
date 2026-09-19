import ApiError from "../utils/apiError.js";

const buckets = new Map();

export const createRateLimit = ({ windowMs = 15 * 60 * 1000, max = 20 } = {}) =>
  (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 10_000) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
    }
    const key = `${req.ip || req.socket?.remoteAddress || "unknown"}:${req.baseUrl}:${req.route?.path || req.path}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      res.setHeader("Retry-After", Math.max(Math.ceil((current.resetAt - now) / 1000), 1));
      return next(new ApiError(429, "Too many registration attempts. Please try again later."));
    }

    current.count += 1;
    return next();
  };

export const resetRateLimitBucketsForTests = () => buckets.clear();
