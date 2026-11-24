import React, { useMemo, useState } from "react";
import "../styles/WorkspacePages.css";
import "../styles/Tasks.css";

export default function Tasks({ projects, onToggle }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const tasks = projects.flatMap(project =>
    project.tasks.map(task => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    }))
  );

  const completed = tasks.filter(task => task.done).length;
  const pending = tasks.length - completed;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter(task => {
      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && task.done) ||
        (filter === "pending" && !task.done);

      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.projectName.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, search]);

  return (
    <section className="workspace-page tasks-page">
      <div className="workspace-page-heading tasks-page-heading">
        <div>
          <span className="section-kicker">WORKSPACE / TASKS</span>
          <h1>My Tasks</h1>
          <p>A clear view of what is done and what still needs your attention.</p>
        </div>
        <div className="tasks-progress-label">
          <strong>{progress}%</strong>
          <span>overall completion</span>
        </div>
      </div>

      <div className="tasks-overview">
        <article className="tasks-stat-card">
          <span className="tasks-stat-label">Total tasks</span>
          <strong>{tasks.length}</strong>
          <small>Across all projects</small>
        </article>
        <article className="tasks-stat-card">
          <span className="tasks-stat-label">To do</span>
          <strong>{pending}</strong>
          <small>Still in progress</small>
        </article>
        <article className="tasks-stat-card">
          <span className="tasks-stat-label">Completed</span>
          <strong>{completed}</strong>
          <small>Successfully finished</small>
        </article>
      </div>

      <section className="tasks-panel">
        <div className="tasks-panel-heading">
          <div>
            <h2>Task list</h2>
            <p>{filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"} shown</p>
          </div>
          <label className="tasks-search">
            <span className="sr-only">Search tasks or projects</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.8" cy="8.8" r="5.8" />
              <path d="m13.2 13.2 4 4" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search tasks or projects"
            />
          </label>
        </div>

        <div className="tasks-filters" aria-label="Filter tasks">
          {[
            { value: "all", label: "All tasks", count: tasks.length },
            { value: "pending", label: "To do", count: pending },
            { value: "completed", label: "Completed", count: completed },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              className={filter === option.value ? "active" : ""}
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
            >
              {option.label}<span>{option.count}</span>
            </button>
          ))}
        </div>

        {filteredTasks.length > 0 ? (
          <div className="tasks-list">
            {filteredTasks.map(task => (
              <label className={`tasks-row ${task.done ? "is-complete" : ""}`} key={task.id}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggle(task.projectId, task.id)}
                  aria-label={`Mark ${task.title} as ${task.done ? "to do" : "completed"}`}
                />
                <span className="tasks-checkbox-visual" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="m3.5 8 3 3 6-6" />
                  </svg>
                </span>
                <span className="tasks-row-content">
                  <strong>{task.title}</strong>
                  <small>{task.projectName}</small>
                </span>
                <span className={`tasks-status ${task.done ? "completed" : "pending"}`}>
                  {task.done ? "Completed" : "To do"}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="tasks-empty">
            <div className="tasks-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
              </svg>
            </div>
            <strong>{tasks.length === 0 ? "No tasks yet" : "No matching tasks"}</strong>
            <p>
              {tasks.length === 0
                ? "Add tasks to one of your projects and they will appear here."
                : "Try another search or switch to a different filter."}
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
