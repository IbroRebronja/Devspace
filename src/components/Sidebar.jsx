
import React from "react";
import "../styles/Sidebar.css";

export default function Sidebar({
  active,
  setActive,
  mobileOpen,
  setMobileOpen,
}) {
  const links = [
    ["⌂", "Overview"],
    ["▦", "My Projects"],
    ["✓", "My Tasks"],
    ["◷", "Calendar"],
    ["⚙", "Settings"],
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">D</div>
          <span>DevSpace</span>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {links.map(([icon, label]) => (
            <button
              key={label}
              className={`nav-link ${
                active === label ? "active" : ""
              }`}
              onClick={() => {
                setActive(label);
                setMobileOpen(false);
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <strong>Need help?</strong>
            <p>Visit our help center for support.</p>
            <button onClick={() => setActive("Help Center")}>
              Get support →
            </button>
          </div>

          <div className="profile">
            <div className="avatar">IR</div>
            <div>
              <strong>Ibro Rebronja</strong>
              <small>Frontend Developer</small>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>
    </>
  );
}
