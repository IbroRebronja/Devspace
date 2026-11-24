
import React, { useState } from "react";
import "../styles/Sidebar.css";

export default function Sidebar({
  active,
  setActive,
  mobileOpen,
  setMobileOpen,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const links = [
    ["⌂", "Overview"],
    ["▦", "My Projects"],
    ["✓", "My Tasks"],
    ["◷", "Calendar"],
    ["⌘", "GitHub Activity"],
    ["⚙", "Settings"],
  ];

  function navigate(page) {
    setActive(page);
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }

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
              className={`nav-link ${active === label ? "active" : ""}`}
              aria-current={active === label ? "page" : undefined}
              onClick={() => navigate(label)}
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
            <button type="button" onClick={() => navigate("Help Center")}>
              Get support →
            </button>
          </div>

          <div className="profile">
            <div className="avatar">IR</div>

            <div className="profile-details">
              <strong>Ibro Rebronja</strong>
              <small>Frontend Developer</small>
            </div>

            <button
              type="button"
              className="profile-menu"
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen(open => !open)}
            >
              ···
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                <button type="button" onClick={() => navigate("Settings")}>
                  Profile and settings
                </button>
                <button type="button" onClick={() => navigate("Help Center")}>
                  Get support
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
