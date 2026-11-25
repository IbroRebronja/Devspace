import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import prisma from "../prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import { createAuthRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_DURATION_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_DURATION_MS = 30 * 60 * 1000;

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

const verificationRateLimit = createAuthRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
  message: "Too many verification requests. Please try again later.",
});

const githubLoginRateLimit = createAuthRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many GitHub login attempts. Please try again later.",
});

const recoveryRateLimit = createAuthRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
  message: "Too many recovery requests. Please try again later.",
});

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

const githubLoginCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth/github",
  maxAge: 10 * 60 * 1000,
};

function clearGitHubLoginCookies(res) {
  res.clearCookie("github_login_state", githubLoginCookieOptions);
  res.clearCookie("github_login_verifier", githubLoginCookieOptions);
}

function safeCompareOAuthState(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string") return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getGitHubLoginCallbackUrl() {
  const value = process.env.GITHUB_LOGIN_CALLBACK_URL;
  if (!value) throw new Error("GITHUB_LOGIN_CALLBACK_URL is not configured.");
  return value;
}

async function exchangeGitHubCode(code, verifier) {
  const clientId = process.env.GITHUB_LOGIN_CLIENT_ID;
  const clientSecret = process.env.GITHUB_LOGIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GitHub OAuth is not configured.");

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getGitHubLoginCallbackUrl(),
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error || !data.access_token) {
    throw new Error("GitHub authorization could not be completed.");
  }
  return data.access_token;
}

async function getVerifiedGitHubProfile(accessToken) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevSpace-Dashboard",
  };
  const [profileResponse, emailsResponse] = await Promise.all([
    fetch("https://api.github.com/user", { headers, signal: AbortSignal.timeout(10000) }),
    fetch("https://api.github.com/user/emails", { headers, signal: AbortSignal.timeout(10000) }),
  ]);
  if (!profileResponse.ok || !emailsResponse.ok) {
    throw new Error("Could not verify your GitHub account details.");
  }
  const [profile, emails] = await Promise.all([profileResponse.json(), emailsResponse.json()]);
  const primaryEmail = Array.isArray(emails)
    ? emails.find((item) => item.primary && item.verified && typeof item.email === "string")
    : null;
  if (!profile.id || !profile.login || !primaryEmail) {
    throw new Error("Your GitHub account needs a verified primary email address to sign in.");
  }
  return {
    githubUserId: String(profile.id),
    githubUsername: profile.login,
    avatarUrl: profile.avatar_url || null,
    email: primaryEmail.email.trim().toLowerCase(),
    name: (typeof profile.name === "string" && profile.name.trim()) || profile.login,
  };
}

async function signInWithGitHub(profile, res) {
  let user = await prisma.user.findUnique({
    where: { email: profile.email },
    include: { githubIdentity: true },
  });

  if (user?.githubIdentity && user.githubIdentity.githubUserId !== profile.githubUserId) {
    throw new Error("This email is already linked to a different GitHub account.");
  }
  if (user && !user.emailVerified) {
    throw new Error("Verify this email address with your existing sign-in method before linking GitHub.");
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: profile.name.slice(0, 100),
        email: profile.email,
        passwordHash: null,
        emailVerified: true,
        githubIdentity: {
          create: {
            githubUserId: profile.githubUserId,
            githubUsername: profile.githubUsername,
            avatarUrl: profile.avatarUrl,
          },
        },
      },
      include: { githubIdentity: true },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        githubIdentity: {
          upsert: {
            create: {
              githubUserId: profile.githubUserId,
              githubUsername: profile.githubUsername,
              avatarUrl: profile.avatarUrl,
            },
            update: {
              githubUsername: profile.githubUsername,
              avatarUrl: profile.avatarUrl,
            },
          },
        },
      },
    });
  }

  const session = await createSession(user.id);
  const token = createToken(user.id, session.id);
  setSessionCookie(res, token, session.expiresAt);
}

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
    data: { userId, expiresAt },
  });

  return { id: session.id, expiresAt };
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
    emailVerified: user.emailVerified,
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getClientUrl() {
  const value = process.env.CLIENT_URL ||
    (process.env.NODE_ENV === "production" ? null : "http://localhost:5173");

  if (!value) {
    throw new Error("CLIENT_URL is not configured.");
  }

  return value.replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("Resend email configuration is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("Resend delivery failed:", response.status, details.slice(0, 500));
    throw new Error("Email delivery failed.");
  }
}

async function sendVerificationEmail(user, rawToken) {
  const link = `${getClientUrl()}/?verifyEmail=${encodeURIComponent(rawToken)}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your DevSpace email",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172033">
        <h2>Verify your email</h2>
        <p>Hello ${escapeHtml(user.name)},</p>
        <p>Confirm your email address to activate your DevSpace account.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:7px">Verify email</a></p>
        <p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(user, rawToken) {
  const link = `${getClientUrl()}/?resetPassword=${encodeURIComponent(rawToken)}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your DevSpace password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172033">
        <h2>Reset your password</h2>
        <p>Hello ${escapeHtml(user.name)},</p>
        <p>Use the link below to choose a new DevSpace password.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:7px">Reset password</a></p>
        <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

async function issueVerificationEmail(user) {
  const rawToken = createRawToken();
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + VERIFICATION_DURATION_MS),
    },
  });
  await sendVerificationEmail(user, rawToken);
}

function validEmail(value) {
  return typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// GitHub login: begin OAuth without requiring an existing DevSpace session.
router.get("/github", githubLoginRateLimit, (req, res) => {
  try {
    const clientId = process.env.GITHUB_LOGIN_CLIENT_ID;
    if (!clientId) throw new Error("GitHub OAuth is not configured.");
    const state = randomBytes(32).toString("hex");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    res.cookie("github_login_state", state, githubLoginCookieOptions);
    res.cookie("github_login_verifier", verifier, githubLoginCookieOptions);
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", getGitHubLoginCallbackUrl());
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return res.redirect(url.toString());
  } catch (error) {
    console.error("GitHub login start error:", error.message);
    return res.redirect(`${getClientUrl()}/?githubLogin=error`);
  }
});

router.get("/github/callback", githubLoginRateLimit, async (req, res) => {
  const { code, state, error } = req.query;
  const savedState = req.cookies?.github_login_state;
  const verifier = req.cookies?.github_login_verifier;
  clearGitHubLoginCookies(res);

  if (error || typeof code !== "string" || !safeCompareOAuthState(state, savedState) || !verifier) {
    return res.redirect(`${getClientUrl()}/?githubLogin=cancelled`);
  }

  try {
    const accessToken = await exchangeGitHubCode(code, verifier);
    const profile = await getVerifiedGitHubProfile(accessToken);
    await signInWithGitHub(profile, res);
    return res.redirect(getClientUrl());
  } catch (error) {
    console.error("GitHub login callback error:", error);
    const reason = encodeURIComponent(error.message || "GitHub sign-in failed.");
    return res.redirect(`${getClientUrl()}/?githubLogin=error&reason=${reason}`);
  }
});

// REGISTER
router.post("/register", registrationRateLimit, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (typeof name !== "string" || !validEmail(email) || typeof password !== "string") {
      return res.status(400).json({
        message: "Please provide a valid name, email address and password.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({ message: "Please enter a valid name." });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
    }

    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      const passwordHash = await bcrypt.hash(password, 12);
      try {
        user = await prisma.user.create({
          data: {
            name: cleanName,
            email: cleanEmail,
            passwordHash,
            emailVerified: false,
          },
        });
      } catch (error) {
        if (error.code !== "P2002") throw error;
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }
    }

    if (user && !user.emailVerified) {
      await issueVerificationEmail(user);
    }

    return res.status(201).json({
      message: "If this address can be registered, a verification email has been sent. Check your inbox.",
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(503).json({
      message: "We could not send the verification email. Please try again shortly.",
    });
  }
});

// VERIFY EMAIL
router.post("/verify-email", verificationRateLimit, async (req, res) => {
  try {
    const { token } = req.body;

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: "This verification link is invalid or expired." });
    }

    const tokenHash = hashToken(token);
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!record || record.expiresAt <= new Date()) {
      return res.status(400).json({ message: "This verification link is invalid or expired." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationToken.deleteMany({
        where: {
          id: record.id,
          expiresAt: { gt: new Date() },
        },
      });

      if (consumed.count !== 1) return false;

      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      });

      await tx.emailVerificationToken.deleteMany({
        where: { userId: record.userId },
      });

      return true;
    });

    if (!result) {
      return res.status(400).json({ message: "This verification link is invalid or expired." });
    }

    return res.json({ message: "Email verified. You can now sign in." });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Could not verify this email address." });
  }
});

// RESEND VERIFICATION
router.post("/resend-verification", verificationRateLimit, async (req, res) => {
  try {
    const email = typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

    if (validEmail(email)) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && !user.emailVerified) {
        await issueVerificationEmail(user);
      }
    }

    return res.json({
      message: "If an unverified account exists for that address, a verification email has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(503).json({ message: "Could not send the email. Please try again shortly." });
  }
});

// LOGIN
router.post("/login", loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!user || !passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before signing in. You can request a new verification email.",
        requiresVerification: true,
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
    return res.status(500).json({ message: "Could not log in." });
  }
});

// REQUEST PASSWORD RESET
router.post("/forgot-password", recoveryRateLimit, async (req, res) => {
  try {
    const email = typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

    if (validEmail(email)) {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && user.emailVerified) {
        const rawToken = createRawToken();
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(rawToken),
            expiresAt: new Date(Date.now() + PASSWORD_RESET_DURATION_MS),
          },
        });
        await sendPasswordResetEmail(user, rawToken);
      }
    }

    return res.json({
      message: "If a verified account exists for that address, a password reset email has been sent.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(503).json({ message: "Could not process the request. Please try again shortly." });
  }
});

// RESET PASSWORD
router.post("/reset-password", recoveryRateLimit, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: "This password reset link is invalid or expired." });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: "Password must be between 8 and 72 characters." });
    }

    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!record || record.expiresAt <= new Date()) {
      return res.status(400).json({ message: "This password reset link is invalid or expired." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const changed = await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.deleteMany({
        where: {
          id: record.id,
          expiresAt: { gt: new Date() },
        },
      });

      if (consumed.count !== 1) return false;

      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });

      await tx.session.deleteMany({ where: { userId: record.userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });

      return true;
    });

    if (!changed) {
      return res.status(400).json({ message: "This password reset link is invalid or expired." });
    }

    return res.json({ message: "Your password has been reset. Please sign in with your new password." });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ message: "Could not reset your password." });
  }
});

// LOGOUT: revoke only this browser's session.
router.post("/logout", async (req, res) => {
  const token = req.cookies?.token;

  if (token) {
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch {
      // Invalid or expired cookies cannot identify an active session.
    }

    if (typeof decoded?.sub === "string" && typeof decoded?.sid === "string") {
      try {
        await prisma.session.deleteMany({
          where: { id: decoded.sid, userId: decoded.sub },
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
  return res.json({ message: "Logged out successfully." });
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
        emailVerified: true,
      },
    });

    if (!user || !user.emailVerified) {
      res.clearCookie("token", cookieOptions);
      return res.status(401).json({ message: "User account is not available." });
    }

    return res.json({ user });
  } catch (error) {
    console.error("User lookup error:", error);
    return res.status(500).json({ message: "Could not retrieve user." });
  }
});

export default router;
