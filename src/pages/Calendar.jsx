import React, { useMemo, useState } from "react";
import "../styles/WorkspacePages.css";
import "../styles/Calendar.css";

function parseLocalDate(value) {
  if (!value) return null;

  const parts = String(value).split("-").map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [year, month, day] = parts;
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
    ? parsed
    : null;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function Calendar({ projects = [] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const today = startOfDay(new Date());

  const events = projects
    .map(project => ({
      id: project.id,
      title: project.name || "Untitled project",
      date: parseLocalDate(project.dueDate),
      category: project.category || "Project",
    }))
    .filter(event => event.date)
    .sort((a, b) => a.date - b.date);

  const overdue = events.filter(event => startOfDay(event.date) < today).length;
  const upcoming = events.length - overdue;

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter(event => {
      const eventDay = startOfDay(event.date);
      const isOverdue = eventDay < today;
      const matchesFilter =
        filter === "all" ||
        (filter === "upcoming" && !isOverdue) ||
        (filter === "overdue" && isOverdue);
      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [events, filter, search, today]);

  return (
    <section className="workspace-page calendar-page">
      <div className="workspace-page-heading calendar-page-heading">
        <div>
          <span className="section-kicker">WORKSPACE / SCHEDULE</span>
          <h1>Calendar</h1>
          <p>Track project deadlines and keep upcoming work on schedule.</p>
        </div>
        <div className="calendar-today">
          <span>Today</span>
          <strong>{today.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</strong>
        </div>
      </div>

      <div className="calendar-overview">
        <article className="calendar-stat-card">
          <span>Total deadlines</span>
          <strong>{events.length}</strong>
          <small>Projects with a valid due date</small>
        </article>
        <article className="calendar-stat-card">
          <span>Upcoming</span>
          <strong>{upcoming}</strong>
          <small>Due today or later</small>
        </article>
        <article className="calendar-stat-card">
          <span>Overdue</span>
          <strong>{overdue}</strong>
          <small>Past their due date</small>
        </article>
      </div>

      <section className="calendar-panel">
        <div className="calendar-panel-heading">
          <div>
            <h2>Project deadlines</h2>
            <p>{visibleEvents.length} {visibleEvents.length === 1 ? "deadline" : "deadlines"} shown, ordered by date</p>
          </div>
          <label className="calendar-search">
            <span className="sr-only">Search projects</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.8" cy="8.8" r="5.8" />
              <path d="m13.2 13.2 4 4" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search projects"
            />
          </label>
        </div>

        <div className="calendar-filters" aria-label="Filter deadlines">
          {[
            { value: "all", label: "All deadlines", count: events.length },
            { value: "upcoming", label: "Upcoming", count: upcoming },
            { value: "overdue", label: "Overdue", count: overdue },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              className={filter === option.value ? "active" : ""}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}<span>{option.count}</span>
            </button>
          ))}
        </div>

        {visibleEvents.length > 0 ? (
          <div className="calendar-event-list">
            {visibleEvents.map(event => {
              const eventDay = startOfDay(event.date);
              const isOverdue = eventDay < today;
              const isToday = eventDay.getTime() === today.getTime();

              return (
                <article className="calendar-event" key={event.id}>
                  <div className={`calendar-date-block ${isOverdue ? "overdue" : ""} ${isToday ? "today" : ""}`}>
                    <strong>{event.date.toLocaleDateString("en", { day: "2-digit" })}</strong>
                    <span>{event.date.toLocaleDateString("en", { month: "short" })}</span>
                  </div>
                  <div className="calendar-event-content">
                    <strong>{event.title}</strong>
                    <small>{event.category} project</small>
                  </div>
                  <div className="calendar-event-meta">
                    <span className={`calendar-deadline-status ${isOverdue ? "overdue" : isToday ? "today" : "upcoming"}`}>
                      {isOverdue ? "Overdue" : isToday ? "Due today" : "Upcoming"}
                    </span>
                    <small>{event.date.toLocaleDateString("en", { weekday: "short", year: "numeric" })}</small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="calendar-empty">
            <div className="calendar-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
            </div>
            <strong>{events.length === 0 ? "No project deadlines yet" : "No matching deadlines"}</strong>
            <p>
              {events.length === 0
                ? "Add a due date when creating or editing a project to see it here."
                : "Try another search or choose a different filter."}
            </p>
            {(search || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
