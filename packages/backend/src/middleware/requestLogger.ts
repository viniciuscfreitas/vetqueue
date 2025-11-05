import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;

  logger.info("Request started", {
    module: "HTTP",
    method: req.method,
    path: req.path,
    endpoint: `${req.method} ${req.path}`,
    userId: userId || null,
    userRole: userRole || null,
    ip: req.ip,
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]("Request completed", {
      module: "HTTP",
      method: req.method,
      path: req.path,
      endpoint: `${req.method} ${req.path}`,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: userId || null,
      userRole: userRole || null,
    });
  });

  next();
};

