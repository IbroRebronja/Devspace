import React, { useState } from "react";
import { authAPI } from "../services/api";
import "../styles/Auth.css";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;

      if (mode === "register") {
        result = await authAPI.register({ name, email, password });
      } else {
        result = await authAPI.login({ email, password });
      }

      onLogin(result.user);
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <a href="/" className="auth-brand" aria-label="DevSpace home">
            <span className="auth-brand-icon">D</span>
            <span>DevSpace</span>
          </a>

          <div className="auth-aside-content">
            <span className="auth-aside-kicker">YOUR WORKSPACE, IN SYNC</span>
            <h2>Build with focus.<br />Keep everything<br />in one place.</h2>
            <p>
              Organise projects, track tasks and keep your development
              workflow moving with DevSpace.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-check" aria-hidden="true">✓</span>
                <span>Project and task management</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-check" aria-hidden="true">✓</span>
                <span>GitHub activity and contributions</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-check" aria-hidden="true">✓</span>
                <span>A clear view of your progress</span>
              </div>
            </div>
          </div>

          <div className="auth-aside-footer">
            <span>DEVSPACE</span>
            <span>Developer workspace</span>
          </div>
        </aside>

        <section className="auth-main">
          <div className="auth-form-wrap">
            <div className="auth-mobile-brand">
              <span className="auth-brand-icon">D</span>
              <span>DevSpace</span>
            </div>

            <div className="auth-heading">
              <span className="auth-kicker">
                {mode === "login" ? "WELCOME BACK" : "GET STARTED"}
              </span>
              <h1>
                {mode === "login" ? "Sign in to your account" : "Create your account"}
              </h1>
              <p>
                {mode === "login"
                  ? "Enter your details to access your workspace."
                  : "Create an account to start organising your work."}
              </p>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Authentication options">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={mode === "login" ? "active" : ""}
                onClick={() => changeMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                className={mode === "register" ? "active" : ""}
                onClick={() => changeMode("register")}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === "register" && (
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label className="auth-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    maxLength={72}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {mode === "register" && (
                  <small className="auth-field-hint">Use at least 8 characters.</small>
                )}
              </label>

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="auth-footer">
              By continuing, you agree to use DevSpace responsibly.
            </p>

            <div className="auth-legal-links">
              <a href="/privacy">Privacy</a>
              <span>·</span>
              <a href="/terms">Terms</a>
              <span>·</span>
              <a href="/support">Help Center</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
