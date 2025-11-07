import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logger } from "../../lib/logger";
import { sanitizeForLogging } from "../../lib/sanitize";

const router = Router();
const log = logger.withContext({ module: "Frontend" });

const getRateLimitWindow = () => Number(process.env.CLIENT_LOG_RATE_LIMIT_WINDOW_MS || "60000");
const getRateLimitMax = () => Number(process.env.CLIENT_LOG_RATE_LIMIT_MAX || "30");

type RateEntry = {
  windowStart: number;
  count: number;
};

const rateTracker = new Map<string, RateEntry>();

const isRateLimited = (key: string): boolean => {
  const windowMs = getRateLimitWindow();
  const max = getRateLimitMax();

  if (windowMs <= 0 || max <= 0) {
    return false;
  }

  const now = Date.now();
  const entry = rateTracker.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    rateTracker.set(key, { windowStart: now, count: 1 });
    return false;
  }

  if (entry.count >= max) {
    return true;
  }

  entry.count += 1;
  return false;
};

const clientLogSchema = z.object({
  level: z.enum(["error", "warn", "info"]).default("error"),
  message: z.string().min(1).max(500),
  stack: z.string().max(5000).optional(),
  errorName: z.string().max(200).optional(),
  url: z.string().max(2048).optional(),
  userAgent: z.string().max(512).optional(),
  sessionId: z.string().max(200).optional(),
  timestamp: z.string().max(100).optional(),
  extra: z.record(z.unknown()).optional(),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = clientLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const data = parsed.data;
    const rateKey = `${req.ip}:${data.sessionId || "unknown"}`;

    if (isRateLimited(rateKey)) {
      return res.status(429).json({ error: "Too many client logs" });
    }

    const requestId = req.requestId || "unknown";

    const meta = sanitizeForLogging({
      requestId,
      url: data.url || req.headers.referer || null,
      userAgent: data.userAgent || req.headers["user-agent"] || null,
      sessionId: data.sessionId || null,
      timestamp: data.timestamp || new Date().toISOString(),
      extra: data.extra,
      ip: req.ip,
    });

    const message = data.message.trim();

    switch (data.level) {
      case "info":
        log.info("Client log received", { ...meta, message, stack: data.stack, errorName: data.errorName || null });
        break;
      case "warn":
        log.warn("Client warning received", { ...meta, message, stack: data.stack, errorName: data.errorName || null });
        break;
      default:
        log.error("Client error received", { ...meta, message, stack: data.stack, errorName: data.errorName || null });
        break;
    }

    res.status(202).json({ acknowledged: true });
  })
);

export default router;

export const __clearClientLogRateLimit = () => {
  rateTracker.clear();
};


