import express from "express";
import cors from "cors";
import queueRoutes from "./api/routes/queueRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/queue", queueRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

