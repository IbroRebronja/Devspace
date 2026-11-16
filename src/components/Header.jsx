import React from "react";

export default function Header({
  active,
  setMobileOpen,
  mobileOpen,
}) {
  return (
    <header className="topbar">
      <button
        className="menu-button"
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
      >
        ☰
      </button>

      <div className="breadcrumb">
        Workspace / <strong>{active}</strong>
      </div>

      <div className="topbar-right">
        <button
          className="notification"
          type="button"
          aria-label="Notifications"
        >
          ♧
        </button>

        <div className="avatar small-avatar">IR</div>
      </div>
    </header>
  );
}