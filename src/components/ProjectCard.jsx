
import React from "react";
import "../styles/ProjectCard.css";

export default function ProjectCard({ project, onToggle }) {
  const completed = project.tasks.filter(
    task => task.done
  ).length;

  const total = project.tasks.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <article className="project-card">
      <div className="project-top">
        <span className={`project-category ${project.color}`}>
          {project.category}
        </span>

        <button className="more-button" aria-label="More options">
          ···
        </button>
      </div>

      <h3>{project.name}</h3>

      <p className="project-description">
        {project.description}
      </p>

      <div className="progress-heading">
        <span>Progress</span>
        <strong>{progress}%</strong>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${project.color}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="project-footer">
        <span>
          {completed}/{total} tasks completed
        </span>
        <span>Due {project.dueDate}</span>
      </div>

      <div className="task-list">
        {project.tasks.map(task => (
          <label className="task-row" key={task.id}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(project.id, task.id)}
            />

            <span className={task.done ? "task-done" : ""}>
              {task.title}
            </span>
          </label>
        ))}
      </div>
    </article>
  );
}
