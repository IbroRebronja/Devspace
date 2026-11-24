import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

export async function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session.",
    });
  }

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

  try {
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
  } catch (error) {
    return next(error);
  }
}
