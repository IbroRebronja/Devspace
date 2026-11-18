
import React from "react";

export default function Header({
  active,
  setMobileOpen,
  mobileOpen,
  user,
  onLogout,
}) {
  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

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
        <div
          className="avatar small-avatar"
          title={user?.name || "User"}
        >
          {initials}
        </div>

        <button
          type="button"
          onClick={onLogout}
          title="Sign out of DevSpace"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "8px 12px",
            color: "inherit",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
