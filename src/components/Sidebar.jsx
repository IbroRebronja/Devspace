import React, { useState } from "react";
import "../styles/Sidebar.css";

const navigation = [
  {
    label: "Overview",
    icon: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    label: "My Projects",
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 4V2m8 2V2M3 9h18" /></>,
  },
  {
    label: "My Tasks",
    icon: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 12 2.5 2.5L16 9" /></>,
  },
  {
    label: "Calendar",
    icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  },
  {
    label: "GitHub Activity",
    icon: <><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6S17.6 1.2 15 3a13.3 13.3 0 0 0-7 0C5.4 1.2 3.2 2.5 3.2 2.5a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7A3.4 3.4 0 0 0 7 19.1V22" /></>,
  },
  {
    label: "Contributions",
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  },
  {
    label: "Settings",
    icon: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2z" /></>,
  },
];

function NavIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function Sidebar({
  active,
  setActive,
  mobileOpen,
  setMobileOpen,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
          {navigation.map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              className={`nav-link ${active === label ? "active" : ""}`}
              aria-current={active === label ? "page" : undefined}
              onClick={() => navigate(label)}
            >
              <span><NavIcon>{icon}</NavIcon></span>
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
              Get support <span aria-hidden="true">→</span>
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
