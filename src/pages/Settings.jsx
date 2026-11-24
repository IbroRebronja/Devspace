import React, { useEffect, useState } from "react";
import DataControls from "../components/DataControls";
import { githubAPI } from "../services/api";
import "../styles/WorkspacePages.css";

export default function Settings() {
  const [githubStatus, setGithubStatus] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [githubLoading, setGithubLoading] = useState(true);
  const [repositoryLoading, setRepositoryLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectionResult = params.get("github");

    if (connectionResult === "connected") {
      setConnectionMessage("Your GitHub account has been connected successfully.");
    } else if (connectionResult === "error") {
      setGithubError("GitHub connection could not be completed. Please try again.");
    } else if (connectionResult === "cancelled") {
      setConnectionMessage("GitHub authorization was cancelled.");
    }

    async function loadGitHubStatus() {
      try {
        const result = await githubAPI.getStatus();
        setGithubStatus(result);

        if (result.connected) {
          setRepositoryLoading(true);
          const repositoryResult = await githubAPI.getRepositories();
          setRepositories(repositoryResult.repositories || []);
        }
      } catch (error) {
        setGithubError(error.message || "Could not load GitHub connection details.");
      } finally {
        setGithubLoading(false);
        setRepositoryLoading(false);
      }
    }

    loadGitHubStatus();
  }, []);

  function connectGitHub() {
    window.location.assign(githubAPI.connectUrl);
  }

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
        <h2>GitHub</h2>
        <p>Connect your GitHub account to view repositories you can access.</p>

        {connectionMessage && (
          <p role="status" style={{ color: "#24845a" }}>
            {connectionMessage}
          </p>
        )}

        {githubError && (
          <p role="alert" style={{ color: "#c04452" }}>
            {githubError}
          </p>
        )}

        {githubLoading ? (
          <p>Checking GitHub connection...</p>
        ) : githubStatus?.connected ? (
          <>
            <div className="settings-profile" style={{ marginTop: "16px" }}>
              {githubStatus.connection?.avatarUrl ? (
                <img
                  src={githubStatus.connection.avatarUrl}
                  alt="GitHub profile"
                  width="44"
                  height="44"
                  style={{ borderRadius: "50%" }}
                />
              ) : (
                <div className="avatar">GH</div>
              )}
              <div>
                <strong>{githubStatus.connection?.githubUsername}</strong>
                <small>GitHub account connected</small>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  color: "#24845a",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                Connected
              </span>
            </div>

            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>
                Your repositories
              </h3>

              {repositoryLoading ? (
                <p>Loading repositories...</p>
              ) : repositories.length > 0 ? (
                <div>
                  {repositories.map((repository) => (
                    <div
                      key={repository.id}
                      style={{
                        padding: "14px 0",
                        borderTop: "1px solid #edecf3",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#7159df",
                            fontSize: "13px",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          {repository.fullName}
                        </a>
                        {repository.description && (
                          <p style={{ margin: "5px 0 0" }}>
                            {repository.description}
                          </p>
                        )}
                        <small style={{ color: "#9291a2", fontSize: "11px" }}>
                          {repository.language || "Language not specified"}
                          {" · "}
                          {repository.isPrivate ? "Private" : "Public"}
                          {" · "}
                          {repository.stars} stars
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No repositories were returned for this GitHub account.</p>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            className="workspace-link-button"
            onClick={connectGitHub}
          >
            Connect GitHub
          </button>
        )}
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
