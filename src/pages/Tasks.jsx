
import React from "react";
import "../styles/WorkspacePages.css";

export default function Tasks({ projects, onToggle }) {
  const tasks = projects.flatMap(project =>
    project.tasks.map(task => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    }))
  );

  const completed = tasks.filter(task => task.done).length;

  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <span className="section-kicker">YOUR WORKSPACE</span>
          <h1>My Tasks</h1>
          <p>Keep track of everything that needs to get done.</p>
        </div>
      </div>

      <div className="workspace-summary">
        <strong>{completed} of {tasks.length} completed</strong>
        <div className="workspace-track">
          <div
            style={{
              width: tasks.length
                ? `${(completed / tasks.length) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

      <div className="workspace-list">
        {tasks.map(task => (
          <label className="workspace-task" key={task.id}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(task.projectId, task.id)}
            />
            <span className={task.done ? "workspace-task-done" : ""}>
              <strong>{task.title}</strong>
              <small>{task.projectName}</small>
            </span>
            <span className="task-status">
              {task.done ? "Completed" : "Pending"}
            </span>
          </label>
        ))}
      </div>

      {tasks.length === 0 && <p>No tasks yet.</p>}
    </section>
  );
}
