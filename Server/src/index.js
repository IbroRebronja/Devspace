
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import tasksRouter from "./routes/tasks.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// API routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "The requested API endpoint does not exist.",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON request body.",
    });
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`DevSpace API running at http://localhost:${PORT}`);
});

// Handle unexpected errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  server.close(() => {
    process.exit(1);
  });
});
