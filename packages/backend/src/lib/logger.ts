import fs from "fs";
import path from "path";
import { alertDispatcher } from "./alertDispatcher";
import { getRequestId, getUserLogLevel } from "./requestContext";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFn = (message: string, meta?: Record<string, unknown>) => void;

type DerivedLogger = {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_OUTPUT = (process.env.LOG_OUTPUT || "stdout").toLowerCase();
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || path.join(process.cwd(), "logs", "backend.log");

let fileStream: fs.WriteStream | undefined;

if (LOG_OUTPUT === "file") {
  const directory = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fileStream = fs.createWriteStream(LOG_FILE_PATH, { flags: "a" });
}

const consoleWriters: Record<LogLevel, (payload: string) => void> = {
  debug: (payload) => console.log(payload),
  info: (payload) => console.log(payload),
  warn: (payload) => console.warn(payload),
  error: (payload) => console.error(payload),
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

const formatLog = (level: LogLevel, message: string, meta?: Record<string, unknown>): string => {
  const requestId = getRequestId();
  const logEntry: Record<string, unknown> = {
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

const logInternal = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
  context?: Record<string, unknown>
) => {
  if (!shouldLog(level)) {
    return;
  }

  const combinedMeta = context ? { ...context, ...(meta || {}) } : meta;
  const payload = formatLog(level, message, combinedMeta);

  consoleWriters[level](payload);
  if (fileStream) {
    fileStream.write(`${payload}\n`);
  }

  alertDispatcher.notify(level, message, combinedMeta);
};

const createContextLogger = (context: Record<string, unknown>): DerivedLogger => {
  const staticContext = removeNulls(context) ?? {};

  return {
    debug: (message: string, meta?: Record<string, unknown>) =>
      logInternal("debug", message, meta, staticContext),
    info: (message: string, meta?: Record<string, unknown>) =>
      logInternal("info", message, meta, staticContext),
    warn: (message: string, meta?: Record<string, unknown>) =>
      logInternal("warn", message, meta, staticContext),
    error: (message: string, meta?: Record<string, unknown>) =>
      logInternal("error", message, meta, staticContext),
  };
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => logInternal("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => logInternal("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logInternal("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logInternal("error", message, meta),
  withContext: createContextLogger,
};

