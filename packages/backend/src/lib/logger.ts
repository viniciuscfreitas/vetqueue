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

const removeNulls = (obj: any): any => {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== "object" || Array.isArray(obj)) return obj;
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = typeof value === "object" && !Array.isArray(value) ? removeNulls(value) : value;
    }
  }
  return cleaned;
};

const formatLog = (level: LogLevel, message: string, meta?: any): string => {
  const requestId = getRequestId();
  const logEntry: any = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service_name: "vetqueue-backend",
    environment: process.env.NODE_ENV || "development",
  };
  
  if (requestId) {
    logEntry.requestId = requestId;
  }
  
  if (meta) {
    const cleanedMeta = removeNulls(meta);
    Object.assign(logEntry, cleanedMeta);
  }
  
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

