
import express from "express";
import prisma from "../prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
      message: "DevSpace API is running.",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

export default router;
