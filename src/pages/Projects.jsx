
import React from "react";
import ProjectCard from "../components/ProjectCard";
import "../styles/WorkspacePages.css";

export default function Projects({
  projects,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <span className="section-kicker">YOUR WORKSPACE</span>
          <h1>My Projects</h1>
          <p>Manage your projects and track their progress.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onAdd}
        >
          + Add project
        </button>
      </div>

      <div className="project-count">
        {projects.length} Projects
      </div>

      {projects.length > 0 ? (
        <div className="workspace-project-grid">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      ) : (
        <div className="workspace-panel">
          <h2>No projects yet</h2>
          <p>Create your first project to get started.</p>

          <button
            type="button"
            className="primary-button"
            onClick={onAdd}
          >
            Create project
          </button>
        </div>
      )}
    </section>
  );
}
