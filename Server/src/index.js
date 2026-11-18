
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`DevSpace API running at http://localhost:${PORT}`);
});
