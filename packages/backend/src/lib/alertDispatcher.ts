import { setTimeout as sleep } from "timers/promises";

type LogLevel = "debug" | "info" | "warn" | "error";

const DEFAULT_THROTTLE_SECONDS = Number(process.env.ERROR_ALERT_THROTTLE_SECONDS ?? "300");
const throttledMessages = new Map<string, number>();

const shouldSendAlert = (cacheKey: string, throttleSeconds: number): boolean => {
  if (throttleSeconds <= 0) {
    return true;
  }

  const now = Date.now();
  const lastSent = throttledMessages.get(cacheKey);

  if (!lastSent || now - lastSent >= throttleSeconds * 1000) {
    throttledMessages.set(cacheKey, now);
    return true;
  }

  return false;
};

const buildCacheKey = (message: string, meta?: Record<string, unknown>): string => {
  const event = typeof meta?.eventType === "string" ? meta.eventType : "unknown-event";
  const requestId = typeof meta?.requestId === "string" ? meta.requestId : "";
  return `${event}:${message}:${requestId}`;
};

const truncate = (value: string, limit = 500): string => {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit - 3)}...`;
};

const formatAlertPayload = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const blocks: string[] = [];
  blocks.push(`:rotating_light: *${level.toUpperCase()}* - ${message}`);

  if (meta) {
    const safeMeta = truncate(JSON.stringify(meta, (_key, value) => {
      if (value instanceof Error) {
        return { message: value.message, stack: value.stack };
      }
      return value;
    }));
    blocks.push("```json");
    blocks.push(safeMeta);
    blocks.push("```");
  }

  return { text: blocks.join("\n") };
};

const postWebhook = async (webhookUrl: string, payload: unknown) => {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status >= 500) {
      // retry once for transient failures
      await sleep(1000);
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => undefined);
    }
  } catch {
    // swallow errors to avoid recursive logging
  }
};

export const alertDispatcher = {
  notify: (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const webhookUrl = process.env.ERROR_ALERT_WEBHOOK_URL;

    if (!webhookUrl) {
      return;
    }

    if (level !== "error") {
      return;
    }

    const throttleSeconds = Number.isFinite(DEFAULT_THROTTLE_SECONDS)
      ? DEFAULT_THROTTLE_SECONDS
      : 300;

    const cacheKey = buildCacheKey(message, meta);

    if (!shouldSendAlert(cacheKey, throttleSeconds)) {
      return;
    }

    const payload = formatAlertPayload(level, message, meta);
    void postWebhook(webhookUrl, payload);
  },
};


