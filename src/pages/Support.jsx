
import React from "react";
import "../styles/WorkspacePages.css";

export default function Support() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <span className="section-kicker">DEVSPACE HELP</span>
          <h1>Get support</h1>
          <p>Find help with your workspace and report problems.</p>
        </div>
      </div>

      <article className="workspace-panel">
        <h2>Need help with DevSpace?</h2>
        <p>
          You can report bugs, request improvements or ask
          questions through the project's GitHub repository.
        </p>

        <a
          className="workspace-link-button"
          href="https://github.com/IbroRebronja/Devspace/issues"
          target="_blank"
          rel="noreferrer"
        >
          Visit support and issues →
        </a>
      </article>

      <article className="workspace-panel">
        <h2>Common questions</h2>

        <div className="support-question">
          <strong>Where can I manage my projects?</strong>
          <p>Open My Projects in the sidebar.</p>
        </div>

        <div className="support-question">
          <strong>Where can I update my preferences?</strong>
          <p>Open Settings in the sidebar.</p>
        </div>

        <div className="support-question">
          <strong>Where can I track deadlines?</strong>
          <p>Open Calendar to view project deadlines.</p>
        </div>
      </article>
    </section>
  );
}
