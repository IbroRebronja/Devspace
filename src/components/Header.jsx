
import React from "react";

export default function Header({ active, setMobileOpen }) {
  return (
    <header className="topbar">
      <button
        className="menu-button"
        onClick={() => setMobileOpen(true)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      <div className="breadcrumb">
        Workspace / <strong>{active}</strong>
      </div>

      <div className="topbar-right">
        <button className="notification" aria-label="Notifications">
          ♧
        </button>
        <div className="avatar small-avatar">IR</div>
      </div>
    </header>
  );
}
