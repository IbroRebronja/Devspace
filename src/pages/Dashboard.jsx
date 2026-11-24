
import React, { useEffect, useState } from "react";

import Projects from "./Projects";
import Tasks from "./Tasks";
import Calendar from "./Calendar";
import Settings from "./Settings";
import Support from "./Support";
import GitHubActivity from "./GitHubActivity";
import GitHubContributions from "./GitHubContributions";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ProjectCard from "../components/ProjectCard";
import ProjectForm from "../components/ProjectForm";

import {
  projectsAPI,
  tasksAPI,
} from "../services/api";

import "../styles/Dashboard.css";

const routeToPage = {
  "/": "Overview",
  "/projects": "My Projects",
  "/tasks": "My Tasks",
  "/calendar": "Calendar",
  "/github-activity": "GitHub Activity",
  "/contributions": "Contributions",
  "/settings": "Settings",
  "/support": "Help Center",
};

const pageToRoute = {
  "Overview": "/",
  "My Projects": "/projects",
  "My Tasks": "/tasks",
  "Calendar": "/calendar",
  "GitHub Activity": "/github-activity",
  "Contributions": "/contributions",
  "Settings": "/settings",
  "Help Center": "/support",
};

export default function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [active, setActiveState] = useState(
    routeToPage[window.location.pathname] || "Overview"
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);

  // Load this user's projects from PostgreSQL.
  useEffect(() => {
    async function loadProjects() {
      try {
        setError("");
        const result = await projectsAPI.getAll();
        setProjects(result.projects || []);
      } catch (err) {
        setError(err.message || "Could not load your projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  // Handle browser back and forward navigation.
  useEffect(() => {
    function handlePopState() {
      setActiveState(
        routeToPage[window.location.pathname] || "Overview"
      );
      setMobileOpen(false);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function setActive(page) {
    const path = pageToRoute[page] || "/";

    setActiveState(page);
    setMobileOpen(false);

    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  }

  const allTasks = projects.flatMap(project => project.tasks || []);
  const completed = allTasks.filter(task => task.done).length;
  const total = allTasks.length;

  const overallProgress = total
    ? Math.round((completed / total) * 100)
    : 0;

  function showError(message) {
    setError(message || "Something went wrong. Please try again.");
  }

  // Toggle a task and save the change to PostgreSQL.
  async function toggleTask(projectId, taskId) {
    const project = projects.find(item => item.id === projectId);
    const task = project?.tasks?.find(item => item.id === taskId);

    if (!task) return;

    try {
      setError("");

      const result = await tasksAPI.update(taskId, {
        done: !task.done,
      });

      setProjects(current =>
        current.map(item =>
          item.id === projectId
            ? {
                ...item,
                tasks: item.tasks.map(existing =>
                  existing.id === taskId ? result.task : existing
                ),
              }
            : item
        )
      );
    } catch (err) {
      showError(err.message);
    }
  }

  function openNewProjectForm() {
    setEditingProject(null);
    setProjectFormOpen(true);
  }

  function openEditProjectForm(project) {
    setEditingProject(project);
    setProjectFormOpen(true);
  }

  // Create or update a project in PostgreSQL.
  async function saveProject(projectData) {
    try {
      setError("");

      let result;

      if (editingProject) {
        result = await projectsAPI.update(
          editingProject.id,
          projectData
        );

        setProjects(current =>
          current.map(project =>
            project.id === editingProject.id
              ? result.project
              : project
          )
        );
      } else {
        result = await projectsAPI.create(projectData);
        setProjects(current => [...current, result.project]);
      }

      setProjectFormOpen(false);
      setEditingProject(null);
    } catch (err) {
      showError(err.message);
    }
  }

  // Delete a project and its associated tasks.
  async function deleteProject(projectId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? Its tasks will also be deleted."
    );

    if (!confirmed) return;

    try {
      setError("");
      await projectsAPI.delete(projectId);

      setProjects(current =>
        current.filter(project => project.id !== projectId)
      );
    } catch (err) {
      showError(err.message);
    }
  }

  // Create a task inside a project.
  async function addTask(projectId, task) {
    try {
      setError("");

      const result = await tasksAPI.create(projectId, {
        title: task.title,
        done: task.done,
      });

      setProjects(current =>
        current.map(project =>
          project.id === projectId
            ? {
                ...project,
                tasks: [...(project.tasks || []), result.task],
              }
            : project
        )
      );
    } catch (err) {
      showError(err.message);
    }
  }

  // Update an existing task.
  async function editTask(projectId, updatedTask) {
    try {
      setError("");

      const result = await tasksAPI.update(updatedTask.id, {
        title: updatedTask.title,
        done: updatedTask.done,
      });

      setProjects(current =>
        current.map(project =>
          project.id === projectId
            ? {
                ...project,
                tasks: project.tasks.map(task =>
                  task.id === updatedTask.id ? result.task : task
                ),
              }
            : project
        )
      );
    } catch (err) {
      showError(err.message);
    }
  }

  // Delete a task.
  async function deleteTask(projectId, taskId) {
    try {
      setError("");
      await tasksAPI.delete(taskId);

      setProjects(current =>
        current.map(project =>
          project.id === projectId
            ? {
                ...project,
                tasks: project.tasks.filter(task => task.id !== taskId),
              }
            : project
        )
      );
    } catch (err) {
      showError(err.message);
    }
  }

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 18 ? "Good afternoon" :
    "Good evening";

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        <Header
          active={active}
          setMobileOpen={setMobileOpen}
          mobileOpen={mobileOpen}
          user={user}
          onLogout={onLogout}
        />

        <div className="dashboard-content">

          {error && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                marginBottom: "20px",
                borderRadius: "8px",
                background: "#3a2025",
                color: "#ffb8c0",
              }}
            >
              {error}
              <button
                type="button"
                onClick={() => setError("")}
                style={{
                  float: "right",
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {active === "Overview" && (
            <>
              <section className="welcome">
                <div>
                  <div className="eyebrow">
                    {formattedDate}
                  </div>

                  <h1>
                    {greeting}, {firstName}
                  </h1>

                  <p>
                    Here's what's happening with your projects today.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    document.getElementById("projects")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  View projects <span>→</span>
                </button>
              </section>

              <section className="stats-grid">
                <StatCard
                  label="Assigned projects"
                  value={projects.length}
                  detail="Currently in progress"
                  icon="projects"
                  color="blue"
                />

                <StatCard
                  label="Total tasks"
                  value={total}
                  detail={`${total - completed} tasks remaining`}
                  icon="tasks"
                  color="blue"
                />

                <StatCard
                  label="Completed tasks"
                  value={completed}
                  detail={`${overallProgress}% overall completion`}
                  icon="completed"
                  color="green"
                />

                <StatCard
                  label="Tasks remaining"
                  value={total - completed}
                  detail="Across all projects"
                  icon="remaining"
                  color="orange"
                />
              </section>

              <section className="overview-grid">
                <article className="progress-summary">
                  <div>
                    <span className="section-kicker">
                      YOUR PERFORMANCE
                    </span>

                    <h2>Overall progress</h2>

                    <p>
                      {total === 0
                        ? "Add tasks to your projects to see your progress."
                        : "A clear view of completed work across all your projects."}
                    </p>
                  </div>

                  <div
                    className="progress-circle"
                    style={{
                      "--progress": `${overallProgress * 3.6}deg`,
                    }}
                  >
                    <div className="circle-inner">
                      <strong>{overallProgress}%</strong>
                      <span>Completed</span>
                    </div>
                  </div>

                  <div className="summary-bottom">
                    <span>
                      <i className="dot purple-dot" />
                      {completed} completed
                    </span>

                    <span>
                      <i className="dot gray-dot" />
                      {total - completed} remaining
                    </span>
                  </div>
                </article>

                <article className="activity-card">
                  <span className="section-kicker">
                    QUICK OVERVIEW
                  </span>

                  <h2>Task breakdown</h2>

                  <div className="breakdown-row">
                    <span>Completed</span>
                    <strong>{completed}</strong>
                  </div>

                  <div className="breakdown-track">
                    <div style={{ width: `${overallProgress}%` }} />
                  </div>

                  <div className="breakdown-row">
                    <span>In progress / Remaining</span>
                    <strong>{total - completed}</strong>
                  </div>

                  <div className="breakdown-track muted-track">
                    <div
                      style={{
                        width: `${100 - overallProgress}%`,
                      }}
                    />
                  </div>

                  <div className="activity-note">
                    {total === 0
                      ? "No tasks yet. Add a task to start tracking progress."
                      : completed === total
                        ? "All tasks are complete."
                        : "Tasks left to complete: " + (total - completed)}
                  </div>
                </article>
              </section>

              <section className="projects-section" id="projects">
                <div className="section-header">
                  <div>
                    <span className="section-kicker">
                      YOUR WORKSPACE
                    </span>

                    <h2>Assigned projects</h2>

                    <p>
                      Manage your projects and track your progress.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={openNewProjectForm}
                  >
                    + Add project
                  </button>
                </div>

                <div className="projects-grid">
                  {projects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onToggle={toggleTask}
                      onEdit={openEditProjectForm}
                      onDelete={deleteProject}
                      onAddTask={addTask}
                      onEditTask={editTask}
                      onDeleteTask={deleteTask}
                    />
                  ))}
                </div>

                {projects.length === 0 && (
                  <div className="projects-empty-state">
                    <strong>No projects yet</strong>
                    <p>Create your first project to organize tasks and track progress.</p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={openNewProjectForm}
                    >
                      Create your first project
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {/* MY PROJECTS */}
          {active === "My Projects" && (
            <Projects
              projects={projects}
              onToggle={toggleTask}
              onAdd={openNewProjectForm}
              onEdit={openEditProjectForm}
              onDelete={deleteProject}
              onAddTask={addTask}
              onEditTask={editTask}
              onDeleteTask={deleteTask}
            />
          )}

          {/* MY TASKS */}
          {active === "My Tasks" && (
            <Tasks
              projects={projects}
              onToggle={toggleTask}
            />
          )}

          {/* CALENDAR */}
          {active === "Calendar" && (
            <Calendar projects={projects} />
          )}

          {/* GITHUB ACTIVITY */}
          {active === "GitHub Activity" && (
            <GitHubActivity onOpenSettings={() => setActive("Settings")} />
          )}

          {/* GITHUB CONTRIBUTIONS */}
          {active === "Contributions" && (
            <GitHubContributions onOpenSettings={() => setActive("Settings")} />
          )}

          {/* SETTINGS */}
          {active === "Settings" && <Settings />}

          {/* SUPPORT */}
          {active === "Help Center" && <Support />}

          <footer className="site-footer">
            <span>© 2026 DevSpace</span>

            <nav aria-label="Legal information">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/cookies">Cookies</a>
              <a href="/refunds">Refunds</a>
            </nav>
          </footer>
        </div>
      </main>

      {projectFormOpen && (
        <ProjectForm
          project={editingProject}
          onSave={saveProject}
          onCancel={() => {
            setProjectFormOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}
