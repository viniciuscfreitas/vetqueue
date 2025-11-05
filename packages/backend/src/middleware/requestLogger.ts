import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const path = req.path;
  const endpoint = `${req.method} ${path}`;
  const isHealthCheck = path === "/health" || path === "/api/health" || path === "/metrics";

  if (!isHealthCheck) {
    const meta: any = {
      module: "HTTP",
      endpoint,
    };

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (userId) meta.userId = userId;
    if (userRole) meta.userRole = userRole;

    logger.debug("Request started", meta);
  }

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : isHealthCheck ? "debug" : "info";

    const meta: any = {
      module: "HTTP",
      endpoint,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (userId) meta.userId = userId;
    if (userRole) meta.userRole = userRole;

    logger[logLevel]("Request completed", meta);
  });

  next();
};

