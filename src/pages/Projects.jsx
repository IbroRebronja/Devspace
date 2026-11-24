import React, { useMemo, useState } from "react";
import ProjectCard from "../components/ProjectCard";
import "../styles/WorkspacePages.css";
import "../styles/Projects.css";

const categories = ["All", "Frontend", "Backend", "Full Stack"];

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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const safeProjects = projects || [];
  const allTasks = safeProjects.flatMap(project => project.tasks || []);
  const completedTasks = allTasks.filter(task => task.done).length;
  const completion = allTasks.length
    ? Math.round((completedTasks / allTasks.length) * 100)
    : 0;

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return safeProjects.filter(project => {
      const matchesCategory =
        activeCategory === "All" || project.category === activeCategory;
      const matchesSearch =
        !term ||
        project.name?.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [safeProjects, search, activeCategory]);

  return (
    <section className="workspace-page projects-page">
      <div className="workspace-page-heading projects-page-heading">
        <div>
          <span className="section-kicker">YOUR WORKSPACE</span>
          <h1>My Projects</h1>
          <p>Keep your work organized and track progress across every project.</p>
        </div>

        <button type="button" className="primary-button" onClick={onAdd}>
          <span aria-hidden="true">+</span> Add project
        </button>
      </div>

      <div className="projects-overview" aria-label="Project overview">
        <div className="projects-overview-item">
          <span>Total projects</span>
          <strong>{safeProjects.length}</strong>
        </div>
        <div className="projects-overview-item">
          <span>Total tasks</span>
          <strong>{allTasks.length}</strong>
        </div>
        <div className="projects-overview-item">
          <span>Tasks completed</span>
          <strong>{completedTasks}</strong>
        </div>
        <div className="projects-overview-item projects-overview-progress">
          <div>
            <span>Overall completion</span>
            <strong>{completion}%</strong>
          </div>
          <div
            className="projects-overview-track"
            role="progressbar"
            aria-label="Overall task completion"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={completion}
          >
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {safeProjects.length > 0 ? (
        <>
          <div className="projects-toolbar">
            <div className="projects-toolbar-copy">
              <h2>All projects <span>{filteredProjects.length}</span></h2>
              <p>Browse and manage your current work.</p>
            </div>

            <label className="projects-search">
              <span className="projects-search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search projects"
                aria-label="Search projects"
              />
            </label>
          </div>

          <div className="projects-filters" aria-label="Filter projects by category">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? "active" : ""}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {filteredProjects.length > 0 ? (
            <div className="workspace-project-grid">
              {filteredProjects.map(project => (
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
            <div className="projects-empty-filter">
              <h3>No matching projects</h3>
              <p>Try another search term or category.</p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="workspace-panel projects-empty-state">
          <span className="projects-empty-mark" aria-hidden="true">+</span>
          <h2>No projects yet</h2>
          <p>Create your first project to organize tasks and follow its progress.</p>
          <button type="button" className="primary-button" onClick={onAdd}>
            Create your first project
          </button>
        </div>
      )}
    </section>
  );
}
