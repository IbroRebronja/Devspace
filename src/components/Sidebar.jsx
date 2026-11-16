
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
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">D</div>
          <span>DevSpace</span>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav aria-label="Main navigation">
          {links.map(([icon, label]) => (
            <button
              key={label}
              type="button"
              className={`nav-link ${
                active === label ? "active" : ""
              }`}
              aria-current={active === label ? "page" : undefined}
              onClick={() => {
                setActive(label);
                setMobileOpen(false);
              }}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <strong>Need help?</strong>
            <p>Visit our help center for support.</p>
            <button
              type="button"
              onClick={() => setActive("Help Center")}
            >
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
