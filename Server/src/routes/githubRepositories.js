import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import prisma from "../prisma.js";
import { decryptToken } from "../utils/githubTokens.js";

const router = express.Router();

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevSpace-Dashboard",
  };
}

async function getConnectionToken(userId) {
  const connection = await prisma.gitHubConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    const error = new Error("No GitHub account is connected.");
    error.status = 404;
    throw error;
  }

  return decryptToken(
    connection.encryptedAccessToken,
    connection.accessTokenIv,
    connection.accessTokenTag
  );
}

function validateRepository(owner, repo) {
  const valid = /^[A-Za-z0-9_.-]+$/;
  return valid.test(owner) && valid.test(repo);
}

async function githubRequest(token, endpoint) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: githubHeaders(token),
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("GitHub returned an unreadable response.");
    }
  }

  if (!response.ok) {
    const error = new Error(
      response.status === 404
        ? "This repository or resource could not be found."
        : data?.message || "GitHub could not load this repository."
    );
    error.status = response.status === 401 ? 401 : response.status === 404 ? 404 : 502;
    throw error;
  }

  return data;
}

function decodeGitHubContent(content) {
  return Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf8");
}

router.use(authenticateToken);

// Load repository metadata, README, root files, recent commits, and branches.
router.get("/:owner/:repo/details", async (req, res) => {
  const { owner, repo } = req.params;

  if (!validateRepository(owner, repo)) {
    return res.status(400).json({ message: "Invalid repository name." });
  }

  try {
    const token = await getConnectionToken(req.userId);
    const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

    const [repository, readmeResult, contentsResult, commitsResult, branchesResult] =
      await Promise.allSettled([
        githubRequest(token, base),
        githubRequest(token, `${base}/readme`),
        githubRequest(token, `${base}/contents`),
        githubRequest(token, `${base}/commits?per_page=8`),
        githubRequest(token, `${base}/branches?per_page=100`),
      ]);

    if (repository.status === "rejected") {
      throw repository.reason;
    }

    const readme = readmeResult.status === "fulfilled"
      ? {
          name: readmeResult.value.name,
          path: readmeResult.value.path,
          content: decodeGitHubContent(readmeResult.value.content || ""),
          htmlUrl: readmeResult.value.html_url,
        }
      : null;

    const contents = contentsResult.status === "fulfilled" && Array.isArray(contentsResult.value)
      ? contentsResult.value.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
          htmlUrl: item.html_url,
        }))
      : [];

    const commits = commitsResult.status === "fulfilled"
      ? commitsResult.value.map(item => ({
          sha: item.sha,
          shortSha: item.sha.slice(0, 7),
          message: item.commit?.message?.split("\n")[0] || "Commit",
          author: item.commit?.author?.name || item.author?.login || "Unknown",
          date: item.commit?.author?.date || null,
          htmlUrl: item.html_url,
        }))
      : [];

    const branches = branchesResult.status === "fulfilled"
      ? branchesResult.value.map(item => ({
          name: item.name,
          protected: item.protected,
        }))
      : [];

    const item = repository.value;

    return res.json({
      repository: {
        id: item.id,
        name: item.name,
        fullName: item.full_name,
        description: item.description,
        htmlUrl: item.html_url,
        private: item.private,
        fork: item.fork,
        archived: item.archived,
        defaultBranch: item.default_branch,
        language: item.language,
        stars: item.stargazers_count,
        forks: item.forks_count,
        watchers: item.subscribers_count,
        openIssues: item.open_issues_count,
        license: item.license?.spdx_id || null,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        pushedAt: item.pushed_at,
      },
      readme,
      contents,
      commits,
      branches,
      warnings: [
        readmeResult.status === "rejected" ? "README is not available." : null,
        contentsResult.status === "rejected" ? "Repository files could not be loaded." : null,
        commitsResult.status === "rejected" ? "Recent commits could not be loaded." : null,
        branchesResult.status === "rejected" ? "Branches could not be loaded." : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("GitHub repository details error:", error.message);
    return res.status(error.status || 500).json({
      message: error.message || "Could not load repository details.",
    });
  }
});

// Browse a directory or preview a file in the repository.
router.get("/:owner/:repo/contents", async (req, res) => {
  const { owner, repo } = req.params;
  const requestedPath = typeof req.query.path === "string" ? req.query.path : "";

  if (!validateRepository(owner, repo)) {
    return res.status(400).json({ message: "Invalid repository name." });
  }

  if (requestedPath.split("/").some(part => part === "." || part === "..")) {
    return res.status(400).json({ message: "Invalid repository path." });
  }

  try {
    const token = await getConnectionToken(req.userId);
    const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`;
    const endpoint = requestedPath
      ? `${base}/${requestedPath.split("/").map(encodeURIComponent).join("/")}`
      : base;
    const result = await githubRequest(token, endpoint);

    if (Array.isArray(result)) {
      return res.json({
        type: "directory",
        items: result.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
          htmlUrl: item.html_url,
        })),
      });
    }

    return res.json({
      type: "file",
      name: result.name,
      path: result.path,
      size: result.size,
      htmlUrl: result.html_url,
      content: result.encoding === "base64"
        ? decodeGitHubContent(result.content || "")
        : "",
    });
  } catch (error) {
    console.error("GitHub repository contents error:", error.message);
    return res.status(error.status || 500).json({
      message: error.message || "Could not load repository contents.",
    });
  }
});

export default router;
