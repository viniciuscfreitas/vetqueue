import * as Sentry from "@sentry/node";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import queueRoutes from "./api/routes/queueRoutes";
import authRoutes from "./api/routes/authRoutes";
import roomRoutes from "./api/routes/roomRoutes";
import userRoutes from "./api/routes/userRoutes";
import serviceRoutes from "./api/routes/serviceRoutes";
import patientRoutes from "./api/routes/patientRoutes";
import consultationRoutes from "./api/routes/consultationRoutes";
import vaccinationRoutes from "./api/routes/vaccinationRoutes";
import { checkAndCleanupInactiveRooms } from "./jobs/inactivityCheck";
import { prisma } from "./lib/prisma";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { logger } from "./lib/logger";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined }),
    ],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

const allowedOrigins = [
  "https://fisiopet.petshopcisnebranco.com.br",
  "https://vetqueue.vinicius.xyz",
  "http://161.35.115.145:3000",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(express.json());

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

if (process.env.SENTRY_DSN) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId;
    if (requestId) {
      Sentry.setTag("request_id", requestId);
    }
    const userId = (req as any).user?.id;
    if (userId) {
      Sentry.setUser({ id: userId });
    }
    next();
  });
}

app.get("/health", async (req, res) => {
  const requestId = req.requestId || "unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    logger.debug("Health check passed", { requestId });
    res.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    logger.error("Health check failed", { 
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ 
      status: "error",
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/vaccinations", vaccinationRoutes);

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.requestId || "unknown";
  const userId = (req as any).user?.id;

  logger.error("Request error", {
    requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body,
    userId,
    errorName: err.name,
  });

  if (process.env.SENTRY_DSN && err.statusCode !== 400) {
    Sentry.captureException(err);
  }
  
  if (err.name === 'ZodError') {
    res.status(400).json({ error: err.errors });
    return;
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message 
  });
});

app.listen(Number(PORT), HOST, () => {
  logger.info("Server started", {
    host: HOST,
    port: PORT,
    logLevel: process.env.LOG_LEVEL || "info",
  });
});

setInterval(checkAndCleanupInactiveRooms, 5 * 60 * 1000);

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  }
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  
  process.exit(1);
});

