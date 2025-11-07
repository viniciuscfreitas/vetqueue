type LogLevel = "error" | "warn" | "info";

type ClientLogPayload = {
  level: LogLevel;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
};

type LogEvent = {
  level: LogLevel;
  message: string;
  stack?: string;
  errorName?: string;
  url: string;
  userAgent?: string;
  sessionId: string;
  timestamp: string;
  extra?: Record<string, unknown>;
};

const LOG_ENDPOINT = process.env.NEXT_PUBLIC_CLIENT_LOG_ENDPOINT || "/api/client-logs";
const LOG_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CLIENT_LOGGING === "true";
const THROTTLE_WINDOW_MS = Number(process.env.NEXT_PUBLIC_CLIENT_LOG_THROTTLE_MS || "60000");

const isBrowser = typeof window !== "undefined";

let initialized = false;
let restoreConsoleError: (() => void) | undefined;
let cleanupHandlers: Array<() => void> = [];

const getSessionId = () => {
  if (!isBrowser) return "unknown";
  const storageKey = "vetqueue:client-log-session";
  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
};

const seenMessages = new Map<string, number>();

const shouldSkip = (key: string) => {
  if (THROTTLE_WINDOW_MS <= 0) return false;
  const now = Date.now();
  const lastSeen = seenMessages.get(key);
  if (lastSeen && now - lastSeen < THROTTLE_WINDOW_MS) {
    return true;
  }
  seenMessages.set(key, now);
  return false;
};

const serializeArgs = (args: unknown[]): Record<string, unknown> => {
  return {
    arguments: args.map((item) => {
      if (typeof item === "string") return item;
      if (item instanceof Error) {
        return {
          name: item.name,
          message: item.message,
          stack: item.stack,
        };
      }
      try {
        return JSON.parse(JSON.stringify(item));
      } catch {
        return String(item);
      }
    }),
  };
};

const emitLog = (payload: ClientLogPayload) => {
  if (!LOG_ENABLED || !isBrowser) return;

  const basePayload: LogEvent = {
    level: payload.level,
    message: payload.message,
    stack: payload.stack,
    errorName: payload.context?.errorName as string | undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    extra: payload.context,
  };

  const key = `${basePayload.level}:${basePayload.message}:${basePayload.stack}`;
  if (shouldSkip(key)) {
    return;
  }

  const body = JSON.stringify(basePayload);
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon?.(LOG_ENDPOINT, blob)) {
    return;
  }

  void fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
};

const handleWindowError = (event: ErrorEvent) => {
  emitLog({
    level: "error",
    message: event.message || "Uncaught error",
    stack: event.error?.stack || event.filename,
    context: {
      column: event.colno,
      line: event.lineno,
      errorName: event.error?.name,
      source: "window.error",
    },
  });
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const reason = event.reason;
  const message = reason?.message || (typeof reason === "string" ? reason : "Unhandled rejection");
  const stack = reason?.stack;
  emitLog({
    level: "error",
    message,
    stack,
    context: {
      source: "unhandledrejection",
      errorName: reason?.name,
    },
  });
};

const patchConsoleError = () => {
  if (!isBrowser) return;
  const original = window.console.error.bind(window.console);
  window.console.error = (...args: unknown[]) => {
    original(...args);
    try {
      const message = args
        .map((item) => {
          if (typeof item === "string") return item;
          if (item instanceof Error) return `${item.name}: ${item.message}`;
          return JSON.stringify(item);
        })
        .join(" ");
      emitLog({
        level: "error",
        message: message || "console.error",
        context: {
          source: "console.error",
          ...serializeArgs(args),
        },
      });
    } catch {
      // ignore serialization errors
    }
  };
  restoreConsoleError = () => {
    window.console.error = original;
  };
};

export const initClientLogger = () => {
  if (!LOG_ENABLED || !isBrowser || initialized) {
    return () => undefined;
  }

  initialized = true;

  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);
  cleanupHandlers = [
    () => window.removeEventListener("error", handleWindowError),
    () => window.removeEventListener("unhandledrejection", handleUnhandledRejection),
  ];

  patchConsoleError();

  return () => {
    cleanupHandlers.forEach((fn) => fn());
    cleanupHandlers = [];
    restoreConsoleError?.();
    restoreConsoleError = undefined;
    initialized = false;
  };
};


