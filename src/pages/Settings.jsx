import React, { useEffect, useState } from "react";
import DataControls from "../components/DataControls";
import { githubAPI } from "../services/api";
import "../styles/WorkspacePages.css";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RepositoryDetails({ repository, onBack }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  const [owner, repoName] = repository.fullName.split("/");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      try {
        setLoading(true);
        setError("");
        const result = await githubAPI.getRepositoryDetails(owner, repoName);
        if (!cancelled) {
          setDetails(result);
          setDirectory(result.contents || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load repository details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [owner, repoName]);

  async function openPath(path, type) {
    try {
      setDirectoryLoading(true);
      setError("");
      setFilePreview(null);
      const result = await githubAPI.getRepositoryContents(owner, repoName, path);

      if (result.type === "file" || type === "file") {
        setFilePreview(result);
      } else {
        setCurrentPath(path);
        setDirectory(result.items || []);
      }
    } catch (err) {
      setError(err.message || "Could not open this repository item.");
    } finally {
      setDirectoryLoading(false);
    }
  }

  async function goToParent() {
    if (!currentPath) return;
    const parent = currentPath.split("/").slice(0, -1).join("/");
    await openPath(parent, "directory");
  }

  if (loading) {
    return <div className="workspace-panel">Loading repository details...</div>;
  }

  if (error && !details) {
    return (
      <section className="workspace-page">
        <button type="button" className="secondary-button" onClick={onBack}>← Back to repositories</button>
        <div className="workspace-panel" role="alert">{error}</div>
      </section>
    );
  }

  if (!details) return null;

  const info = details.repository;

  return (
    <section className="workspace-page">
      <div className="repo-detail-top">
        <button type="button" className="secondary-button" onClick={onBack}>← Back to repositories</button>
        <a href={info.htmlUrl} target="_blank" rel="noreferrer">Open on GitHub ↗</a>
      </div>

      <div className="workspace-page-heading repo-detail-heading">
        <div>
          <span className="section-kicker">GITHUB REPOSITORY</span>
          <h1>{info.fullName}</h1>
          <p>{info.description || "No description provided."}</p>
          <div className="repo-detail-tags">
            <span>{info.private ? "Private" : "Public"}</span>
            {info.fork && <span>Fork</span>}
            {info.archived && <span>Archived</span>}
            {info.language && <span>{info.language}</span>}
          </div>
        </div>
      </div>

      <div className="repo-stat-grid">
        <div className="workspace-summary"><strong>{info.stars}</strong><span>Stars</span></div>
        <div className="workspace-summary"><strong>{info.forks}</strong><span>Forks</span></div>
        <div className="workspace-summary"><strong>{info.watchers}</strong><span>Watchers</span></div>
        <div className="workspace-summary"><strong>{info.openIssues}</strong><span>Open issues</span></div>
      </div>

      {details.warnings?.map(warning => (
        <p className="repo-warning" key={warning}>{warning}</p>
      ))}

      {error && <p className="repo-warning" role="alert">{error}</p>}

      <div className="repo-detail-grid">
        <div className="repo-detail-main">
          <article className="workspace-panel">
            <div className="repo-panel-heading">
              <h2>Files and folders</h2>
              <span>Default branch: {info.defaultBranch}</span>
            </div>

            {filePreview ? (
              <div className="repo-file-preview">
                <div className="repo-file-toolbar">
                  <button type="button" className="secondary-button" onClick={() => setFilePreview(null)}>← Back to files</button>
                  <strong>{filePreview.path}</strong>
                </div>
                <pre>{filePreview.content || "This file cannot be previewed as text."}</pre>
              </div>
            ) : (
              <div className="repo-file-list">
                {currentPath && (
                  <button type="button" className="repo-file-row repo-parent-row" onClick={goToParent}>
                    <span>↰</span><strong>..</strong><small>Parent directory</small>
                  </button>
                )}
                {directoryLoading ? (
                  <p>Loading files...</p>
                ) : directory.length ? (
                  directory.map(item => (
                    <button
                      type="button"
                      className="repo-file-row"
                      key={item.path}
                      onClick={() => openPath(item.path, item.type)}
                    >
                      <span>{item.type === "dir" ? "📁" : "📄"}</span>
                      <strong>{item.name}</strong>
                      <small>{item.type === "dir" ? "Folder" : item.size ? `${item.size.toLocaleString()} bytes` : "File"}</small>
                      <span className="repo-file-arrow">›</span>
                    </button>
                  ))
                ) : (
                  <p>This directory is empty.</p>
                )}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <h2>README</h2>
            {details.readme?.content ? (
              <pre className="repo-readme">{details.readme.content}</pre>
            ) : (
              <p>No README file was found in the default branch.</p>
            )}
          </article>
        </div>

        <aside className="repo-detail-sidebar">
          <article className="workspace-panel">
            <h2>About</h2>
            <dl className="repo-about-list">
              <div><dt>Default branch</dt><dd>{info.defaultBranch}</dd></div>
              <div><dt>Language</dt><dd>{info.language || "Not specified"}</dd></div>
              <div><dt>License</dt><dd>{info.license || "Not specified"}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(info.createdAt)}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDate(info.updatedAt)}</dd></div>
              <div><dt>Last push</dt><dd>{formatDate(info.pushedAt)}</dd></div>
            </dl>
          </article>

          <article className="workspace-panel">
            <h2>Branches ({details.branches.length})</h2>
            <div className="repo-branch-list">
              {details.branches.map(branch => (
                <div key={branch.name}><span>⑂</span><strong>{branch.name}</strong>{branch.protected && <small>Protected</small>}</div>
              ))}
              {!details.branches.length && <p>No branches found.</p>}
            </div>
          </article>

          <article className="workspace-panel">
            <h2>Recent commits</h2>
            <div className="repo-commit-list">
              {details.commits.map(commit => (
                <a href={commit.htmlUrl} target="_blank" rel="noreferrer" key={commit.sha}>
                  <strong>{commit.message}</strong>
                  <span>{commit.author} · {formatDate(commit.date)}</span>
                  <code>{commit.shortSha}</code>
                </a>
              ))}
              {!details.commits.length && <p>No commits found.</p>}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default function Settings() {
  const [githubStatus, setGithubStatus] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [githubLoading, setGithubLoading] = useState(true);
  const [repositoryLoading, setRepositoryLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [selectedRepository, setSelectedRepository] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectionResult = params.get("github");

    if (connectionResult === "connected") {
      setConnectionMessage("Your GitHub account has been connected successfully.");
    } else if (connectionResult === "error") {
      setGithubError("GitHub connection could not be completed. Please try again.");
    } else if (connectionResult === "cancelled") {
      setConnectionMessage("GitHub authorization was cancelled.");
    }

    async function loadGitHubStatus() {
      try {
        const result = await githubAPI.getStatus();
        setGithubStatus(result);

        if (result.connected) {
          setRepositoryLoading(true);
          const repositoryResult = await githubAPI.getRepositories();
          setRepositories(repositoryResult.repositories || []);
        }
      } catch (error) {
        setGithubError(error.message || "Could not load GitHub connection details.");
      } finally {
        setGithubLoading(false);
        setRepositoryLoading(false);
      }
    }

    loadGitHubStatus();
  }, []);

  function connectGitHub() {
    window.location.assign(githubAPI.connectUrl);
  }

  if (selectedRepository) {
    return (
      <RepositoryDetails
        repository={selectedRepository}
        onBack={() => setSelectedRepository(null)}
      />
    );
  }

  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <span className="section-kicker">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your DevSpace preferences and data.</p>
        </div>
      </div>

      <article className="workspace-panel">
        <h2>Profile</h2>
        <div className="settings-profile">
          <div className="avatar">IR</div>
          <div>
            <strong>Ibro Rebronja</strong>
            <small>Frontend Developer</small>
          </div>
        </div>
        <p className="settings-note">
          Profile editing and account management are not connected to a backend yet.
        </p>
      </article>

      <article className="workspace-panel">
        <h2>GitHub</h2>
        <p>Connect your GitHub account to view repositories you can access.</p>

        {connectionMessage && <p role="status" style={{ color: "#24845a" }}>{connectionMessage}</p>}
        {githubError && <p role="alert" style={{ color: "#c04452" }}>{githubError}</p>}

        {githubLoading ? (
          <p>Checking GitHub connection...</p>
        ) : githubStatus?.connected ? (
          <>
            <div className="settings-profile" style={{ marginTop: "16px" }}>
              {githubStatus.connection?.avatarUrl ? (
                <img src={githubStatus.connection.avatarUrl} alt="GitHub profile" width="44" height="44" style={{ borderRadius: "50%" }} />
              ) : (
                <div className="avatar">GH</div>
              )}
              <div>
                <strong>{githubStatus.connection?.githubUsername}</strong>
                <small>GitHub account connected</small>
              </div>
              <span style={{ marginLeft: "auto", color: "#24845a", fontSize: "12px", fontWeight: 700 }}>Connected</span>
            </div>

            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>Your repositories</h3>
              {repositoryLoading ? (
                <p>Loading repositories...</p>
              ) : repositories.length ? (
                <div>
                  {repositories.map(repository => (
                    <button
                      type="button"
                      key={repository.id}
                      className="github-repository-row"
                      onClick={() => setSelectedRepository(repository)}
                    >
                      <span className="github-repository-name">{repository.fullName}</span>
                      {repository.description && <span className="github-repository-description">{repository.description}</span>}
                      <span className="github-repository-meta">
                        {repository.language || "Language not specified"} · {repository.isPrivate ? "Private" : "Public"} · {repository.stars} stars
                      </span>
                      <span className="github-repository-open">View details →</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p>No repositories were returned for this GitHub account.</p>
              )}
            </div>
          </>
        ) : (
          <button type="button" className="workspace-link-button" onClick={connectGitHub}>
            Connect GitHub
          </button>
        )}
      </article>

      <article className="workspace-panel">
        <DataControls />
      </article>

      <article className="workspace-panel">
        <h2>Application</h2>
        <p>
          DevSpace currently stores project data in React state.
          Changes are not permanently saved to an account or remote database.
        </p>
      </article>
    </section>
  );
}
