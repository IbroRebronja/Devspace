
import React from "react";
import ProjectCard from "../components/ProjectCard";
import "../styles/WorkspacePages.css";

export default function Projects({ projects, onToggle }) {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <span className="section-kicker">YOUR WORKSPACE</span>
          <h1>My Projects</h1>
          <p>Manage your projects and track their progress.</p>
        </div>
        <span className="project-count">
          {projects.length} Projects
        </span>
      </div>

      <div className="workspace-project-grid">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}
