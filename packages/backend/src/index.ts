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
app.use(express.json());

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

const healthCheck = async (req: Request, res: Response) => {
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
};

app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

app.get("/metrics", (req, res) => {
  res.status(200).send("");
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/vaccinations", vaccinationRoutes);

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
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
  
  process.exit(1);
});

