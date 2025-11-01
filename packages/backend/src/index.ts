import express from "express";
import cors from "cors";
import queueRoutes from "./api/routes/queueRoutes";
import authRoutes from "./api/routes/authRoutes";
import roomRoutes from "./api/routes/roomRoutes";
import userRoutes from "./api/routes/userRoutes";
import serviceRoutes from "./api/routes/serviceRoutes";

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

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/services", serviceRoutes);

app.listen(Number(PORT), HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

