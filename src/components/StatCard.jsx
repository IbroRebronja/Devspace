import React from "react";

const iconPaths = {
  projects: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  tasks: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="m3.5 6 .8.8L5.8 5M3.5 12l.8.8 1.5-1.8M3.5 18l.8.8 1.5-1.8" />
    </>
  ),
  completed: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  remaining: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
};

export default function StatCard({ label, value, detail, icon, color }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color}`} aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {iconPaths[icon] || iconPaths.projects}
          </svg>
        </span>
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </article>
  );
}
