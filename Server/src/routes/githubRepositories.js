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


async function githubGraphQL(token, query, variables) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json().catch(() => null);

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
  return Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf8");
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
router.get("/repositories/:owner/:repo/contents", async (req, res) => {
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
