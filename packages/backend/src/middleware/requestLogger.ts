import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;

  logger.info("Request started", {
    method: req.method,
    path: req.path,
    userId,
    ip: req.ip,
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]("Request completed", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId,
    });
  });

  next();
};

