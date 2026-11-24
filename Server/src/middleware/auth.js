import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

export async function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded.sub !== "string" ||
      !decoded.sub ||
      typeof decoded.sid !== "string" ||
      !decoded.sid
    ) {
      return res.status(401).json({
        message: "Invalid or expired session.",
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: decoded.sid },
      select: {
        userId: true,
        expiresAt: true,
      },
    });

    if (
      !session ||
      session.userId !== decoded.sub ||
      session.expiresAt <= new Date()
    ) {
      return res.status(401).json({
        message: "Invalid or expired session.",
      });
    }

    req.userId = decoded.sub;
    req.sessionId = decoded.sid;
    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session.",
    });
  }
}
