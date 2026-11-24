import React, { useCallback, useEffect, useMemo, useState } from "react";
import { githubAPI } from "../services/api";
import "../styles/WorkspacePages.css";
import "../styles/GitHubContributions.css";

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

  if (!weeks.length || !days.length) {
    return <div className="contribution-empty">No daily contribution data was returned by GitHub.</div>;
  }

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
          <span>Sun</span><span /><span>Tue</span><span /><span>Thu</span><span /><span>Sat</span>
        </div>
        {weeks.map((week, index) => (
          <div className="contribution-week" key={index}>
            {(week.contributionDays || []).map(day => {
              const date = new Date(day.date + "T00:00:00");
              const label = date.toLocaleDateString(undefined, {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
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
      <div className="contribution-legend" aria-label="Contribution activity scale">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <span key={level} className={`contribution-day level-${level}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16.2 8A6.5 6.5 0 0 0 4.7 5.2L3.5 6.5M3.5 6.5V3.8M3.5 6.5h2.8M3.8 12A6.5 6.5 0 0 0 15.3 14.8l1.2-1.3m0 0v2.7m0-2.7h-2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
      <section className="workspace-page github-contributions-page">
        <div className="workspace-panel github-contributions-loading">
          <span className="github-contributions-loader" />
          Loading GitHub contributions...
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="workspace-page github-contributions-page">
        <div className="workspace-page-heading">
          <div>
            <span className="section-kicker">GITHUB INSIGHTS</span>
            <h1>Contributions</h1>
            <p>A view of your contribution activity over the last 365 days.</p>
          </div>
        </div>
        <div className="workspace-panel github-contributions-error" role="alert">
          <strong>Could not load contribution data</strong>
          <p>{error}</p>
          <div className="github-contributions-actions">
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
  const stats = [
    { label: "Total contributions", value: data?.totalContributions, detail: "Across the last 365 days", featured: true },
    { label: "Commits", value: totals.commits, detail: "Code contributions" },
    { label: "Pull requests", value: totals.pullRequests, detail: "Pull requests opened" },
    { label: "Issues", value: totals.issues, detail: "Issues opened" },
    { label: "Reviews", value: totals.reviews, detail: "Pull request reviews" },
  ];

  return (
    <section className="workspace-page github-contributions-page">
      <div className="workspace-page-heading github-contributions-heading">
        <div>
          <span className="section-kicker">GITHUB INSIGHTS</span>
          <h1>Contributions</h1>
          <p>
            Your GitHub activity over the last 365 days
            {data?.account ? <> for <strong>{data.account}</strong></> : ""}.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button github-contributions-refresh"
          onClick={() => loadContributions(true)}
          disabled={refreshing}
        >
          <RefreshIcon />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="contribution-stat-grid">
        {stats.map(stat => (
          <article className={`workspace-summary${stat.featured ? " contribution-total-card" : ""}`} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{formatNumber(stat.value)}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </div>

      {error && <p className="repo-warning" role="alert">{error}</p>}

      <article className="workspace-panel contribution-panel">
        <div className="contribution-panel-heading">
          <div>
            <h2>Contribution activity</h2>
            <p><strong>{formatNumber(data?.totalContributions)}</strong> contributions in the last year</p>
          </div>
          {data?.account && (
            <a href={`https://github.com/${encodeURIComponent(data.account)}`} target="_blank" rel="noreferrer">
              View GitHub profile <span aria-hidden="true">↗</span>
            </a>
          )}
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
        {monthlyTotals.length ? (
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
        ) : (
          <div className="contribution-empty">No monthly contribution totals are available.</div>
        )}
      </article>

      <article className="workspace-panel contribution-panel">
        <div className="contribution-panel-heading">
          <div>
            <h2>Most active repositories</h2>
            <p>Repositories ranked by contribution count</p>
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
                <span className="contribution-repository-info">
                  <strong>{repository.name}</strong>
                  <small>{formatNumber(repository.contributions)} contributions</small>
                </span>
                <span className="contribution-repository-bar" aria-hidden="true">
                  <i style={{
                    width: `${Math.max(2, (repository.contributions / Math.max(1, data.repositories[0].contributions)) * 100)}%`
                  }} />
                </span>
                <span className="contribution-repository-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="contribution-empty">No repository contribution details were returned by GitHub.</div>
        )}
      </article>

      <p className="github-contributions-footnote">
        Contribution totals are provided by GitHub and may include private contributions. Private repository names are only shown when your connected account has access to them.
      </p>
    </section>
  );
}
