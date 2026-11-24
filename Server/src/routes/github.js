
import express from "express";
import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import prisma from "../prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  encryptToken,
  decryptToken,
} from "../utils/githubTokens.js";

const router = express.Router();

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

const stateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/github",
  maxAge: 10 * 60 * 1000,
};

function clearOAuthCookies(res) {
  res.clearCookie("github_oauth_state", stateCookieOptions);
  res.clearCookie("github_oauth_verifier", stateCookieOptions);
}

function safeCompare(value1, value2) {
  if (!value1 || !value2) return false;

  const first = Buffer.from(value1);
  const second = Buffer.from(value2);

  if (first.length !== second.length) return false;

  return timingSafeEqual(first, second);
}

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevSpace-Dashboard",
  };
}

// Start GitHub authorization
router.get("/connect", authenticateToken, (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId || !CALLBACK_URL) {
    return res.status(500).json({
      message: "GitHub integration is not configured.",
    });
  }

  const state = randomBytes(32).toString("hex");
  const verifier = randomBytes(32).toString("base64url");

  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");

  res.cookie("github_oauth_state", state, stateCookieOptions);
  res.cookie("github_oauth_verifier", verifier, stateCookieOptions);

  const authorizationUrl = new URL(
    "https://github.com/login/oauth/authorize"
  );

  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", CALLBACK_URL);
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  return res.redirect(authorizationUrl.toString());
});

// Handle GitHub authorization callback
router.get("/callback", authenticateToken, async (req, res) => {
  const { code, state, error } = req.query;

  const savedState = req.cookies?.github_oauth_state;
  const verifier = req.cookies?.github_oauth_verifier;

  clearOAuthCookies(res);

  if (error) {
    return res.redirect(
      `${CLIENT_URL}/settings?github=cancelled`
    );
  }

  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    !safeCompare(state, savedState) ||
    !verifier
  ) {
    return res.redirect(
      `${CLIENT_URL}/settings?github=error`
    );
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret || !CALLBACK_URL) {
      throw new Error("GitHub integration is not configured.");
    }

    // Exchange authorization code for an access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: CALLBACK_URL,
          code_verifier: verifier,
        }),
      }
    );

    const tokenResponseText = await tokenResponse.text();

    console.log("GitHub token exchange status:", tokenResponse.status);
    console.log("GitHub token exchange response:", tokenResponseText);

    const tokenData = JSON.parse(tokenResponseText);

    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
      throw new Error("GitHub token exchange failed.");
    }

    // Retrieve the authorized GitHub account
    const profileResponse = await fetch(
      "https://api.github.com/user",
      {
        headers: githubHeaders(tokenData.access_token),
      }
    );

    if (!profileResponse.ok) {
      throw new Error("Could not retrieve GitHub profile.");
    }

    const profile = await profileResponse.json();

    // Encrypt tokens before storing them
    const accessToken = encryptToken(tokenData.access_token);

    const refreshToken = tokenData.refresh_token
      ? encryptToken(tokenData.refresh_token)
      : null;

    const accessTokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    const refreshTokenExpiresAt = tokenData.refresh_token_expires_in
      ? new Date(
          Date.now() + tokenData.refresh_token_expires_in * 1000
        )
      : null;

    await prisma.gitHubConnection.upsert({
      where: {
        userId: req.userId,
      },
      create: {
        userId: req.userId,
        githubUserId: String(profile.id),
        githubUsername: profile.login,
        avatarUrl: profile.avatar_url || null,

        encryptedAccessToken: accessToken.encryptedToken,
        accessTokenIv: accessToken.iv,
        accessTokenTag: accessToken.authTag,
        accessTokenExpiresAt,

        encryptedRefreshToken: refreshToken?.encryptedToken || null,
        refreshTokenIv: refreshToken?.iv || null,
        refreshTokenTag: refreshToken?.authTag || null,
        refreshTokenExpiresAt,
      },
      update: {
        githubUserId: String(profile.id),
        githubUsername: profile.login,
        avatarUrl: profile.avatar_url || null,

        encryptedAccessToken: accessToken.encryptedToken,
        accessTokenIv: accessToken.iv,
        accessTokenTag: accessToken.authTag,
        accessTokenExpiresAt,

        encryptedRefreshToken: refreshToken?.encryptedToken || null,
        refreshTokenIv: refreshToken?.iv || null,
        refreshTokenTag: refreshToken?.authTag || null,
        refreshTokenExpiresAt,
      },
    });

    return res.redirect(
      `${CLIENT_URL}/settings?github=connected`
    );
  } catch (err) {
    console.error("GitHub connection error:", err.message);

    return res.redirect(
      `${CLIENT_URL}/settings?github=error`
    );
  }
});

// Get the connected GitHub account
router.get("/status", authenticateToken, async (req, res) => {
  const connection = await prisma.gitHubConnection.findUnique({
    where: {
      userId: req.userId,
    },
    select: {
      githubUserId: true,
      githubUsername: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return res.json({
    connected: Boolean(connection),
    connection,
  });
});

// List repositories accessible to the connected GitHub account
router.get("/repositories", authenticateToken, async (req, res) => {
  const connection = await prisma.gitHubConnection.findUnique({
    where: {
      userId: req.userId,
    },
  });

  if (!connection) {
    return res.status(404).json({
      message: "No GitHub account is connected.",
    });
  }

  try {
    const accessToken = decryptToken(
      connection.encryptedAccessToken,
      connection.accessTokenIv,
      connection.accessTokenTag
    );

    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
      {
        headers: githubHeaders(accessToken),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({
          message: "Your GitHub authorization is no longer valid. Please reconnect your account.",
        });
      }

      return res.status(502).json({
        message: "GitHub could not provide your repositories.",
      });
    }

    const repositories = await response.json();

    return res.json({
      repositories: repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
        language: repo.language,
        stars: repo.stargazers_count,
        updatedAt: repo.updated_at,
      })),
    });
  } catch (err) {
    console.error("GitHub repository error:", err.message);

    return res.status(500).json({
      message: "Could not load GitHub repositories.",
    });
  }
});

export default router;
