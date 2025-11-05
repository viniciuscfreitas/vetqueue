import { getRequestId, getUserLogLevel } from "./requestContext";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getLogLevel = (): LogLevel => {
  const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
  return LOG_LEVELS[envLevel] !== undefined ? envLevel : "info";
};

const shouldLog = (level: LogLevel): boolean => {
  const globalLevel = getLogLevel();
  const userLogLevel = getUserLogLevel();
  const effectiveLevel = userLogLevel || globalLevel;
  return LOG_LEVELS[level] >= LOG_LEVELS[effectiveLevel];
};

const formatLog = (level: LogLevel, message: string, meta?: any): string => {
  const requestId = getRequestId();
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(requestId && { requestId }),
    ...meta,
  };
  return JSON.stringify(logEntry);
};

export const logger = {
  debug: (message: string, meta?: any) => {
    if (shouldLog("debug")) {
      console.log(formatLog("debug", message, meta));
    }
  },

  info: (message: string, meta?: any) => {
    if (shouldLog("info")) {
      console.log(formatLog("info", message, meta));
    }
  },

  warn: (message: string, meta?: any) => {
    if (shouldLog("warn")) {
      console.warn(formatLog("warn", message, meta));
    }
  },

  error: (message: string, meta?: any) => {
    if (shouldLog("error")) {
      console.error(formatLog("error", message, meta));
    }
  },
};

