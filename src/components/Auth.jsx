import React, { useEffect, useRef, useState } from "react";
import { authAPI } from "../services/api";
import "../styles/Auth.css";

export default function Auth({ onLogin }) {
  const params = new URLSearchParams(window.location.search);
  const verificationToken = params.get("verifyEmail");
  const resetToken = params.get("resetPassword");
  const githubLoginStatus = params.get("githubLogin");
  const githubLoginReason = params.get("reason");

  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!githubLoginStatus) return;
    if (githubLoginStatus === "error") {
      setError(githubLoginReason || "GitHub sign-in could not be completed.");
    } else if (githubLoginStatus === "cancelled") {
      setNotice("GitHub sign-in was cancelled.");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [githubLoginStatus, githubLoginReason]);

  useEffect(() => {
    if (!verificationToken || verificationStarted.current) return;

    verificationStarted.current = true;
    setLoading(true);

    authAPI.verifyEmail(verificationToken)
      .then((result) => {
        setNotice(result.message || "Email verified. You can now sign in.");
        setMode("login");
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch((err) => {
        setError(err.message || "This verification link is invalid or expired.");
        window.history.replaceState({}, "", window.location.pathname);
      })
      .finally(() => setLoading(false));
  }, [verificationToken]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (mode === "register") {
        const result = await authAPI.register({ name, email, password });
        setVerificationPending(true);
        setNotice(result.message || "Check your inbox for a verification email.");
        setPassword("");
        return;
      }

      if (mode === "forgot") {
        const result = await authAPI.forgotPassword(email);
        setNotice(result.message || "If an account exists, a reset email has been sent.");
        return;
      }

      if (mode === "reset") {
        const result = await authAPI.resetPassword(resetToken, password);
        setNotice(result.message || "Password reset. You can now sign in.");
        setPassword("");
        setMode("login");
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }

      const result = await authAPI.login({ email, password });
      onLogin(result.user);
    } catch (err) {
      setError(err.message || "The request could not be completed.");

      if (err.data?.requiresVerification) {
        setVerificationPending(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const result = await authAPI.resendVerification(email);
      setNotice(result.message);
    } catch (err) {
      setError(err.message || "Could not send the verification email.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setVerificationPending(false);
    setShowPassword(false);
  }

  const isPasswordMode = mode === "login" || mode === "register" || mode === "reset";
  const heading = {
    login: "Sign in to your account",
    register: "Create your account",
    forgot: "Reset your password",
    reset: "Choose a new password",
  }[mode];

  const description = {
    login: "Enter your details to access your workspace.",
    register: "Create an account to start organising your work.",
    forgot: "Enter your account email and we will send a reset link if it exists.",
    reset: "Choose a new password for your DevSpace account.",
  }[mode];

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
                {mode === "login" ? "WELCOME BACK" : mode === "register" ? "GET STARTED" : "ACCOUNT SECURITY"}
              </span>
              <h1>{heading}</h1>
              <p>{description}</p>
            </div>

            {(mode === "login" || mode === "register") && (
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
            )}

            {mode === "login" && (
              <>
                <a className="auth-github-button" href={authAPI.githubLoginUrl}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.05c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.75 2.08 3.34 1.59.1-.72.39-1.22.7-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.24-5.1 5.51.4.35.75 1.03.75 2.08V22c0 .29.2.63.76.53A11.1 11.1 0 0 0 12 .9Z"/>
                  </svg>
                  Continue with GitHub
                </a>
                <div className="auth-divider"><span>or continue with email</span></div>
              </>
            )}

            {verificationPending && mode !== "reset" && (
              <div className="auth-notice" role="status">
                <button type="button" className="auth-text-button" onClick={handleResendVerification} disabled={loading || !email}>
                  Resend verification email
                </button>
              </div>
            )}

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

              {(mode !== "reset") && (
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
              )}

              {isPasswordMode && (
                <label className="auth-field">
                  <span>{mode === "reset" ? "New password" : "Password"}</span>
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
                  {(mode === "register" || mode === "reset") && (
                    <small className="auth-field-hint">Use at least 8 characters.</small>
                  )}
                </label>
              )}

              {error && <p className="auth-error" role="alert">{error}</p>}
              {notice && <p className="auth-notice" role="status">{notice}</p>}

              <button type="submit" className="auth-submit" disabled={loading || (verificationToken && !verificationStarted.current)}>
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in"
                    : mode === "register"
                      ? "Create account"
                      : mode === "forgot"
                        ? "Send reset link"
                        : "Reset password"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            {mode === "login" && (
              <button type="button" className="auth-text-button auth-forgot-link" onClick={() => changeMode("forgot")}>
                Forgot password?
              </button>
            )}

            {(mode === "forgot" || mode === "reset") && (
              <button type="button" className="auth-text-button auth-forgot-link" onClick={() => changeMode("login")}>
                Back to sign in
              </button>
            )}

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
