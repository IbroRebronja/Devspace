import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import prisma from "../prisma.js";
import { decryptToken } from "../utils/githubTokens.js";
import { githubRateLimit } from "../middleware/githubRateLimit.js";

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

const GITHUB_REQUEST_TIMEOUT_MS = 10_000;
const MAX_GITHUB_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 1024 * 1024;

function validateRepository(owner, repo) {
  const valid = /^[A-Za-z0-9_.-]+$/;
  return (
    typeof owner === "string" &&
    typeof repo === "string" &&
    owner.length > 0 &&
    owner.length <= 100 &&
    repo.length > 0 &&
    repo.length <= 100 &&
    owner !== "." &&
    owner !== ".." &&
    repo !== "." &&
    repo !== ".." &&
    valid.test(owner) &&
    valid.test(repo)
  );
}

function createGitHubError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readLimitedResponse(response, maxBytes) {
  const contentLength = Number(response.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel().catch(() => {});
    throw createGitHubError(
      "GitHub response exceeds the allowed size.",
      413
    );
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw createGitHubError(
          "GitHub response exceeds the allowed size.",
          413
        );
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes).toString("utf8");
}

async function fetchGitHubText(url, options, maxBytes = MAX_GITHUB_RESPONSE_BYTES) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    GITHUB_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await readLimitedResponse(response, maxBytes);

    return { response, text };
  } catch (error) {
    if (error.status) throw error;

    if (controller.signal.aborted || error.name === "AbortError" || error.name === "TimeoutError") {
      throw createGitHubError(
        "GitHub took too long to respond. Please try again.",
        504
      );
    }

    throw createGitHubError(
      "Could not reach GitHub. Please try again.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function githubRequest(token, endpoint) {
  const { response, text } = await fetchGitHubText(
    `https://api.github.com${endpoint}`,
    { headers: githubHeaders(token) }
  );

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

async function githubGraphQL(token, query, variables) {
  const { response, text } = await fetchGitHubText(
    "https://api.github.com/graphql",
    {
      method: "POST",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("GitHub returned an unreadable contribution response.");
  }

  if (!response.ok || data?.errors?.length) {
    const message = data?.errors?.map(item => item.message).join("; ");
    const error = new Error(message || "GitHub could not load contribution data.");
    error.status = response.status === 401 ? 401 : 502;
    throw error;
  }

  if (!data?.data) {
    throw new Error("GitHub returned incomplete contribution data.");
  }

  return data.data;
}

function decodeGitHubContent(content) {
  const decoded = Buffer.from(content.replace(/\s/g, ""), "base64");

  if (decoded.byteLength > MAX_PREVIEW_BYTES) {
    throw createGitHubError(
      "This file is too large to preview. Open it directly on GitHub instead.",
      413
    );
  }

  return decoded.toString("utf8");
}

router.use(authenticateToken, githubRateLimit);

// Load repository metadata, README, root files, recent commits, and branches.
router.get("/repositories/:owner/:repo/details", async (req, res) => {
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

    let readme = null;
    let readmeTooLarge = false;

    if (readmeResult.status === "fulfilled") {
      try {
        readme = {
          name: readmeResult.value.name,
          path: readmeResult.value.path,
          content: decodeGitHubContent(readmeResult.value.content || ""),
          htmlUrl: readmeResult.value.html_url,
        };
      } catch (error) {
        if (error.status === 413) {
          readmeTooLarge = true;
        } else {
          throw error;
        }
      }
    }

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
        readmeTooLarge ? "README is too large to preview." : null,
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
router.get("/repositories/:owner/:repo/contents", async (req, res) => {
  const { owner, repo } = req.params;
  const requestedPath = typeof req.query.path === "string" ? req.query.path : "";

  if (!validateRepository(owner, repo)) {
    return res.status(400).json({ message: "Invalid repository name." });
  }

  if (
    requestedPath.length > 1024 ||
    requestedPath.split("/").some(part => part === "." || part === "..")
  ) {
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

    if (Number(result.size) > MAX_PREVIEW_BYTES) {
      return res.status(413).json({
        message: "This file is too large to preview. Open it directly on GitHub instead.",
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


// Aggregate recent commits, pull requests, and issues involving the connected account.
router.get("/activity", async (req, res) => {
  try {
    const token = await getConnectionToken(req.userId);
    const profile = await githubRequest(token, "/user");

    const searches = await Promise.allSettled([
      githubRequest(
        token,
        `/search/commits?q=${encodeURIComponent(`author:${profile.login}`)}&sort=committer-date&order=desc&per_page=10`
      ),
      githubRequest(
        token,
        `/search/issues?q=${encodeURIComponent(`involves:${profile.login} is:pr`)}&sort=updated&order=desc&per_page=10`
      ),
      githubRequest(
        token,
        `/search/issues?q=${encodeURIComponent(`involves:${profile.login} is:issue`)}&sort=updated&order=desc&per_page=10`
      ),
    ]);

    const [commitSearch, pullSearch, issueSearch] = searches;

    if (searches.every(result => result.status === "rejected")) {
      throw commitSearch.reason;
    }

    const commits = commitSearch.status === "fulfilled"
      ? (commitSearch.value.items || []).map(item => ({
          id: item.sha,
          type: "commit",
          title: item.commit?.message?.split("\n")[0] || "Commit",
          repository: item.repository?.full_name || "",
          author: item.author?.login || item.commit?.author?.name || "Unknown",
          date: item.commit?.author?.date || null,
          url: item.html_url,
          sha: item.sha.slice(0, 7),
        }))
      : [];

    const pullRequests = pullSearch.status === "fulfilled"
      ? (pullSearch.value.items || []).map(item => ({
          id: item.id,
          type: "pull_request",
          title: item.title,
          number: item.number,
          repository: item.repository_url?.split("/").slice(-2).join("/") || "",
          author: item.user?.login || "Unknown",
          state: item.state,
          date: item.updated_at || item.created_at,
          url: item.html_url,
          comments: item.comments || 0,
        }))
      : [];

    const issues = issueSearch.status === "fulfilled"
      ? (issueSearch.value.items || []).map(item => ({
          id: item.id,
          type: "issue",
          title: item.title,
          number: item.number,
          repository: item.repository_url?.split("/").slice(-2).join("/") || "",
          author: item.user?.login || "Unknown",
          state: item.state,
          date: item.updated_at || item.created_at,
          url: item.html_url,
          comments: item.comments || 0,
        }))
      : [];

    return res.json({
      account: profile.login,
      commits,
      pullRequests,
      issues,
      warnings: [
        commitSearch.status === "rejected" ? "Commits could not be loaded." : null,
        pullSearch.status === "rejected" ? "Pull requests could not be loaded." : null,
        issueSearch.status === "rejected" ? "Issues could not be loaded." : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("GitHub activity error:", error.message);
    return res.status(error.status || 500).json({
      message: error.message || "Could not load GitHub activity.",
    });
  }
});


// Load the connected account's contribution calendar and repository totals.
router.get("/contributions", async (req, res) => {
  try {
    const token = await getConnectionToken(req.userId);
    const profile = await githubRequest(token, "/user");
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 364);

    const query = `
      query ContributionOverview($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(
            from: $from
            to: $to
          ) {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  weekday
                }
              }
            }
            commitContributionsByRepository(maxRepositories: 10) {
              repository { nameWithOwner url }
              contributions { totalCount }
            }
            pullRequestContributionsByRepository(maxRepositories: 10) {
              repository { nameWithOwner url }
              contributions { totalCount }
            }
            issueContributionsByRepository(maxRepositories: 10) {
              repository { nameWithOwner url }
              contributions { totalCount }
            }
          }
        }
      }
    `;

    const data = await githubGraphQL(token, query, {
      login: profile.login,
      from: from.toISOString(),
      to: to.toISOString(),
    });

    const collection = data.user?.contributionsCollection;
    if (!collection?.contributionCalendar) {
      throw new Error("GitHub did not return a contribution calendar.");
    }

    const repositories = new Map();
    const addRepositories = entries => {
      for (const entry of entries || []) {
        const name = entry.repository?.nameWithOwner;
        if (!name) continue;
        const current = repositories.get(name) || {
          name,
          url: entry.repository.url,
          contributions: 0,
        };
        current.contributions += entry.contributions?.totalCount || 0;
        repositories.set(name, current);
      }
    };

    addRepositories(collection.commitContributionsByRepository);
    addRepositories(collection.pullRequestContributionsByRepository);
    addRepositories(collection.issueContributionsByRepository);

    return res.json({
      account: profile.login,
      from: from.toISOString(),
      to: to.toISOString(),
      totalContributions: collection.contributionCalendar.totalContributions,
      totals: {
        commits: collection.totalCommitContributions || 0,
        pullRequests: collection.totalPullRequestContributions || 0,
        issues: collection.totalIssueContributions || 0,
        reviews: collection.totalPullRequestReviewContributions || 0,
      },
      weeks: collection.contributionCalendar.weeks || [],
      repositories: [...repositories.values()]
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 8),
    });
  } catch (error) {
    console.error("GitHub contributions error:", error.message);
    return res.status(error.status || 500).json({
      message: error.message || "Could not load GitHub contributions.",
    });
  }
});

export default router;
