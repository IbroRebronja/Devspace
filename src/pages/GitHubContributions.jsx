import React, { useCallback, useEffect, useMemo, useState } from "react";
import { githubAPI } from "../services/api";
import "../styles/WorkspacePages.css";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function getLevel(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function ContributionHeatmap({ weeks }) {
  const days = weeks.flatMap(week => week.contributionDays || []);
  const monthLabels = [];
  let previousMonth = "";

  days.forEach((day, index) => {
    const date = new Date(day.date + "T00:00:00");
    const month = date.toLocaleDateString(undefined, { month: "short" });
    if (date.getDate() <= 7 && month !== previousMonth) {
      monthLabels.push({ index, month });
    }
    previousMonth = month;
  });

  return (
    <div className="contribution-calendar-wrap">
      <div className="contribution-months" aria-hidden="true">
        {monthLabels.map(item => (
          <span key={item.index} style={{ gridColumn: Math.floor(item.index / 7) + 1 }}>
            {item.month}
          </span>
        ))}
      </div>
      <div className="contribution-calendar">
        <div className="contribution-weekday-labels" aria-hidden="true">
          <span>Mon</span>
          <span />
          <span>Wed</span>
          <span />
          <span>Fri</span>
          <span />
          <span />
        </div>
        {weeks.map((week, index) => (
          <div className="contribution-week" key={index}>
            {(week.contributionDays || []).map(day => {
              const date = new Date(day.date + "T00:00:00");
              const label = date.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              });
              return (
                <span
                  key={day.date}
                  className={`contribution-day level-${getLevel(day.contributionCount)}`}
                  title={`${day.contributionCount} contributions on ${label}`}
                  aria-label={`${day.contributionCount} contributions on ${label}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="contribution-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <span key={level} className={`contribution-day level-${level}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function GitHubContributions({ onOpenSettings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadContributions = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const result = await githubAPI.getContributions();
      setData(result);
    } catch (err) {
      setError(err.message || "Could not load GitHub contributions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContributions();
  }, [loadContributions]);

  const monthlyTotals = useMemo(() => {
    if (!data?.weeks) return [];
    const totals = new Map();
    for (const week of data.weeks) {
      for (const day of week.contributionDays || []) {
        const date = new Date(day.date + "T00:00:00");
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const current = totals.get(key) || {
          label: date.toLocaleDateString(undefined, { month: "short" }),
          total: 0,
        };
        current.total += day.contributionCount || 0;
        totals.set(key, current);
      }
    }
    return [...totals.values()];
  }, [data]);

  const maxMonth = Math.max(1, ...monthlyTotals.map(month => month.total));

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="workspace-panel">Loading GitHub contributions...</div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="workspace-page">
        <div className="workspace-page-heading">
          <div>
            <span className="section-kicker">DEVELOPER WORKSPACE</span>
            <h1>Contributions Overview</h1>
            <p>Your GitHub activity over the last 365 days.</p>
          </div>
        </div>
        <div className="workspace-panel github-activity-error" role="alert">
          <strong>Could not load contribution data</strong>
          <p>{error}</p>
          <div className="github-activity-actions">
            <button type="button" className="secondary-button" onClick={() => loadContributions()}>
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

  const totals = data?.totals || {};

  return (
    <section className="workspace-page">
      <div className="workspace-page-heading github-activity-heading">
        <div>
          <span className="section-kicker">DEVELOPER WORKSPACE</span>
          <h1>Contributions Overview</h1>
          <p>
            Your GitHub contributions over the last 365 days for{" "}
            <strong>{data?.account || "your account"}</strong>.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => loadContributions(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="contribution-stat-grid">
        <article className="workspace-summary contribution-total-card">
          <span>Total contributions</span>
          <strong>{formatNumber(data?.totalContributions)}</strong>
          <small>Across the last 365 days</small>
        </article>
        <article className="workspace-summary">
          <span>Commits</span>
          <strong>{formatNumber(totals.commits)}</strong>
          <small>Code contributions</small>
        </article>
        <article className="workspace-summary">
          <span>Pull requests</span>
          <strong>{formatNumber(totals.pullRequests)}</strong>
          <small>Pull requests opened</small>
        </article>
        <article className="workspace-summary">
          <span>Issues</span>
          <strong>{formatNumber(totals.issues)}</strong>
          <small>Issues opened</small>
        </article>
        <article className="workspace-summary">
          <span>Reviews</span>
          <strong>{formatNumber(totals.reviews)}</strong>
          <small>Pull request reviews</small>
        </article>
      </div>

      {error && <p className="repo-warning" role="alert">{error}</p>}

      <article className="workspace-panel contribution-panel">
        <div className="contribution-panel-heading">
          <div>
            <h2>Contribution activity</h2>
            <p>{formatNumber(data?.totalContributions)} contributions in the last year</p>
          </div>
          <a href={`https://github.com/${encodeURIComponent(data?.account || "")}`} target="_blank" rel="noreferrer">
            View GitHub profile ↗
          </a>
        </div>
        <ContributionHeatmap weeks={data?.weeks || []} />
      </article>

      <article className="workspace-panel contribution-panel">
        <div className="contribution-panel-heading">
          <div>
            <h2>Monthly activity</h2>
            <p>Contribution totals grouped by month</p>
          </div>
        </div>
        <div className="contribution-month-chart">
          {monthlyTotals.map((month, index) => (
            <div className="contribution-month-column" key={index}>
              <strong>{formatNumber(month.total)}</strong>
              <div className="contribution-month-track">
                <span style={{ height: `${Math.max(3, (month.total / maxMonth) * 100)}%` }} />
              </div>
              <small>{month.label}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="workspace-panel contribution-panel">
        <div className="contribution-panel-heading">
          <div>
            <h2>Most active repositories</h2>
            <p>Repositories with the most commits, pull requests, and issues</p>
          </div>
        </div>
        {data?.repositories?.length ? (
          <div className="contribution-repository-list">
            {data.repositories.map(repository => (
              <a
                href={repository.url}
                target="_blank"
                rel="noreferrer"
                key={repository.name}
                className="contribution-repository-row"
              >
                <span>
                  <strong>{repository.name}</strong>
                  <small>{formatNumber(repository.contributions)} contributions</small>
                </span>
                <span className="contribution-repository-bar">
                  <i style={{
                    width: `${Math.max(2, (repository.contributions / data.repositories[0].contributions) * 100)}%`
                  }} />
                </span>
                <span className="contribution-repository-arrow">↗</span>
              </a>
            ))}
          </div>
        ) : (
          <p>No repository contribution details were returned by GitHub.</p>
        )}
      </article>

      <p className="github-activity-footnote">
        Contribution totals are provided by GitHub and may include private contributions. Private repository names are only shown when your connected account has access to them.
      </p>
    </section>
  );
}
