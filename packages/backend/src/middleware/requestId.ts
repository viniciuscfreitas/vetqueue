import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { requestContext, RequestContext } from "../lib/requestContext";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers["x-request-id"] as string || randomUUID();
  const userLogLevel = req.headers["x-log-level"] as "debug" | "info" | "warn" | "error" | undefined;
  const userId = (req as any).user?.id;
  
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  
  const context: RequestContext = {
    requestId,
    userLogLevel,
    userId,
  };
  
  requestContext.run(context, () => {
    next();
  });
};

