
import React, { useState } from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ProjectCard from "../components/ProjectCard";

import { initialProjects } from "../data/projects";

import "../styles/Dashboard.css";

export default function Dashboard() {
  const [projects, setProjects] = useState(initialProjects);
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const allTasks = projects.flatMap(project => project.tasks);

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
              tasks: project.tasks.map(task =>
                task.id === taskId
                  ? { ...task, done: !task.done }
                  : task
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
        />

        <div className="dashboard-content">

          {/* Welcome section */}
          <section className="welcome">
            <div>
              <div className="eyebrow">
                SUNDAY, NOVEMBER 15, 2026
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

          {/* Statistics */}
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

          {/* Progress overview */}
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

          {/* Project cards */}
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

              <span className="project-count">
                {projects.length} Projects
              </span>
            </div>

            <div className="projects-grid">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onToggle={toggleTask}
                />
              ))}
            </div>
          </section>


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
    </div>
  );
}
