import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ] : [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

const SLOW_QUERY_THRESHOLD = 1000;

prisma.$on('query' as never, (e: any) => {
  const duration = e.duration || 0;
  if (duration > SLOW_QUERY_THRESHOLD) {
    logger.warn("Slow Prisma query", {
      query: e.query,
      params: e.params,
      duration: `${duration}ms`,
      target: e.target,
    });
  }
});

prisma.$on('error' as never, (e: any) => {
  logger.error("Prisma error", {
    message: e.message,
    target: e.target,
  });
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn("Prisma warning", {
    message: e.message,
    target: e.target,
  });
});

