import DataControls from "../components/DataControls";
import React from "react";
import DataControls from "../components/DataControls";
import "../styles/WorkspacePages.css";

export default function Settings() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <span className="section-kicker">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your DevSpace preferences and data.</p>
        </div>
      </div>

      <article className="workspace-panel">
        <h2>Profile</h2>
        <div className="settings-profile">
          <div className="avatar">IR</div>
          <div>
            <strong>Ibro Rebronja</strong>
            <small>Frontend Developer</small>
          </div>
        </div>
        <p className="settings-note">
          Profile editing and account management are not
          connected to a backend yet.
        </p>
      </article>

      <article className="workspace-panel">
        <DataControls />
      </article>

      <article className="workspace-panel">
        <h2>Application</h2>
        <p>
          DevSpace currently stores project data in React state.
          Changes are not permanently saved to an account or
          remote database.
        </p>
      </article>
    </section>
  );
}
