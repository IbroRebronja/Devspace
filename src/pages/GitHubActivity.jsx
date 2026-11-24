import React, { useCallback, useEffect, useMemo, useState } from "react";
import { githubAPI } from "../services/api";
import "../styles/WorkspacePages.css";

function formatActivityDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActivityIcon({ type }) {
  if (type === "commit") return <span className="github-activity-icon commit">⌘</span>;
  if (type === "pull_request") return <span className="github-activity-icon pull">⑂</span>;
  return <span className="github-activity-icon issue">◎</span>;
}

export default function GitHubActivity({ onOpenSettings }) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadActivity = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const result = await githubAPI.getActivity();
      setActivity(result);
    } catch (err) {
      setError(err.message || "Could not load GitHub activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const items = useMemo(() => {
    if (!activity) return [];
    return [
      ...(activity.commits || []),
      ...(activity.pullRequests || []),
      ...(activity.issues || []),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [activity]);

  const visibleItems = filter === "all"
    ? items
    : items.filter(item => item.type === filter);

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="workspace-panel">Loading GitHub activity...</div>
      </section>
    );
  }

  if (error && !activity) {
    return (
      <section className="workspace-page">
        <div className="workspace-page-heading">
          <div>
            <span className="section-kicker">DEVELOPER WORKSPACE</span>
            <h1>GitHub Activity</h1>
            <p>Your recent work across GitHub repositories.</p>
          </div>
        </div>
        <div className="workspace-panel github-activity-error" role="alert">
          <strong>Could not load GitHub activity</strong>
          <p>{error}</p>
          <div className="github-activity-actions">
            <button type="button" className="secondary-button" onClick={() => loadActivity()}>
              Try again
            </button>
            <button type="button" className="workspace-link-button" onClick={onOpenSettings}>
              Open GitHub settings
            </button>
          </div>
        </div>
      </section>
    );
  }

  const counts = {
    commits: activity?.commits?.length || 0,
    pullRequests: activity?.pullRequests?.length || 0,
    issues: activity?.issues?.length || 0,
  };

  return (
    <section className="workspace-page">
      <div className="workspace-page-heading github-activity-heading">
        <div>
          <span className="section-kicker">DEVELOPER WORKSPACE</span>
          <h1>GitHub Activity</h1>
          <p>
            Recent commits, pull requests, and issues involving{" "}
            <strong>{activity?.account || "your account"}</strong>.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => loadActivity(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="github-activity-stats">
        <article className="workspace-summary">
          <span>Recent commits</span>
          <strong>{counts.commits}</strong>
          <small>Authored by you</small>
        </article>
        <article className="workspace-summary">
          <span>Pull requests</span>
          <strong>{counts.pullRequests}</strong>
          <small>Where you are involved</small>
        </article>
        <article className="workspace-summary">
          <span>Issues</span>
          <strong>{counts.issues}</strong>
          <small>Where you are involved</small>
        </article>
      </div>

      {activity?.warnings?.map(warning => (
        <p className="repo-warning" key={warning}>{warning}</p>
      ))}
      {error && <p className="repo-warning" role="alert">{error}</p>}

      <article className="workspace-panel github-activity-feed">
        <div className="github-activity-feed-heading">
          <div>
            <h2>Activity feed</h2>
            <p>Showing the latest results returned by GitHub.</p>
          </div>
          <span>{visibleItems.length} items</span>
        </div>

        <div className="github-activity-filters" role="group" aria-label="Filter activity">
          {[
            ["all", "All activity"],
            ["commit", "Commits"],
            ["pull_request", "Pull requests"],
            ["issue", "Issues"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? "active" : ""}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {visibleItems.length ? (
          <div className="github-activity-list">
            {visibleItems.map(item => (
              <a
                className="github-activity-item"
                href={item.url}
                target="_blank"
                rel="noreferrer"
                key={item.type + item.id}
              >
                <ActivityIcon type={item.type} />
                <div className="github-activity-item-main">
                  <strong>{item.title}</strong>
                  <span>{item.repository || "Repository unavailable"}</span>
                  <small>
                    {item.type === "commit"
                      ? `Commit ${item.sha} · ${item.author}`
                      : `${item.type === "pull_request" ? "Pull request" : "Issue"} #${item.number} · ${item.state} · ${item.author}`}
                  </small>
                </div>
                <time dateTime={item.date || undefined}>{formatActivityDate(item.date)}</time>
                <span className="github-activity-open">↗</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="github-activity-empty">
            <strong>No matching activity found</strong>
            <p>
              {filter === "all"
                ? "GitHub did not return recent activity for this account."
                : "There are no results in this activity category."}
            </p>
          </div>
        )}
      </article>
      <p className="github-activity-footnote">
        Activity is based on commits authored by your account and issues or pull requests where your account is involved. GitHub search results are limited to the latest 10 items per category.
      </p>
    </section>
  );
}
