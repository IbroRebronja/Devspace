
import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.sub;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired session.",
    });
  }
}
