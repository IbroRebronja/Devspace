
import React, { useEffect, useState } from "react";

import Projects from "./Projects";
import Tasks from "./Tasks";
import Calendar from "./Calendar";
import Settings from "./Settings";
import Support from "./Support";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ProjectCard from "../components/ProjectCard";
import ProjectForm from "../components/ProjectForm";

import { initialProjects } from "../data/projects";

import "../styles/Dashboard.css";

const STORAGE_KEY = "devspace-projects-v1";

const routeToPage = {
  "/": "Overview",
  "/projects": "My Projects",
  "/tasks": "My Tasks",
  "/calendar": "Calendar",
  "/settings": "Settings",
  "/support": "Help Center",
};

const pageToRoute = {
  "Overview": "/",
  "My Projects": "/projects",
  "My Tasks": "/tasks",
  "Calendar": "/calendar",
  "Settings": "/settings",
  "Help Center": "/support",
};

function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Could not load saved projects:", error);
  }

  return initialProjects;
}

export default function Dashboard() {
  const [projects, setProjects] = useState(loadProjects);

  const [active, setActiveState] = useState(
    routeToPage[window.location.pathname] || "Overview"
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Could not save projects:", error);
    }
  }, [projects]);

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

  function toggleTask(projectId, taskId) {
    setProjects(current =>
      current.map(project =>
        project.id === projectId
          ? {
              ...project,
              tasks: (project.tasks || []).map(task =>
                task.id === taskId
                  ? { ...task, done: !task.done }
                  : task
              ),
            }
          : project
      )
    );
  }

  function openNewProjectForm() {
    setEditingProject(null);
    setProjectFormOpen(true);
  }

  function openEditProjectForm(project) {
    setEditingProject(project);
    setProjectFormOpen(true);
  }

  function saveProject(projectData) {
    setProjects(current => {
      const exists = current.some(
        project => project.id === projectData.id
      );

      if (exists) {
        return current.map(project =>
          project.id === projectData.id
            ? projectData
            : project
        );
      }

      return [...current, projectData];
    });

    setProjectFormOpen(false);
    setEditingProject(null);
  }

  function deleteProject(projectId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? Its tasks will also be deleted."
    );

    if (!confirmed) return;

    setProjects(current =>
      current.filter(project => project.id !== projectId)
    );
  }

  function addTask(projectId, task) {
    setProjects(current =>
      current.map(project =>
        project.id === projectId
          ? {
              ...project,
              tasks: [...(project.tasks || []), task],
            }
          : project
      )
    );
  }

  function editTask(projectId, updatedTask) {
    setProjects(current =>
      current.map(project =>
        project.id === projectId
          ? {
              ...project,
              tasks: (project.tasks || []).map(task =>
                task.id === updatedTask.id ? updatedTask : task
              ),
            }
          : project
      )
    );
  }

  function deleteTask(projectId, taskId) {
    setProjects(current =>
      current.map(project =>
        project.id === projectId
          ? {
              ...project,
              tasks: (project.tasks || []).filter(
                task => task.id !== taskId
              ),
            }
          : project
      )
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
        />

        <div className="dashboard-content">

          {/* OVERVIEW */}
          {active === "Overview" && (
            <>
              <section className="welcome">
                <div>
                  <div className="eyebrow">
                    MONDAY, NOVEMBER 16, 2026
                  </div>

                  <h1>
                    Good evening, Ibro <span>✦</span>
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
                  icon="▦"
                  color="purple"
                />

                <StatCard
                  label="Total tasks"
                  value={total}
                  detail={`${total - completed} tasks remaining`}
                  icon="✓"
                  color="blue"
                />

                <StatCard
                  label="Completed tasks"
                  value={completed}
                  detail={`${overallProgress}% overall completion`}
                  icon="↗"
                  color="green"
                />

                <StatCard
                  label="Hours logged"
                  value="24h"
                  detail="This week"
                  icon="◷"
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
                      Keep going! Every completed task counts.
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
                    <span>✦</span>

                    {completed === total
                      ? "Amazing work! All tasks are complete."
                      : "You're making progress. Keep it up!"}
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
