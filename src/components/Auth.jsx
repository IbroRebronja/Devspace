import React, { useEffect, useRef, useState } from "react";
import { authAPI } from "../services/api";
import "../styles/Auth.css";

export default function Auth({ onLogin }) {
  const params = new URLSearchParams(window.location.search);
  const verificationToken = params.get("verifyEmail");
  const resetToken = params.get("resetPassword");

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

            {verificationPending && mode !== "reset" && (
              <div className="auth-notice" role="status">
                <p>Check your email for a verification link before signing in.</p>
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
