import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import { createAuthRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const loginRateLimit = createAuthRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts. Please try again later.",
});

const registrationRateLimit = createAuthRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
  message: "Too many registration attempts. Please try again later.",
});

// A precomputed hash keeps failed logins for unknown emails close in cost
// to failed logins for existing accounts.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "DevSpace-dummy-password-never-used-for-authentication",
  12
);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function createToken(userId, sessionId) {
  return jwt.sign(
    { sub: userId, sid: sessionId },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
    }
  );
}

async function createSession(userId) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  return {
    id: session.id,
    expiresAt,
  };
}

function setSessionCookie(res, token, expiresAt) {
  res.cookie("token", token, {
    ...cookieOptions,
    expires: expiresAt,
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

// REGISTER
router.post("/register", registrationRateLimit, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        message: "Please enter a valid name.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
      },
    });

    const session = await createSession(user.id);
    const token = createToken(user.id, session.id);

    setSessionCookie(res, token, session.expiresAt);

    return res.status(201).json({
      message: "Account created successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Could not create your account.",
    });
  }
});

// LOGIN
router.post("/login", loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(
      password,
      passwordHash
    );

    if (!user || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const session = await createSession(user.id);
    const token = createToken(user.id, session.id);

    setSessionCookie(res, token, session.expiresAt);

    return res.json({
      message: "Logged in successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Could not log in.",
    });
  }
});

// LOGOUT: revoke only the session represented by this browser's cookie.
router.post("/logout", async (req, res) => {
  const token = req.cookies?.token;

  if (token) {
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch {
      // An invalid or expired token cannot identify an active session.
    }

    if (
      typeof decoded?.sub === "string" &&
      typeof decoded?.sid === "string"
    ) {
      try {
        await prisma.session.deleteMany({
          where: {
            id: decoded.sid,
            userId: decoded.sub,
          },
        });
      } catch (error) {
        console.error("Session revocation error:", error);

        return res.status(503).json({
          message: "Could not securely end this session. Please try again.",
        });
      }
    }
  }

  res.clearCookie("token", cookieOptions);

  return res.json({
    message: "Logged out successfully.",
  });
});

// CURRENT USER
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      res.clearCookie("token", cookieOptions);

      return res.status(401).json({
        message: "User account not found.",
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error("User lookup error:", error);

    return res.status(500).json({
      message: "Could not retrieve user.",
    });
  }
});

export default router;
