import React, { useCallback, useEffect, useMemo, useState } from "react";
import { githubAPI } from "../services/api";
import "../styles/WorkspacePages.css";
import "../styles/GitHubActivity.css";

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
  const paths = {
    commit: <><path d="M7 12h10" /><circle cx="5" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></>,
    pull_request: <><path d="M6 4v12" /><path d="m3 7 3-3 3 3" /><path d="M18 20V8" /><circle cx="18" cy="5" r="2" /><circle cx="6" cy="19" r="2" /></>,
    issue: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5" /><path d="M12 16h.01" /></>,
  };

  return (
    <span className={`github-activity-icon ${type}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[type] || paths.issue}
      </svg>
    </span>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16 8a6.2 6.2 0 0 0-10.8-2L3.5 8M3.5 4.5V8h3.5M4 12a6.2 6.2 0 0 0 10.8 2l1.7-2M16.5 15.5V12H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
      <section className="workspace-page github-activity-page">
        <div className="workspace-panel github-activity-loading" role="status">
          <span className="github-activity-loader" />
          <span>Loading GitHub activity...</span>
        </div>
      </section>
    );
  }

  if (error && !activity) {
    return (
      <section className="workspace-page github-activity-page">
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
    <section className="workspace-page github-activity-page">
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
          className="secondary-button github-activity-refresh"
          onClick={() => loadActivity(true)}
          disabled={refreshing}
        >
          <RefreshIcon />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="github-activity-stats">
        <article className="workspace-summary">
          <span>Recent commits</span>
          <strong>{counts.commits}</strong>
          <small>Commits authored by you</small>
        </article>
        <article className="workspace-summary">
          <span>Pull requests</span>
          <strong>{counts.pullRequests}</strong>
          <small>Pull requests involving you</small>
        </article>
        <article className="workspace-summary">
          <span>Issues</span>
          <strong>{counts.issues}</strong>
          <small>Issues involving you</small>
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
            <p>Your latest activity returned by GitHub</p>
          </div>
          <span className="github-activity-item-count">{visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}</span>
        </div>

        <div className="github-activity-filters" role="group" aria-label="Filter activity">
          {[
            ["all", "All activity", items.length],
            ["commit", "Commits", counts.commits],
            ["pull_request", "Pull requests", counts.pullRequests],
            ["issue", "Issues", counts.issues],
          ].map(([value, label, count]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? "active" : ""}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
              <span>{count}</span>
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
                aria-label={`${item.title}, ${item.repository || "repository unavailable"}, open on GitHub`}
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
                <span className="github-activity-open" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="github-activity-empty">
            <div className="github-activity-empty-mark">
              <ActivityIcon type={filter === "all" ? "commit" : filter} />
            </div>
            <strong>No matching activity found</strong>
            <p>
              {filter === "all"
                ? "GitHub did not return recent activity for this account."
                : "There are no results in this activity category."}
            </p>
            {filter !== "all" && (
              <button type="button" className="workspace-link-button" onClick={() => setFilter("all")}>
                View all activity
              </button>
            )}
          </div>
        )}
      </article>
      <p className="github-activity-footnote">
        Activity is based on commits authored by your account and issues or pull requests where your account is involved. GitHub search results are limited to the latest 10 items per category.
      </p>
    </section>
  );
}
