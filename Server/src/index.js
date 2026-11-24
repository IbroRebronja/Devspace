
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import tasksRouter from "./routes/tasks.js";
import githubRouter from "./routes/github.js";
import githubRepositoriesRouter from "./routes/githubRepositories.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Render places one trusted proxy in front of the web service.
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;
const CLIENT_URL =
  process.env.CLIENT_URL || (isProduction ? null : "http://localhost:5173");

function normalizeOrigin(value) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const allowedOrigins = new Set(
  [
    normalizeOrigin(CLIENT_URL),
    ...(isProduction ? [] : ["http://localhost:5173"]),
  ].filter(Boolean)
);

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      return callback(null, allowedOrigins.has(normalizeOrigin(origin)));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// CSRF protection: require an approved browser origin for state changes.
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

app.use((req, res, next) => {
  if (safeMethods.has(req.method)) {
    return next();
  }

  const requestOrigin = normalizeOrigin(req.get("Origin"));

  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    return res.status(403).json({
      message: "Request origin is not allowed.",
    });
  }

  return next();
});

// API routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/github", githubRepositoriesRouter);
app.use("/api/github", githubRouter);

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

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request body is too large.",
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
