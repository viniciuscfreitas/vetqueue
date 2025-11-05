import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { requestContext, RequestContext } from "../lib/requestContext";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const VALID_LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers["x-request-id"] as string || randomUUID();
  const rawUserLogLevel = req.headers["x-log-level"] as string | undefined;
  const userId = (req as any).user?.id;
  
  let userLogLevel: "debug" | "info" | "warn" | "error" | undefined = undefined;
  if (rawUserLogLevel) {
    const normalizedLevel = rawUserLogLevel.toLowerCase();
    if (VALID_LOG_LEVELS.includes(normalizedLevel as any)) {
      userLogLevel = normalizedLevel as "debug" | "info" | "warn" | "error";
    }
  }
  
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  
  const context: RequestContext = {
    requestId,
    userLogLevel,
    userId,
  };
  
  requestContext.run(context, () => {
    if (rawUserLogLevel && !userLogLevel) {
      logger.warn("Invalid X-Log-Level header value", { 
        providedValue: rawUserLogLevel,
        validValues: VALID_LOG_LEVELS 
      });
    }
    next();
  });
};

