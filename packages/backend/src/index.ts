import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import queueRoutes from "./api/routes/queueRoutes";
import authRoutes from "./api/routes/authRoutes";
import roomRoutes from "./api/routes/roomRoutes";
import userRoutes from "./api/routes/userRoutes";
import serviceRoutes from "./api/routes/serviceRoutes";
import { checkAndUpgradePriorities } from "./jobs/priorityUpgradeCheck";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

const allowedOrigins = [
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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('[HEALTH] ✗ Healthcheck falhou:', error);
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

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}`, {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body,
    user: (req as any).user?.id,
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
  console.log(`Server running on http://${HOST}:${PORT}`);
});

setInterval(checkAndUpgradePriorities, 1 * 60 * 1000);

